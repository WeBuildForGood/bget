import { SITE } from "@/lib/site";

/**
 * Render structured data as JSON-LD. Rendered server-side so crawlers that
 * do not execute JavaScript still see it. `<` is escaped to avoid breaking
 * out of the script tag with untrusted content.
 */
export function JsonLd({
  data,
}: {
  data: Record<string, unknown> | Record<string, unknown>[];
}) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

/**
 * Compact WebPage node for a top-level route. References the Organization and
 * WebSite nodes emitted once in the root layout via stable `@id`s.
 */
export function webPageLd({
  path,
  name,
  description,
  type = "WebPage",
}: {
  path: string;
  name: string;
  description: string;
  type?: "WebPage" | "AboutPage";
}) {
  return {
    "@context": "https://schema.org",
    "@type": type,
    "@id": `${SITE.url}${path}#webpage`,
    url: `${SITE.url}${path}`,
    name,
    description,
    isPartOf: { "@id": `${SITE.url}/#website` },
    inLanguage: "en",
    ...(type === "AboutPage" ? { about: { "@id": `${SITE.url}/#organization` } } : {}),
  };
}

/** Article node for long-form editorial pages (e.g. the manifesto). */
export function articleLd({
  path,
  headline,
  description,
}: {
  path: string;
  headline: string;
  description: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${SITE.url}${path}#article`,
    headline,
    description,
    mainEntityOfPage: `${SITE.url}${path}`,
    author: { "@type": "Organization", "@id": `${SITE.url}/#organization`, name: SITE.name, url: SITE.url },
    publisher: { "@id": `${SITE.url}/#organization` },
    inLanguage: "en",
  };
}

/** A single breadcrumb hop. `path` is root-relative (e.g. "/about"). */
export type Crumb = { name: string; path: string };

/**
 * BreadcrumbList for a non-home route. Pass the trail from the home page to the
 * current page; `position` is derived from array order so the numbering can
 * never drift from the visible trail. The final crumb also anchors the `@id`,
 * giving the node a stable identity for the rest of the graph to reference.
 *
 * Home (`/`) intentionally does not emit a breadcrumb — a list of one is noise.
 */
export function breadcrumbLd(items: Crumb[]) {
  const last = items[items.length - 1];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${SITE.url}${last?.path ?? "/"}#breadcrumb`,
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE.url}${item.path}`,
    })),
  };
}

/** One entry in a `CollectionPage`'s `ItemList`. */
export type CollectionItem = { name: string; url?: string; description?: string };

/**
 * CollectionPage + nested ItemList for index routes that gather many works
 * (e.g. the project showcase). `items` may be empty when the collection is
 * populated client-side at runtime — the node then declares the page's intent
 * without inventing entries that are not actually in the static document.
 * Never pass placeholder items: fabricated `ItemListElement`s are a
 * structured-data violation and get rich results penalised.
 */
export function collectionPageLd({
  path,
  name,
  description,
  items = [],
}: {
  path: string;
  name: string;
  description: string;
  items?: CollectionItem[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${SITE.url}${path}#webpage`,
    url: `${SITE.url}${path}`,
    name,
    description,
    isPartOf: { "@id": `${SITE.url}/#website` },
    inLanguage: "en",
    mainEntity: {
      "@type": "ItemList",
      "@id": `${SITE.url}${path}#itemlist`,
      name,
      itemListOrder: "https://schema.org/ItemListUnordered",
      ...(items.length > 0
        ? {
            numberOfItems: items.length,
            itemListElement: items.map((item, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item: {
                "@type": "CreativeWork",
                name: item.name,
                ...(item.url ? { url: item.url } : {}),
                ...(item.description ? { description: item.description } : {}),
              },
            })),
          }
        : {}),
    },
  };
}

/**
 * Service node for an offering described on the page (e.g. community
 * membership). Use this where there is no visible Q&A to justify a FAQPage —
 * a Service truthfully describes what the page presents without inventing
 * questions a visitor never asks.
 */
export function serviceLd({
  path,
  name,
  description,
  serviceType,
}: {
  path: string;
  name: string;
  description: string;
  serviceType?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${SITE.url}${path}#service`,
    name,
    description,
    ...(serviceType ? { serviceType } : {}),
    url: `${SITE.url}${path}`,
    provider: { "@id": `${SITE.url}/#organization` },
    areaServed: { "@type": "Place", name: "Worldwide" },
    audience: { "@type": "Audience", audienceType: "Multidisciplinary builders" },
  };
}

/** One recurring format inside an `EventSeries`. */
export type EventSeriesItem = {
  name: string;
  description: string;
  /**
   * ISO-8601 duration for `Schedule.repeatFrequency` (e.g. "P1W" weekly,
   * "P2W" fortnightly, "P1M" monthly). Only set it when the page states the
   * cadence — never guess a schedule that is not written down.
   */
  repeatFrequency?: string;
};

/**
 * EventSeries for a page whose rituals are explicitly recurring (e.g. the
 * weekly Build Night). Each `subEvent` is an `Event` sharing the series `@id`,
 * so search engines can surface the schedule without a separate events feed.
 */
export function eventSeriesLd({
  path,
  name,
  description,
  events,
}: {
  path: string;
  name: string;
  description: string;
  events: EventSeriesItem[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "EventSeries",
    "@id": `${SITE.url}${path}#eventseries`,
    name,
    description,
    url: `${SITE.url}${path}`,
    isPartOf: { "@id": `${SITE.url}/#website` },
    organizer: { "@id": `${SITE.url}/#organization` },
    eventAttendanceMode: "https://schema.org/MixedEventAttendanceMode",
    subEvent: events.map((event) => ({
      "@type": "Event",
      name: event.name,
      description: event.description,
      url: `${SITE.url}${path}`,
      isPartOf: { "@id": `${SITE.url}${path}#eventseries` },
      organizer: { "@id": `${SITE.url}/#organization` },
      eventAttendanceMode: "https://schema.org/MixedEventAttendanceMode",
      ...(event.repeatFrequency
        ? { eventSchedule: { "@type": "Schedule", repeatFrequency: event.repeatFrequency } }
        : {}),
    })),
  };
}

/**
 * HowTo node for a public process or workflow (e.g. the application process).
 */
export function howToLd({
  path,
  name,
  description,
  steps,
}: {
  path: string;
  name: string;
  description: string;
  steps: Array<{ name: string; itemListElement: Array<{ type: string; name: string; text: string }> }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "@id": `${SITE.url}${path}#howto`,
    name,
    description,
    url: `${SITE.url}${path}`,
    isPartOf: { "@id": `${SITE.url}/#website` },
    ...(steps.length > 0
      ? {
          step: steps.map((step, i) => ({
            "@type": "HowToStep",
            position: i + 1,
            name: step.name,
            itemListElement: step.itemListElement.map((item, j) => ({
              "@type": item.type,
              position: j + 1,
              name: item.name,
              ...(item.text ? { text: item.text } : {}),
            })),
          })),
        }
      : {}),
  };
}

/**
 * FAQPage node for pages with a visible Q&A.
 */
export function faqPageLd({
  path,
  name,
  description,
  mainEntity,
}: {
  path: string;
  name: string;
  description: string;
  mainEntity: Array<{ question: string; acceptedAnswer: string; }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${SITE.url}${path}#faq`,
    name,
    description,
    url: `${SITE.url}${path}`,
    isPartOf: { "@id": `${SITE.url}/#website` },
    mainEntity: mainEntity.map((item, i) => ({
      "@type": "Question",
      position: i + 1,
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.acceptedAnswer,
      },
    })),
  };
}
