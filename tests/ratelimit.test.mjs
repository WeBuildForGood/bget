/**
 * Unit tests for worker/lib/ratelimit.js — sliding-window rate limiting.
 *
 * `enforceRateLimit` / `enforceEmailCooldown` are driven through a stubbed D1
 * binding so we can exercise the window logic deterministically: allow under
 * the limit, block at the limit, and fail open (loudly) when D1 errors.
 *
 * The limiter records the hit AND counts the window in one atomic
 * `INSERT ... RETURNING` statement, so the stub returns the post-insert bucket
 * rows from `all()` (or `first()` for the single-bucket email cooldown) and
 * captures the prune `DELETE` issued via `run()`.
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
  clientIp,
  hashIp,
  enforceRateLimit,
  enforceEmailCooldown,
  rateLimited,
} from "../worker/lib/ratelimit.js";

/** A request carrying a Cloudflare client IP (or any supplied headers). */
function makeRequest(headers = { "cf-connecting-ip": "203.0.113.7" }) {
  return new Request("https://buildforgood.world/api/problems", { method: "POST", headers });
}

/** One bucket row as returned by the atomic INSERT..RETURNING. */
function bucket(endpoint, { minute = 0, hour = 0, oldestMinute = 0, oldestHour = 0 } = {}) {
  return {
    endpoint,
    minute_count: minute,
    hour_count: hour,
    oldest_minute: oldestMinute,
    oldest_hour: oldestHour,
  };
}

/**
 * Build a fake D1 binding.
 *
 * @param {{buckets?: object[], emailRow?: object|null, failPrepare?: boolean,
 *   failAll?: boolean, failRun?: boolean}} opts
 */
function makeRateDb({
  buckets = [],
  emailRow = null,
  failPrepare = false,
  failAll = false,
  failRun = false,
} = {}) {
  const calls = { insert: null, insertBinds: [], prune: [] };
  const DB = {
    prepare(sql) {
      if (failPrepare) throw new Error("D1 prepare failed");
      return {
        _sql: sql,
        _bound: [],
        bind(...args) {
          this._bound = args;
          return this;
        },
        async all() {
          if (failAll) throw new Error("D1 query failed");
          if (/INSERT INTO rate_limits/i.test(sql)) {
            calls.insert = sql;
            calls.insertBinds = this._bound;
            return { results: buckets.map((row) => ({ ...row })) };
          }
          return { results: [] };
        },
        async first() {
          if (failAll) throw new Error("D1 query failed");
          if (/INSERT INTO rate_limits/i.test(sql)) {
            calls.insert = sql;
            calls.insertBinds = this._bound;
            return emailRow;
          }
          return null;
        },
        async run() {
          if (failRun) throw new Error("D1 write failed");
          if (/DELETE FROM rate_limits/i.test(sql)) {
            calls.prune.push({ sql: sql, binds: this._bound });
            return { success: true };
          }
          return { success: true };
        },
      };
    },
  };
  return { env: { DB }, calls };
}

/** Run `fn` with console.error temporarily silenced. */
async function quiet(fn) {
  const original = console.error;
  console.error = () => {};
  try {
    return await fn();
  } finally {
    console.error = original;
  }
}

// ---------------------------------------------------------------------------
// allow / block window logic
// ---------------------------------------------------------------------------
test("enforceRateLimit: allows and records a hit under the limits", async () => {
  const { env, calls } = makeRateDb({
    buckets: [bucket("/api/problems", { minute: 1, hour: 1 }), bucket("*", { minute: 1, hour: 1 })],
  });
  const result = await enforceRateLimit(env, makeRequest(), "/api/problems");

  assert.deepEqual(result, { ok: true });
  assert.match(calls.insert, /INSERT INTO rate_limits/);
  assert.match(calls.insert, /RETURNING/, "counts come back from the same atomic statement");
  assert.equal(calls.prune.length, 1, "one best-effort prune is issued");
  assert.match(calls.prune[0].sql, /DELETE FROM rate_limits/);
});

