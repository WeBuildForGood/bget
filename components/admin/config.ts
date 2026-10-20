import { SITE } from "@/lib/site";

/** The six admin collections, matching the worker's /api/admin/:collection routes. */
export type CollectionKey =
  | "applications"
  | "problems"
  | "projects"
  | "contact_messages"
  | "suggestions"
  | "feedback"
  | "subscribers";

/** A single row. Type-specific columns are unknown and read defensively. */
export type AdminRecord = {
  id: string | number;
  created_at?: string | null;
  status?: string | null;
  notes?: string | null;
  [key: string]: unknown;
};

/** One collection's totals from GET /api/admin/summary. */
export type SummaryEntry = {
  total?: number;
  byStatus?: Record<string, number>;
  status?: Record<string, number>;
  statusCounts?: Record<string, number>;
  counts?: Record<string, number>;
};

/** Shape of GET /api/admin/summary -> { summary: { <collection>: { total, byStatus } } }. */
export type Summary = Record<string, SummaryEntry | undefined>;

/** Pull a per-status count map out of a summary entry, tolerating key variants. */
export function statusCountsFor(entry?: SummaryEntry): Record<string, number> {
  return entry?.byStatus ?? entry?.status ?? entry?.statusCounts ?? entry?.counts ?? {};
}

export type QuickAction = {
  label: string;
  status: string;
  tone?: "positive" | "negative" | "neutral";
};

export type CollectionConfig = {
  key: CollectionKey;
  /** Plural label used for tabs and headings. */
  label: string;
  /** Singular noun used in buttons/copy. */
  noun: string;
  /** Known statuses for this collection, in lifecycle order. */
  statuses: string[];
  /** Column whose value is the row's headline. */
  primaryKey: string;
  /** Other "most useful" columns shown in the compact list. */
  columns: { key: string; label: string }[];
  /** One-click status transitions. */
  quickActions: QuickAction[];
  /** Optional absolute link to the public record (projects). */
  publicPath?: (record: AdminRecord) => string | null;
};

export const PAGE_SIZE = 25;

export const COLLECTIONS: CollectionConfig[] = [
  {
    key: "applications",
    label: "Applications",
    noun: "application",
    statuses: ["new", "reviewing", "accepted", "declined"],
    primaryKey: "name",
    columns: [
      { key: "email", label: "Email" },
      { key: "location", label: "Location" },
      { key: "disciplines", label: "Disciplines" },
    ],
    quickActions: [
      { label: "Accept", status: "accepted", tone: "positive" },
      { label: "Decline", status: "declined", tone: "negative" },
    ],
  },
  {
    key: "problems",
    label: "Problems",
    noun: "problem",
    statuses: ["new", "framed", "parked", "declined", "active", "solved"],
    primaryKey: "title",
    columns: [
      { key: "submitter_name", label: "Submitter" },
      { key: "email", label: "Email" },
      { key: "location", label: "Location" },
    ],
    quickActions: [
      { label: "Frame", status: "framed", tone: "positive" },
      { label: "Activate", status: "active", tone: "positive" },
      { label: "Solve", status: "solved", tone: "positive" },
      { label: "Park", status: "parked", tone: "neutral" },
      { label: "Decline", status: "declined", tone: "negative" },
    ],
  },
  {
    key: "projects",
    label: "Projects",
    noun: "project",
    statuses: ["pending", "approved", "rejected", "archived"],
    primaryKey: "title",
    columns: [
      { key: "slug", label: "Slug" },
      { key: "stage", label: "Stage" },
      { key: "lead_name", label: "Lead" },
    ],
    quickActions: [
      { label: "Approve", status: "approved", tone: "positive" },
      { label: "Reject", status: "rejected", tone: "negative" },
    ],
    publicPath: (record) =>
      typeof record.slug === "string" && record.slug.trim()
        ? `${SITE.url}/projects/${encodeURIComponent(record.slug.trim())}`
        : null,
  },
  {
    key: "contact_messages",
    label: "Messages",
    noun: "message",
    statuses: ["new", "read", "replied", "archived"],
    primaryKey: "subject",
    columns: [
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
    ],
    quickActions: [
      { label: "Mark read", status: "read", tone: "neutral" },
      { label: "Replied", status: "replied", tone: "positive" },
      { label: "Archive", status: "archived", tone: "neutral" },
    ],
  },
  {
    key: "suggestions",
    label: "Suggestions",
    noun: "suggestion",
    statuses: ["new", "considering", "planned", "done", "declined"],
    primaryKey: "topic",
    columns: [
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
    ],
    quickActions: [
      { label: "Considering", status: "considering", tone: "neutral" },
      { label: "Plan", status: "planned", tone: "positive" },
      { label: "Done", status: "done", tone: "positive" },
      { label: "Decline", status: "declined", tone: "negative" },
    ],
  },
  {
    key: "feedback",
    label: "Feedback",
    noun: "feedback item",
    statuses: ["new", "read", "actioned", "archived"],
    primaryKey: "kind",
    columns: [
      { key: "page", label: "Page" },
      { key: "rating", label: "Rating" },
      { key: "email", label: "Email" },
    ],
    quickActions: [
      { label: "Read", status: "read", tone: "neutral" },
      { label: "Actioned", status: "actioned", tone: "positive" },
      { label: "Archive", status: "archived", tone: "neutral" },
    ],
  },
  {
    key: "subscribers",
    label: "Subscribers",
    noun: "subscriber",
    statuses: ["active", "unsubscribed", "bounced"],
    primaryKey: "email",
    columns: [
      { key: "name", label: "Name" },
      { key: "source", label: "Source" },
      { key: "created_at", label: "Subscribed" },
    ],
    quickActions: [
      { label: "Unsubscribe", status: "unsubscribed", tone: "negative" },
    ],
  },
];

