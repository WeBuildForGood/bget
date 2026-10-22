import type { Metadata } from "next";

/**
 * Single source of truth for site-wide metadata and links.
 * Import this anywhere instead of hard-coding the name/URL.
 *
 * The canonical origin is the production custom domain. Override it for
 * staging/preview builds with `NEXT_PUBLIC_SITE_URL` — every canonical tag,
 * sitemap entry, robots directive, and JSON-LD `@id` derives from `url`.
 */
export const SITE = {
  name: "Build For Good",
  shortName: "Build For Good",
  tagline: "Build. Grow. Evolve. Together.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://buildforgood.world").replace(/\/$/, ""),
  description:
    "Build For Good is a global, multidisciplinary community for turning meaningful problems into collective action. Exceptional people, across every field, building things that matter — together.",
  shortDescription: "A global community turning meaningful problems into collective action.",
  founder: "Nikhil Nagpure",
  locale: "en_US",
  github: "https://github.com/webuildforgood",
  email: "hello@buildforgood.world",
  keywords: [
    "Build For Good",
    "community",
    "problem commons",
    "collective action",
    "multidisciplinary",
    "social impact",
    "builders",
    "open problems",
    "civic tech",
    "global community",
  ],
} as const;

export type SiteConfig = typeof SITE;

/**
 * Build per-page metadata from the shared site config so titles, canonicals,
 * and social cards stay consistent across every route. `title` is the
 * page-level title only — the root layout template appends the brand name.
 * `path` is a root-relative path (e.g. "/manifesto"); `metadataBase` in the
 * root layout resolves it to an absolute URL.
 */
export function pageMetadata({
  title,
  description,
  path,
  type = "website",
  author,
  publishedTime,
  modifiedTime,
}: {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}): Metadata {
  const fullTitle = `${title} — ${SITE.name}`;
  const ogImage = { url: "/og.png", width: 1200, height: 630, alt: fullTitle };

  if (type === "article") {
    return {
      title,
      description,
      alternates: {
        canonical: path,
        languages: {
          "en-US": path,
          en: path,
          "x-default": path,
        },
      },
      openGraph: {
        type: "article",
        url: path,
        siteName: SITE.name,
        title: fullTitle,
        description,
        locale: SITE.locale,
        images: [ogImage],
        authors: [author || SITE.founder],
        publishedTime: publishedTime || undefined,
        modifiedTime: modifiedTime || undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: fullTitle,
        description,
        images: ["/og.png"],
      },
      other: {
        "linkedin:owner": SITE.founder,
        "linkedin:owner:type": "person",
        "pin:media": "/og.png",
        "pin:url": path,
        "pin:description": fullTitle,
      },
    };
  }

  return {
    title,
    description,
    alternates: {
      canonical: path,
      // Self-referencing hreflang. The site is English-only today, so every
      // locale variant points at this same page — never at the homepage, which
      // would de-index the page it appears on.
      languages: {
        "en-US": path,
        en: path,
        "x-default": path,
      },
    },
    openGraph: {
      type: "website",
      url: path,
      siteName: SITE.name,
      title: fullTitle,
      description,
      locale: SITE.locale,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: ["/og.png"],
    },
    other: {
      "linkedin:owner": SITE.founder,
      "linkedin:owner:type": "person",
      "pin:media": "/og.png",
      "pin:url": path,
      "pin:description": fullTitle,
    },
  };
}
