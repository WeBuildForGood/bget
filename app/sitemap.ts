import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// Required for `output: "export"` — emit a static sitemap.xml at build time.
export const dynamic = "force-static";

/**
 * The one image every route references from its metadata (the OG/social card).
 * `MetadataRoute.Sitemap` models images as plain absolute URL strings, so each
 * entry can advertise it without fighting the types.
 */
const SOCIAL_IMAGE = `${SITE.url}/og.png`;

/**
 * Sitemap for every public route.
 *
 * `SITE.url` is the canonical origin — every canonical tag, robots directive
 * and sitemap entry derives from it, so a custom-domain move is one config
 * change. `/admin` and `/api/*` are intentionally absent: they are private and
 * disallowed in robots.ts.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: "/", priority: 1.0, changeFrequency: "weekly" as const, lastModified: new Date("2026-10-15T00:00:00.000Z") },
    { path: "/about", priority: 0.9, changeFrequency: "monthly" as const, lastModified: new Date("2026-10-12T00:00:00.000Z") },
    { path: "/membership", priority: 0.9, changeFrequency: "weekly" as const, lastModified: new Date("2026-10-14T00:00:00.000Z") },
    { path: "/manifesto", priority: 0.9, changeFrequency: "monthly" as const, lastModified: new Date("2026-10-10T00:00:00.000Z") },
    { path: "/problems", priority: 0.9, changeFrequency: "weekly" as const, lastModified: new Date("2026-10-14T00:00:00.000Z") },
    { path: "/projects", priority: 0.8, changeFrequency: "weekly" as const, lastModified: new Date("2026-10-13T00:00:00.000Z") },
    { path: "/activities", priority: 0.7, changeFrequency: "weekly" as const, lastModified: new Date("2026-10-11T00:00:00.000Z") },
    { path: "/founders", priority: 0.6, changeFrequency: "monthly" as const, lastModified: new Date("2026-10-12T00:00:00.000Z") },
    { path: "/contact", priority: 0.6, changeFrequency: "monthly" as const, lastModified: new Date("2026-10-12T00:00:00.000Z") },
    { path: "/values", priority: 0.7, changeFrequency: "monthly" as const, lastModified: new Date("2026-10-09T00:00:00.000Z") },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" as const, lastModified: new Date("2026-09-01T00:00:00.000Z") },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" as const, lastModified: new Date("2026-09-01T00:00:00.000Z") },
    { path: "/accessibility", priority: 0.3, changeFrequency: "yearly" as const, lastModified: new Date("2026-09-01T00:00:00.000Z") },
  ];

  return routes.map(({ path, priority, changeFrequency, lastModified }) => ({
    url: path === "/" ? `${SITE.url}/` : `${SITE.url}${path}`,
    lastModified,
    changeFrequency,
    priority,
    images: [SOCIAL_IMAGE],
  }));
}