test("enforceRateLimit: allows at the boundary (counts include this request)", async () => {
  const { env } = makeRateDb({
    buckets: [
      bucket("/api/problems", { minute: 5, hour: 20 }),
      bucket("*", { minute: 15, hour: 60 }),
    ],
  });
  assert.deepEqual(await enforceRateLimit(env, makeRequest(), "/api/problems"), { ok: true });
});

test("enforceRateLimit: blocks when the per-minute window is full", async () => {
  const now = Math.floor(Date.now() / 1000);
  const { env } = makeRateDb({
    buckets: [
      bucket("/api/problems", { minute: 6, hour: 6, oldestMinute: now - 10 }),
      bucket("*", { minute: 1, hour: 1, oldestMinute: now - 30 }),
    ],
  });
  const result = await enforceRateLimit(env, makeRequest(), "/api/problems");

  assert.equal(result.ok, false);
  assert.equal(Number.isInteger(result.retryAfter), true);
  assert.ok(result.retryAfter >= 1, "retryAfter is at least 1 second");
  assert.ok(result.retryAfter <= 50, "mirrors the remaining minute window");
});

test("enforceRateLimit: blocks when the per-hour window is full", async () => {
  const now = Math.floor(Date.now() / 1000);
  const { env } = makeRateDb({
    buckets: [
      bucket("/api/problems", { minute: 0, hour: 21, oldestHour: now - 100 }),
      bucket("*", { minute: 0, hour: 1, oldestHour: now - 100 }),
    ],
  });
  const result = await enforceRateLimit(env, makeRequest(), "/api/problems");

  assert.equal(result.ok, false);
  assert.ok(result.retryAfter >= 1);
  assert.ok(result.retryAfter <= 3600);
});

test("enforceRateLimit: the global bucket trips before the endpoint bucket", async () => {
  const now = Math.floor(Date.now() / 1000);
  const { env } = makeRateDb({
    buckets: [
      bucket("/api/problems", { minute: 1, hour: 1 }),
      bucket("*", { minute: 16, hour: 16, oldestMinute: now - 5 }),
    ],
  });
  const result = await enforceRateLimit(env, makeRequest(), "/api/problems");

  assert.equal(result.ok, false);
  assert.ok(result.retryAfter <= 60, "reports the global minute window");
});

test("enforceRateLimit: hashes the IP and binds it (never the raw IP)", async () => {
  const { env, calls } = makeRateDb({
    buckets: [bucket("/api/problems", { minute: 1, hour: 1 }), bucket("*", { minute: 1, hour: 1 })],
  });
  const ip = "203.0.113.7";
  await enforceRateLimit(env, makeRequest({ "cf-connecting-ip": ip }), "/api/problems");

  assert.match(calls.insert, /INSERT INTO rate_limits/);
  const [ipHash, endpoint, now] = calls.insertBinds;
  assert.equal(typeof now, "number");
  assert.equal(endpoint, "/api/problems");
  assert.match(ipHash, /^[0-9a-f]{64}$/, "stored as a salted SHA-256 hex digest");
  assert.ok(!calls.insertBinds.includes(ip), "raw IP must never be bound");
});

test("enforceRateLimit: a different RATE_LIMIT_SALT yields a different hash", async () => {
  const buckets = [bucket("/api/problems", { minute: 1 }), bucket("*", { minute: 1 })];
  const a = makeRateDb({ buckets });
  const b = makeRateDb({ buckets });
  await enforceRateLimit(
    { DB: a.env.DB, RATE_LIMIT_SALT: "salt-one" },
    makeRequest(),
    "/api/problems",
  );
  await enforceRateLimit(
    { DB: b.env.DB, RATE_LIMIT_SALT: "salt-two" },
    makeRequest(),
    "/api/problems",
  );
  assert.notEqual(a.calls.insertBinds[0], b.calls.insertBinds[0]);
});

// ---------------------------------------------------------------------------
// fail-open resilience (loud: degraded marker)
// ---------------------------------------------------------------------------
test("enforceRateLimit: fails OPEN (degraded) when prepare throws", async () => {
  const { env } = makeRateDb({ failPrepare: true });
  const result = await quiet(() => enforceRateLimit(env, makeRequest(), "/api/problems"));
  assert.deepEqual(result, { ok: true, degraded: true });
});