export const COLLECTIONS_BY_KEY = Object.fromEntries(
  COLLECTIONS.map((c) => [c.key, c]),
) as Record<CollectionKey, CollectionConfig>;

/** "in progress" -> "In Progress" */
export function labelize(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

/** Friendly overrides for admin field names that don't read well labelized. */
const FIELD_LABELS: Record<string, string> = {
  id: "ID",
  why_bget: "Why BGET",
  url: "URL",
  url_link: "URL",
  repo: "Repo",
  demo: "Demo",
  cover_image: "Cover image",
  one_liner: "One-liner",
  lead_email: "Lead email",
  submitter_name: "Submitter",
  created_at: "Created",
  byStatus: "By status",
};

/** Human label for a raw column/field key. */
export function fieldLabel(key: string): string {
  return FIELD_LABELS[key] ?? labelize(key);
}

/** Render any value as readable text (objects become pretty JSON). */
export function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

/** Single-line preview of a value, truncated to `max` characters. */
export function preview(value: unknown, max = 120): string {
  const text = formatValue(value).replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/** Parse an ISO or SQLite datetime into a locale string; fall back to raw. */
export function formatDate(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "";
  let s = value.trim();
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s)) s = `${s.replace(" ", "T")}Z`;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function isUrl(value: string): boolean {
  return /^https?:\/\/\S+$/i.test(value.trim());
}

/** Tailwind classes for a status pill, keyed by lifecycle tone. */
export function statusTone(status?: string | null): string {
  switch ((status ?? "").toLowerCase()) {
    case "accepted":
    case "approved":
    case "active":
    case "done":
    case "actioned":
    case "replied":
    case "framed":
    case "solved":
    case "planned":
      return "border-[#eca8d6]/40 bg-[#eca8d6]/10 text-[#eca8d6]";
    case "declined":
    case "rejected":
      return "border-red-400/40 bg-red-400/10 text-red-300";
    case "reviewing":
    case "considering":
      return "border-amber-300/40 bg-amber-300/10 text-amber-200";
    case "new":
      return "border-cyan-300/40 bg-cyan-300/10 text-cyan-200";
    case "archived":
    case "parked":
      return "border-foreground/15 bg-foreground/5 text-muted-foreground";
    default:
      return "border-foreground/15 bg-foreground/5 text-muted-foreground";
  }
}

/** Accent colour for the leading dot inside a status pill (matches `statusTone`). */
export function statusDot(status?: string | null): string {
  switch ((status ?? "").toLowerCase()) {
    case "accepted":
    case "approved":
    case "active":
    case "done":
    case "actioned":
    case "replied":
    case "framed":
    case "solved":
    case "planned":
      return "bg-[#eca8d6]";
    case "declined":
    case "rejected":
      return "bg-red-400";
    case "reviewing":
    case "considering":
      return "bg-amber-300";
    case "new":
      return "bg-cyan-300";
    default:
      return "bg-muted-foreground/60";
  }
}

/** Consistent class names for a quick-action button based on its tone. */
export function quickActionClass(tone: QuickAction["tone"]): string {
  switch (tone) {
    case "positive":
      return "border-[#eca8d6]/40 bg-[#eca8d6]/10 text-[#eca8d6] hover:bg-[#eca8d6]/20";
    case "negative":
      return "border-red-400/40 text-red-300 hover:bg-red-400/10";
    default:
      return "";
  }
}

/** Order keys for the detail view: core first, known columns, then any extras. */
export function orderedKeys(config: CollectionConfig, record: AdminRecord): string[] {
  const core = ["id", "created_at", "status"];
  const known = config.columns.map((c) => c.key);
  const knownSet = new Set([...core, ...known, "notes"]);
  const extras = Object.keys(record).filter(
    (k) => !knownSet.has(k) && record[k] !== undefined,
  );
  const ordered = [...core, config.primaryKey, ...known, "notes", ...extras];
  return Array.from(new Set(ordered)).filter((k) => k in record);
}
