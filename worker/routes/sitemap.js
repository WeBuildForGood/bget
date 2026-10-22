/**
 * Dynamic sitemap.
 *
 * The static export emits `sitemap.xml`, but it runs at build time against
 * `output: "export"` and therefore cannot know which projects exist in D1.
 * The result was a sitemap that silently omitted every `/projects/<slug>` page
 * — the site's highest-value content — plus any project added later without a
 * rebuild.
 *
 * This route is served by the Worker (added to `run_worker_first`) and merges:
 *   1. the static routes baked into the build, and
 *   2. the live approved projects from D1.
 *
 * If D1 is unavailable we still return the static routes rather than a 500 —
 * a partially-populated sitemap beats a broken one.
 */

/** Canonical origin. Kept in sync with `worker/routes/projects-ssr.js`. */
const SITE_URL = "https://buildforgood.world";

/** Routes with no dynamic component. `lastmod` is intentionally omitted for
 * entries we cannot date honestly — Google treats a fabricated `lastmod` as
 * noise and may ignore the field entirely. */
const STATIC_ROUTES = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/about", changefreq: "monthly", priority: "0.9" },
  { path: "/membership", changefreq: "weekly", priority: "0.9" },
  { path: "/manifesto", changefreq: "monthly", priority: "0.9" },
  { path: "/problems", changefreq: "weekly", priority: "0.9" },
  { path: "/projects", changefreq: "weekly", priority: "0.8" },
  { path: "/activities", changefreq: "weekly", priority: "0.7" },
  { path: "/values", changefreq: "monthly", priority: "0.7" },
  { path: "/founders", changefreq: "monthly", priority: "0.6" },
  { path: "/contact", changefreq: "monthly", priority: "0.6" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/accessibility", changefreq: "yearly", priority: "0.3" },
];

/**
 * Escape the five characters that are unsafe inside XML text/attribute nodes.
 *
 * @param {string} value
 * @returns {string}
 */
function xmlEscape(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Render one `<url>` entry.
 *
 * @param {{loc: string, lastmod?: string, changefreq?: string, priority?: string}} entry
 * @returns {string}
 */
function urlEntry({ loc, lastmod, changefreq, priority }) {
  const parts = [`<loc>${xmlEscape(loc)}</loc>`];
  if (lastmod) parts.push(`<lastmod>${xmlEscape(lastmod)}</lastmod>`);
  if (changefreq) parts.push(`<changefreq>${changefreq}</changefreq>`);
  if (priority) parts.push(`<priority>${priority}</priority>`);
  return `  <url>\n    ${parts.join("\n    ")}\n  </url>`;
}

/**
 * Normalise a D1 timestamp (`YYYY-MM-DD HH:MM:SS`, UTC) to W3C format.
 * Returns undefined for anything unparseable so we omit rather than lie.
 *
 * @param {unknown} value
 * @returns {string|undefined}
 */
function toW3CDate(value) {
  if (typeof value !== "string" || !value) return undefined;
  // D1 returns "2026-10-20 06:38:48"; make it ISO-8601 with an explicit Z.
  const iso = value.includes("T") ? value : value.replace(" ", "T") + "Z";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

/**
 * Build the sitemap response.
 *
 * @param {{DB?: D1Database}} env
 * @returns {Promise<Response>}
 */
export async function handleSitemap(env) {
  const origin = SITE_URL.replace(/\/$/, "");

  const entries = STATIC_ROUTES.map((route) =>
    urlEntry({
      loc: route.path === "/" ? `${origin}/` : `${origin}${route.path}`,
      changefreq: route.changefreq,
      priority: route.priority,
    }),
  );

  // Live project pages — the content that actually changes.
  //
  // NOTE: problems are deliberately NOT listed. Problem rows have no public
  // detail route (`/problems/<slug>` 404s; the slug is a numeric id and the
  // page is index-only). Listing them would publish broken URLs, which is
  // worse than omitting them.
  try {
    const projects = await env.DB.prepare(
      `SELECT slug, updated_at, created_at FROM projects
        WHERE slug IS NOT NULL AND slug != ''
        ORDER BY id`,
    ).all();

    for (const row of projects.results ?? []) {
      entries.push(
        urlEntry({
          loc: `${origin}/projects/${encodeURIComponent(row.slug)}`,
          lastmod: toW3CDate(row.updated_at) ?? toW3CDate(row.created_at),
          changefreq: "monthly",
          priority: "0.8",
        }),
      );
    }
  } catch (err) {
    // Degrade to the static routes; never fail the whole sitemap on a DB blip.
    console.error("sitemap: dynamic entries failed", err);
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries.join("\n") +
    `\n</urlset>\n`;

  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      // Cache briefly at the edge: sitemaps change slowly, but a new project
      // should surface within the hour without a redeploy.
      "cache-control": "public, max-age=3600",
      "x-content-type-options": "nosniff",
    },
  });
}