test("enforceRateLimit: fails OPEN (degraded) when the atomic insert throws", async () => {
  const { env } = makeRateDb({ failAll: true });
  const result = await quiet(() => enforceRateLimit(env, makeRequest(), "/api/problems"));
  assert.deepEqual(result, { ok: true, degraded: true });
});

test("enforceRateLimit: a prune failure does not flip the decision", async () => {
  const { env } = makeRateDb({
    buckets: [bucket("/api/problems", { minute: 1, hour: 1 }), bucket("*", { minute: 1, hour: 1 })],
    failRun: true,
  });
  const result = await quiet(() => enforceRateLimit(env, makeRequest(), "/api/problems"));
  assert.deepEqual(result, { ok: true });
});

// ---------------------------------------------------------------------------
// enforceEmailCooldown
// ---------------------------------------------------------------------------
test("enforceEmailCooldown: allows up to the per-address cap", async () => {
  const { env, calls } = makeRateDb({ emailRow: { bucket_count: 3, oldest: 1 } });
  assert.deepEqual(await enforceEmailCooldown(env, "user@example.com"), { ok: true });
  assert.match(calls.insert, /INSERT INTO rate_limits/);
  assert.ok(!calls.insertBinds.includes("user@example.com"), "email must never be bound raw");
  assert.match(calls.insertBinds[0], /^[0-9a-f]{64}$/);
});

test("enforceEmailCooldown: blocks over the cap with a sane retryAfter", async () => {
  const now = Math.floor(Date.now() / 1000);
  const { env } = makeRateDb({ emailRow: { bucket_count: 6, oldest: now - 100 } });
  const result = await enforceEmailCooldown(env, "user@example.com");

  assert.equal(result.ok, false);
  assert.ok(result.retryAfter >= 1);
  assert.ok(result.retryAfter <= 3600);
});

test("enforceEmailCooldown: fails OPEN (degraded) on D1 errors", async () => {
  const { env } = makeRateDb({ failAll: true });
  const result = await quiet(() => enforceEmailCooldown(env, "user@example.com"));
  assert.deepEqual(result, { ok: true, degraded: true });
});

// ---------------------------------------------------------------------------
// clientIp
// ---------------------------------------------------------------------------
test("clientIp: prefers cf-connecting-ip over x-forwarded-for", () => {
  const req = makeRequest({ "cf-connecting-ip": "1.2.3.4", "x-forwarded-for": "9.9.9.9" });
  assert.equal(clientIp(req), "1.2.3.4");
});

test("clientIp: falls back to the first x-forwarded-for hop", () => {
  const req = makeRequest({ "x-forwarded-for": "5.6.7.8, 9.10.11.12" });
  assert.equal(clientIp(req), "5.6.7.8");
});

test("clientIp: defaults to 0.0.0.0 when no headers are present", () => {
  const req = new Request("https://buildforgood.world/api/problems");
  assert.equal(clientIp(req), "0.0.0.0");
});

// ---------------------------------------------------------------------------
// hashIp
// ---------------------------------------------------------------------------
test("hashIp: deterministic, 64-char lowercase hex, salt-sensitive", async () => {
  const h1 = await hashIp("203.0.113.7", "salt");
  const h2 = await hashIp("203.0.113.7", "salt");
  const h3 = await hashIp("203.0.113.7", "other-salt");
  assert.equal(h1, h2);
  assert.notEqual(h1, h3);
  assert.match(h1, /^[0-9a-f]{64}$/);
});

// ---------------------------------------------------------------------------
// rateLimited response
// ---------------------------------------------------------------------------
test("rateLimited: returns a 429 with a retry-after header", async () => {
  const res = rateLimited(30);
  assert.equal(res.status, 429);
  assert.equal(res.headers.get("retry-after"), "30");
  assert.equal(res.headers.get("content-type"), "application/json; charset=utf-8");
  const body = await res.json();
  assert.deepEqual(body, { ok: false, error: "rate_limited", retry_after: 30 });
});

test("rateLimited: clamps a missing/invalid retryAfter to 1 second", async () => {
  assert.equal(rateLimited(0).headers.get("retry-after"), "1");
  assert.equal(rateLimited(undefined).headers.get("retry-after"), "1");
});
