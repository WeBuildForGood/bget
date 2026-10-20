/**
 * Unit tests for worker/lib/slug.js — slug generation and uniqueness.
 *
 * `uniqueSlug` is driven through a stubbed `env.DB` that mimics the single
 * `prepare(...).bind(...).first()` call it makes.
 */
import test from "node:test";
import assert from "node:assert/strict";

import { slugify, uniqueSlug } from "../worker/lib/slug.js";

/**
 * Build a fake D1 binding whose `slug` column contains `existing`.
 * Records every prepared SQL statement and the bound candidate.
 */
function makeSlugDb(existing = []) {
  const set = new Set(existing);
  const calls = [];
  const DB = {
    prepare(sql) {
      return {
        bind(candidate) {
          calls.push({ sql, candidate });
          return {
            async first() {
              return set.has(candidate) ? { id: 1 } : null;
            },
          };
        },
      };
    },
  };
  return { env: { DB }, calls };
}

// ---------------------------------------------------------------------------
// slugify
// ---------------------------------------------------------------------------
test("slugify: lowercases and hyphenates punctuation", () => {
  assert.equal(slugify("Hello, World!"), "hello-world");
  assert.equal(slugify("Multiple   Spaces"), "multiple-spaces");
  assert.equal(slugify("--leading and trailing--"), "leading-and-trailing");
});

test("slugify: strips combining accents (NFKD)", () => {
  assert.equal(slugify("Café Déjà Vu"), "cafe-deja-vu");
  assert.equal(slugify("Ünïcödé"), "unicode");
});

test("slugify: handles non-strings and empty input", () => {
  assert.equal(slugify(""), "");
  assert.equal(slugify(null), "");
  assert.equal(slugify(undefined), "");
  assert.equal(slugify("!!!"), "");
  assert.equal(slugify(42), "42");
});

test("slugify: caps length and never leaves a trailing hyphen", () => {
  assert.equal(slugify("a".repeat(100), 10), "aaaaaaaaaa");
  // "aaaaaaaaa b" -> "aaaaaaaaa-b" -> sliced to 10 -> "aaaaaaaaa-" -> trimmed
  assert.equal(slugify("aaaaaaaaa b", 10), "aaaaaaaaa");
  assert.equal(slugify("hello world", 5), "hello");
});

// ---------------------------------------------------------------------------
// uniqueSlug
// ---------------------------------------------------------------------------
test("uniqueSlug: returns the plain slug when nothing collides", async () => {
  const { env } = makeSlugDb();
  assert.equal(await uniqueSlug(env, "My Project"), "my-project");
});

test("uniqueSlug: appends -2, -3 on collision", async () => {
  const { env, calls } = makeSlugDb(["my-project", "my-project-2"]);
  assert.equal(await uniqueSlug(env, "My Project"), "my-project-3");
  assert.deepEqual(
    calls.map((c) => c.candidate),
    ["my-project", "my-project-2", "my-project-3"],
  );
});

test("uniqueSlug: queries the projects table by default", async () => {
  const { env, calls } = makeSlugDb();
  await uniqueSlug(env, "Hello");
  assert.match(calls[0].sql, /FROM projects\b/);
  assert.equal(calls[0].candidate, "hello");
});

test("uniqueSlug: falls back to the table word when the title yields no slug", async () => {
  const projects = makeSlugDb();
  assert.equal(await uniqueSlug(projects.env, ""), "project");

  const problems = makeSlugDb();
  assert.equal(await uniqueSlug(problems.env, "!!!", "problems"), "problem");
  assert.match(problems.calls[0].sql, /FROM problems\b/);
});

test("uniqueSlug: unknown table is not interpolated; falls back to projects", async () => {
  const { env, calls } = makeSlugDb();
  const slug = await uniqueSlug(env, "Something", "rate_limits");
  assert.equal(slug, "something");
  assert.match(calls[0].sql, /FROM projects\b/);
  assert.doesNotMatch(calls[0].sql, /rate_limits/);
});

test("uniqueSlug: suffix search terminates once a free slug is found", async () => {
  const { env, calls } = makeSlugDb(["hello"]);
  assert.equal(await uniqueSlug(env, "Hello"), "hello-2");
  assert.equal(calls.length, 2);
});
