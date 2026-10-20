/**
 * Sliding-window, per-IP rate limiting backed by D1 (`rate_limits`).
 *
 * A hit is one row: `(ip_hash, endpoint, ts)`. Both the recording of the hit
 * and the counting of the window happen in ONE atomic `INSERT ... RETURNING`
 * statement: the count subqueries inside `RETURNING` are evaluated after the
 * row lands, and D1 serialises statements per database, so the returned count
 * always includes the current request. Concurrent requests can never read the
 * same pre-insert count and all slip under the cap (the check-then-insert
 * TOCTOU race this replaced). The count returned already includes this
 * request, so the caps below are enforced as `count > max`.
 *
 * Two buckets are enforced for every request:
 *   1. A per-endpoint bucket, keyed on `(ip_hash, endpoint)`.
 *   2. A global per-IP bucket, keyed on `ip_hash` alone, recorded under the
 *      synthetic `GLOBAL_BUCKET` endpoint. This stops a client from spreading
 *      a burst across the six write routes to multiply its budget.
 *
 * PRIVACY: the client IP is never stored. We store a salted SHA-256 hash, so
 * the table can be used for abuse response without holding personal data.
 * `cf-connecting-ip` is set by Cloudflare and cannot be spoofed by the client;
 * `x-forwarded-for` is only a development fallback.
 *
 * RESILIENCE: if the `rate_limits` table is missing or D1 errors, the limiter
 * fails OPEN (the request proceeds). This keeps submissions working on a
 * deployment where this migration has not yet been applied, and avoids making
 * the rate limiter a single point of failure. A fail-open is LOUD: it logs a
 * `[RATE_LIMITER_FAIL_OPEN]` marker and the result carries `degraded: true`,
 * so a dead limiter is visible in `wrangler tail` instead of silent.
 */

import { json } from "./json.js";

/** Per-minute window: generous enough for humans, tight enough for scripts. */
const MINUTE = { seconds: 60, max: 5 };

/** Per-hour window: a second, coarser ceiling on the same key. */
const HOUR = { seconds: 3600, max: 20 };

/**
 * Global, cross-endpoint caps for one IP. The six write endpoints each carry
 * their own bucket, so without a combined ceiling a script could multiply its
 * budget by spreading a burst across endpoints (~6x). We cap the *total* at
 * 3x the per-endpoint allowance: comfortably above a human who legitimately
 * touches a couple of forms in a minute, while halving the spreadable budget
 * (3x instead of 6x). Both windows are enforced on the same IP-only key.
 */
const GLOBAL_MINUTE = { seconds: 60, max: 15 };
const GLOBAL_HOUR = { seconds: 3600, max: 60 };

/**
 * Synthetic endpoint label under which the cross-endpoint hits are recorded.
 * It can never collide with a real route (routes start with `/`).
 */
const GLOBAL_BUCKET = "*";

/** Fallback salt when `RATE_LIMIT_SALT` is not configured. */
const DEFAULT_SALT = "buildforgood::rate-limit::v1";

/**
 * Best-effort client IP. Cloudflare always sets `cf-connecting-ip` in
 * production; the remaining fallbacks exist only for local/dev runs.
 *
 * @param {Request} request
 * @returns {string}
 */
export function clientIp(request) {
  const direct = request.headers.get("cf-connecting-ip");
  if (direct) return direct.trim();
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "0.0.0.0";
}

/**
 * Salted SHA-256 of an IP, rendered as lowercase hex.
 *
 * @param {string} ip
 * @param {string} salt
 * @returns {Promise<string>}
 */
