-- Build For Good — rate limiting + public problem slugs (D1)
-- Applied with:  npx wrangler d1 execute buildforgood-prod --remote --file=migrations/0004_rate_limits_and_slugs.sql
--
-- ############################################################################
-- # ONE-SHOT MIGRATION — DO NOT RE-RUN. ALREADY APPLIED TO `buildforgood-prod`. #
-- ############################################################################
-- SQLite has no `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, so the `ALTER`
-- below aborts with "duplicate column name: slug" if this file is executed a
-- second time. Do not edit the file to "fix" that: it is the record of what was
-- applied to production.
--
-- To keep a re-run (or a partially applied run) from doing harm, the
-- `rate_limits` table and its index are created FIRST and are `IF NOT EXISTS`,
-- so they are always present even though execution aborts at the `ALTER`
-- further down.
--
-- Two additions:
--   1. `rate_limits` — a sliding-window log backing per-IP rate limiting on
--      every POST endpoint. Only a salted SHA-256 hash of the client IP is
--      stored, never the raw address.
--   2. `problems.slug` — a stable, human-readable handle for the Public Problem
--      Commons API (`GET /api/problems/:slug`). Generated at insert time by
--      `worker/lib/slug.js#uniqueSlug`. NULL for rows created before this
--      migration; SQLite unique indexes allow multiple NULLs, so the index
--      below is safe to create on a non-empty table.

CREATE TABLE IF NOT EXISTS rate_limits (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  ip_hash   TEXT    NOT NULL,   -- salted SHA-256 of the client IP (never the raw IP)
  endpoint  TEXT    NOT NULL,   -- route the hit belongs to, e.g. "/api/problems"
  ts        INTEGER NOT NULL    -- Unix seconds; pruned to the largest window on write
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON rate_limits (ip_hash, endpoint, ts);

-- NOTE: not re-runnable — aborts above this point on a second execution.
ALTER TABLE problems ADD COLUMN slug TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_problems_slug ON problems (slug);
