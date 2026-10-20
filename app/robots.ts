import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// Required for `output: "export"` — emit a static robots.txt at build time.
export const dynamic = "force-static";

/**
 * Well-behaved AI/LLM crawlers we explicitly welcome. Naming them (rather than
 * leaning on the `*` fallback) keeps our intent auditable: these agents honour
 * robots.txt, cite their sources, and help people discover the public pages.
 */
const AI_CRAWLERS = [
  "GPTBot", // OpenAI
  "ClaudeBot", // Anthropic
  "PerplexityBot", // Perplexity
  "Google-Extended", // Google Gemini / Vertex grounding + training control
  "Applebot-Extended", // Apple Intelligence
  "CCBot", // Common Crawl
];

/**
 * SEO-tooling and bulk scrapers. They add load without sending readers, so we
 * decline them. Real search engines people actually use to find the site —
 * Googlebot, Bingbot, DuckDuckBot, YandexBot, SeznamBot, and friends — are
 * deliberately left alone and remain allowed through the `*` rule below.
 */
const SPAM_SCRAPERS = [
  "AhrefsBot",
  "SemrushBot",
  "MJ12bot",
  "DotBot",
  "BLEXBot",
  "DataForSeoBot",
  "Bytespider",
  "PetalBot",
  "SerpstatBot",
  "MegaIndex",
  "Barkrowler",
  "ZoominfoBot",
  "Diffbot",
  "ImagesiftBot",
];

/**
 * robots.txt — crawl everything public, keep private endpoints out of the
 * index, welcome well-behaved AI crawlers by name, and decline bulk scrapers.
 */
export default function robots(): MetadataRoute.Robots {
  const privatePaths = ["/admin", "/api/"];

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: privatePaths },
      { userAgent: AI_CRAWLERS, allow: "/", disallow: privatePaths },
      { userAgent: SPAM_SCRAPERS, disallow: "/" },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
