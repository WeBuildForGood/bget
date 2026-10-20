/**
 * URL slug generation.
 *
 * Slugs are lowercase, alphanumeric + hyphens, and unique within the target
 * table (duplicates get a `-2`, `-3`, … suffix). `uniqueSlug` is table-aware so
 * both `projects` and `problems` can mint stable public handles.
 */

/** Allowed slug tables, mapped to the word used when a title yields no slug. */
const SLUG_TABLES = {
  projects: "project",
  problems: "problem",
};

/**
 * Convert arbitrary text into a URL-safe slug.
 *
 * @param {unknown} input
 * @param {number} [max] Maximum slug length.
 * @returns {string}
 */
export function slugify(input, max = 80) {
  return String(input ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip combining accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max)
    .replace(/-+$/g, "");
}

/**
 * Resolve a unique slug for `title` inside `table`, appending `-2`, `-3`, … on
 * collision.
 *
 * @param {{DB: D1Database}} env
 * @param {string} title
 * @param {"projects"|"problems"} [table] Target table (allowlisted; never user input).
 * @returns {Promise<string>}
 */
export async function uniqueSlug(env, title, table = "projects") {
  const target = Object.prototype.hasOwnProperty.call(SLUG_TABLES, table)
    ? table
    : "projects";
  const base = slugify(title) || SLUG_TABLES[target];
  let candidate = base;
  let suffix = 1;

  for (;;) {
    // `target` is drawn from the allowlist above, never from user input.
    const existing = await env.DB.prepare(
      `SELECT id FROM ${target} WHERE slug = ? LIMIT 1`,
    )
      .bind(candidate)
      .first();
    if (!existing) return candidate;

    suffix += 1;
    candidate = `${base}-${suffix}`;

    // Safety valve: practically unreachable, but avoids an infinite loop.
    if (suffix > 1000) return `${base}-${Date.now().toString(36)}`;
  }
}
