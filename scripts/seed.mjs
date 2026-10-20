#!/usr/bin/env node
/**
 * Build For Good — D1 seed runner.
 *
 * Applies `seed/problems.sql` and `seed/projects.sql` to a D1 database through
 * `wrangler d1 execute`, and prints row counts before and after so the operator
 * can confirm exactly what changed.
 *
 * SAFETY
 * ------
 * This script is intentionally boring to run by accident:
 *
 *   * It refuses to do anything without an explicit `--yes` flag.
 *   * It targets REMOTE by default (the live `buildforgood-prod` database).
 *     Pass `--local` to run against local miniflare D1 state instead.
 *   * Both seed files are idempotent (explicit ids + INSERT OR REPLACE), so
 *     running it twice is safe and converges to the same rows.
 *
 * USAGE
 * -----
 *   node scripts/seed.mjs --yes                         # remote buildforgood-prod
 *   node scripts/seed.mjs --yes --db buildforgood-prod
 *   node scripts/seed.mjs --yes --local                 # local miniflare only
 *   node scripts/seed.mjs                               # prints plan, exits 1
 *
 * The integrator runs this; nothing here executes wrangler commands until
 * `--yes` is present.
 */

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");

/** The seed files to apply, in order, with the table each one fills. */
const SEED_FILES = [
  { label: "problems", file: path.join(ROOT, "seed", "problems.sql"), table: "problems" },
  { label: "projects", file: path.join(ROOT, "seed", "projects.sql"), table: "projects" },
];

/** Parse argv into a simple options object. */
function parseArgs(argv) {
  const opts = { yes: false, local: false, db: "buildforgood-prod", help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--yes" || arg === "-y") opts.yes = true;
    else if (arg === "--local") opts.local = true;
    else if (arg === "--remote") opts.local = false;
    else if (arg === "--help" || arg === "-h") opts.help = true;
    else if (arg === "--db") {
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) fail("--db needs a database name");
      opts.db = value;
      i += 1;
    } else if (arg.startsWith("--db=")) {
      opts.db = arg.slice("--db=".length);
    } else {
      fail(`unknown argument: ${arg}`);
    }
  }
  return opts;
}

function fail(message) {
  console.error(`seed: ${message}`);
  process.exit(1);
}

/** Build the shared `wrangler d1 execute <db> ...` argument list. */
function wranglerArgs(opts, extra) {
  return ["wrangler", "d1", "execute", opts.db, opts.local ? "--local" : "--remote", ...extra];
}

/**
 * Run a wrangler command with inherited stdio, so wrangler's own prompts and
 * output reach the operator unchanged. Throws on a non-zero exit code.
 *
 * @param {string[]} args
 */
function runInherited(args) {
  const result = spawnSync("npx", args, { cwd: ROOT, stdio: "inherit", env: process.env });
  if (result.error) fail(`could not launch npx: ${result.error.message}`);
  if (result.status !== 0) fail(`command failed (exit ${result.status}): npx ${args.join(" ")}`);
}

/**
 * Run a read-only `SELECT` and return the `results` array from wrangler's JSON
 * output. Wrangler may print notices before the JSON payload, so parsing starts
 * at the first `[`.
 *
 * @param {string[]} args
 * @returns {Array<Record<string, unknown>>}
 */
function queryJson(args) {
  const result = spawnSync("npx", args, { cwd: ROOT, encoding: "utf8", env: process.env });
  if (result.error) fail(`could not launch npx: ${result.error.message}`);
  if (result.status !== 0) {
    process.stderr.write(result.stdout ?? "");
    process.stderr.write(result.stderr ?? "");
    fail(`query failed (exit ${result.status}): npx ${args.join(" ")}`);
  }
  const raw = String(result.stdout ?? "").trim();
  const start = raw.indexOf("[");
  if (start === -1) fail(`could not parse JSON from wrangler output:\n${raw}`);
  let parsed;
  try {
    parsed = JSON.parse(raw.slice(start));
  } catch (err) {
    fail(`could not parse JSON from wrangler output: ${err.message}\n${raw}`);
  }
  const first = Array.isArray(parsed) ? parsed[0] : parsed;
  return first && Array.isArray(first.results) ? first.results : [];
}