export async function hashIp(ip, salt) {
  const bytes = new TextEncoder().encode(`${salt}:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Apply the sliding-window limits for one endpoint + client. Both the
 * per-endpoint bucket and the global per-IP bucket must pass.
 *
 * The hit is recorded and the caps enforced in a single atomic statement (see
 * the module docblock); `retryAfter` is derived from the oldest surviving row
 * in the exhausted window.
 *
 * @param {{DB: D1Database, RATE_LIMIT_SALT?: string}} env
 * @param {Request} request
 * @param {string} endpoint Logical bucket, e.g. "/api/problems".
 * @returns {Promise<{ok: true} | {ok: true, degraded: true}
 *   | {ok: false, retryAfter: number}>}
 */
export async function enforceRateLimit(env, request, endpoint) {
  try {
    const salt = String(env.RATE_LIMIT_SALT || DEFAULT_SALT);
    const ipHash = await hashIp(clientIp(request), salt);
    const now = Math.floor(Date.now() / 1000);
    const minuteCut = now - MINUTE.seconds;
    const hourCut = now - HOUR.seconds;

    // Atomic record-and-count. ONE statement inserts the hit into BOTH
    // buckets and returns each bucket's post-insert counts plus the oldest
    // row in each window. There is no separate "check" step for a concurrent
    // request to race ahead of.
    const { results } = await env.DB.prepare(
      `INSERT INTO rate_limits (ip_hash, endpoint, ts) VALUES (?, ?, ?), (?, ?, ?)
       RETURNING (
         SELECT COUNT(*) FROM rate_limits rl
          WHERE rl.ip_hash = rate_limits.ip_hash
            AND rl.endpoint = rate_limits.endpoint
            AND rl.ts > ?
       ) AS hour_count,
       (
         SELECT COUNT(*) FROM rate_limits rl
          WHERE rl.ip_hash = rate_limits.ip_hash
            AND rl.endpoint = rate_limits.endpoint
            AND rl.ts > ?
       ) AS minute_count,
       (
         SELECT MIN(ts) FROM rate_limits rl
          WHERE rl.ip_hash = rate_limits.ip_hash
            AND rl.endpoint = rate_limits.endpoint
            AND rl.ts > ?
       ) AS oldest_minute,
       (
         SELECT MIN(ts) FROM rate_limits rl
          WHERE rl.ip_hash = rate_limits.ip_hash
            AND rl.endpoint = rate_limits.endpoint
            AND rl.ts > ?
       ) AS oldest_hour,
       endpoint`,
    )
      .bind(
        ipHash, endpoint, now,
        ipHash, GLOBAL_BUCKET, now,
        hourCut,
        minuteCut,
        minuteCut,
        hourCut,
      )
      .all();

    const rows = Array.isArray(results) ? results : [];
    const globalRow = rows.find((r) => r.endpoint === GLOBAL_BUCKET);
    const endpointRow = rows.find((r) => r.endpoint === endpoint);
    if (!globalRow || !endpointRow) {
      // The insert did not report both buckets — unexpected D1 behaviour.
      // Treat it like any other limiter fault (loud fail-open).
      throw new Error("ratelimit: missing bucket rows in INSERT..RETURNING result");
    }

    // Best-effort prune of expired rows for this IP; runs after the counts
    // above (which only look at rows inside the windows) and never flips a
    // decision, so its failure is logged but otherwise ignored.
    try {
      await env.DB.prepare(
        "DELETE FROM rate_limits WHERE ip_hash = ? AND endpoint IN (?, ?) AND ts <= ?",
      ).bind(ipHash, endpoint, GLOBAL_BUCKET, hourCut).run();
    } catch (err) {
      console.error("ratelimit: prune failed", err);
    }

    // 1. Global bucket first: every endpoint for this IP is counted together,
    //    so a burst spread across routes trips the combined ceiling. Counts
    //    include this request, hence `> max`.
    const totalMinuteCount = Number(globalRow.minute_count || 0);
    const totalHourCount = Number(globalRow.hour_count || 0);

    if (totalMinuteCount > GLOBAL_MINUTE.max) {
      return {
        ok: false,
        retryAfter: Math.max(
          1,
          Number(globalRow.oldest_minute ?? now) + GLOBAL_MINUTE.seconds - now,
        ),
      };
    }
    if (totalHourCount > GLOBAL_HOUR.max) {
      return {
        ok: false,
        retryAfter: Math.max(
          1,
          Number(globalRow.oldest_hour ?? now) + GLOBAL_HOUR.seconds - now,
        ),
      };
    }

    // 2. Per-endpoint bucket: an additional ceiling scoped to this route.
    const minuteCount = Number(endpointRow.minute_count || 0);
    const hourCount = Number(endpointRow.hour_count || 0);

    if (minuteCount > MINUTE.max) {
      return {
        ok: false,
        retryAfter: Math.max(
          1,
          Number(endpointRow.oldest_minute ?? now) + MINUTE.seconds - now,
        ),
      };
    }
    if (hourCount > HOUR.max) {
      return {
        ok: false,
        retryAfter: Math.max(1, Number(endpointRow.oldest_hour ?? now) + HOUR.seconds - now),
      };
    }

    return { ok: true };
  } catch (err) {
    // Fail open: a limiter problem must never take the API down — but make
    // the outage LOUD (marker + degraded flag) so it shows up in logs/monitoring.
    console.error(
      "[RATE_LIMITER_FAIL_OPEN] rate limiter unavailable; allowing request",
      err,
    );
    return { ok: true, degraded: true };
  }
}

/** Per-address bucket used for the public unsubscribe route. */
const EMAIL_BUCKET = {
  endpoint: "*email*",
  seconds: 3600,
  max: 5,
};

/**
 * Per-subject (e.g. per-email-address) cooldown, sharing the `rate_limits`
 * table. The subject is stored as a salted SHA-256 hash in the `ip_hash`
 * column under the synthetic `EMAIL_BUCKET` endpoint, so no personal data is
 * written. Uses the same single-statement atomic record-and-count pattern as
 * `enforceRateLimit`.
 *
 * Fails open (loudly) on D1 errors, like the IP limiter.
 *
 * @param {{DB: D1Database, RATE_LIMIT_SALT?: string}} env
 * @param {string} email Address to throttle (hashed before storage).
 * @param {{seconds?: number, max?: number}} [opts]
 * @returns {Promise<{ok: true} | {ok: true, degraded: true}
 *   | {ok: false, retryAfter: number}>}
 */
export async function enforceEmailCooldown(env, email, opts = {}) {
  const seconds = opts.seconds ?? EMAIL_BUCKET.seconds;
  const max = opts.max ?? EMAIL_BUCKET.max;

  try {
    const salt = String(env.RATE_LIMIT_SALT || DEFAULT_SALT);
    // Namespaced prefix keeps email hashes from colliding with IP hashes.
    const key = await hashIp(`email:${String(email).trim().toLowerCase()}`, salt);
    const now = Math.floor(Date.now() / 1000);
    const cut = now - seconds;

    const row = await env.DB.prepare(
      `INSERT INTO rate_limits (ip_hash, endpoint, ts) VALUES (?, ?, ?)
       RETURNING (
         SELECT COUNT(*) FROM rate_limits rl
          WHERE rl.ip_hash = rate_limits.ip_hash
            AND rl.endpoint = rate_limits.endpoint
            AND rl.ts > ?
       ) AS bucket_count,
       (
         SELECT MIN(ts) FROM rate_limits rl
          WHERE rl.ip_hash = rate_limits.ip_hash
            AND rl.endpoint = rate_limits.endpoint
            AND rl.ts > ?
       ) AS oldest`,
    )
      .bind(key, EMAIL_BUCKET.endpoint, now, cut, cut)
      .first();

    const count = Number(row?.bucket_count || 0);
    if (count > max) {
      return {
        ok: false,
        retryAfter: Math.max(1, Number(row?.oldest ?? now) + seconds - now),
      };
    }

    try {
      await env.DB.prepare(
        "DELETE FROM rate_limits WHERE ip_hash = ? AND endpoint = ? AND ts <= ?",
      ).bind(key, EMAIL_BUCKET.endpoint, cut).run();
    } catch (err) {
      console.error("ratelimit: email-bucket prune failed", err);
    }

    return { ok: true };
  } catch (err) {
    console.error(
      "[RATE_LIMITER_FAIL_OPEN] email cooldown unavailable; allowing request",
      err,
    );
    return { ok: true, degraded: true };
  }
}

/**
 * Standard 429 response for a throttled request.
 *
 * @param {number} retryAfter Seconds until the client may retry.
 * @returns {Response}
 */
export function rateLimited(retryAfter) {
  const seconds = Math.max(1, Math.ceil(Number(retryAfter) || 1));
  return json(
    { ok: false, error: "rate_limited", retry_after: seconds },
    429,
    { "retry-after": String(seconds) },
  );
}