/** First numeric column of the first row, or `fallback` when there are none. */
function scalar(rows, fallback = 0) {
  const row = rows && rows[0];
  if (!row) return fallback;
  const value = row.n ?? Object.values(row)[0];
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

/** COUNT(*) for a table, or null when the table does not exist yet. */
function countTable(opts, table) {
  try {
    const rows = queryJson(
      wranglerArgs(opts, ["--json", "--command", `SELECT COUNT(*) AS n FROM ${table};`]),
    );
    return scalar(rows, 0);
  } catch {
    return null;
  }
}

/** Grouped counts for a status column, e.g. `framed=3, active=3`. */
function groupCount(opts, table, column) {
  try {
    const rows = queryJson(
      wranglerArgs(opts, [
        "--json",
        "--command",
        `SELECT ${column} AS k, COUNT(*) AS n FROM ${table} GROUP BY ${column} ORDER BY n DESC, k ASC;`,
      ]),
    );
    return rows.map((r) => `${r.k ?? "null"}=${r.n}`);
  } catch {
    return [];
  }
}

/** Count approved, featured projects — the ones pinned to the top of the gallery. */
function featuredCount(opts) {
  try {
    const rows = queryJson(
      wranglerArgs(opts, [
        "--json",
        "--command",
        "SELECT COUNT(*) AS n FROM projects WHERE status = 'approved' AND featured = 1;",
      ]),
    );
    return scalar(rows, 0);
  } catch {
    return null;
  }
}

/** Snapshot used for the before/after comparison. */
function snapshot(opts) {
  const snap = {};
  for (const { table } of SEED_FILES) {
    snap[table] = {
      total: countTable(opts, table),
      byStatus: groupCount(opts, table, "status"),
    };
  }
  snap.projects.featured = featuredCount(opts);
  return snap;
}

/** Print a snapshot as a small, readable block. */
function printSnapshot(title, snap) {
  console.log(`\n${title}`);
  console.log("-".repeat(title.length));
  for (const { table } of SEED_FILES) {
    const entry = snap[table] ?? {};
    const total = entry.total === null || entry.total === undefined ? "(no table)" : entry.total;
    console.log(`${table.padEnd(10)} rows: ${total}`);
    if (entry.byStatus && entry.byStatus.length) {
      console.log(`${" ".repeat(10)} by status: ${entry.byStatus.join(", ")}`);
    }
  }
  const featured = snap.projects?.featured;
  if (featured !== null && featured !== undefined) {
    console.log(`projects   featured=1: ${featured}`);
  }
}

function usage() {
  console.log(
    [
      "Build For Good — seed runner",
      "",
      "  node scripts/seed.mjs --yes [--db buildforgood-prod] [--local]",
      "",
      "  --yes      required; confirms you want to write to the database",
      "  --db       D1 database name (default: buildforgood-prod)",
      "  --local    target local miniflare state instead of remote",
      "  --remote   target remote (default)",
      "",
      "Both seed files are idempotent. Without --yes this script writes nothing.",
    ].join("\n"),
  );
}

function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.help) {
    usage();
    process.exit(0);
  }

  const target = opts.local ? "local miniflare" : "REMOTE";

  // Fail before touching the database if any seed file is missing.
  for (const { file } of SEED_FILES) {
    if (!fs.existsSync(file)) fail(`missing seed file: ${path.relative(ROOT, file)}`);
  }

  if (!opts.yes) {
    console.error("seed: refusing to run without --yes.\n");
    usage();
    console.log("\nThis would write to:");
    console.log(`  database : ${opts.db}`);
    console.log(`  target   : ${target}`);
    for (const { label, file } of SEED_FILES) {
      console.log(`  ${label.padEnd(9)}: ${path.relative(ROOT, file)}`);
    }
    console.log("\nRe-run with --yes to apply.");
    process.exit(1);
  }

  console.log(`seed: database=${opts.db} target=${target}`);
  console.log("seed: collecting pre-run row counts...");
  const before = snapshot(opts);
  printSnapshot("Before", before);

  for (const { label, file } of SEED_FILES) {
    console.log(`\nApplying ${label} (${path.relative(ROOT, file)})...`);
    runInherited(wranglerArgs(opts, ["--file", file]));
  }

  console.log("\nseed: collecting post-run row counts...");
  const after = snapshot(opts);
  printSnapshot("After", after);

  console.log("\nseed: done.");
}

main();
