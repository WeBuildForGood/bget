import type { ReactNode } from "react";

/**
 * Shape of a public problem as returned by `GET /api/problems`.
 * Field names mirror the D1 `problems` table (migrations/0001_init.sql) and the
 * Worker's `PUBLIC_PROBLEM_FIELDS` allow-list. Only `slug` and `title` are
 * required here; every other field is optional so the board keeps rendering if
 * the Worker evolves or renames a field.
 */
export type Problem = {
  id?: number | string | null;
  /** Stable handle — the Worker falls back to the numeric id for legacy rows. */
  slug: string;
  title: string;
  description?: string | null;
  affected?: string | null;
  tried?: string | null;
  success_looks_like?: string | null;
  contribution?: string | null;
  location?: string | null;
  status?: string | null;
  created_at?: string | null;
};

/** Canonical status labels. Public rows are `framed` / `active`; the rest
 *  exist in the schema and are shown here so a policy change renders cleanly. */
export const STATUS_LABELS: Record<string, string> = {
  framed: "Framed",
  active: "Active",
  parked: "Parked",
  declined: "Declined",
  new: "New",
};

/** Order used when listing status filter options. Public states first. */
export const STATUS_ORDER = ["framed", "active", "parked", "declined", "new"] as const;

/** Human label for a status value, falling back to the raw string. */
export function statusLabel(status?: string | null): string | null {
  const raw = (status ?? "").trim();
  if (!raw) return null;
  return STATUS_LABELS[raw.toLowerCase()] ?? raw;
}

/** Parse a D1 (`YYYY-MM-DD HH:MM:SS`) or ISO timestamp without throwing. */
function parseDate(value?: string | null): Date | null {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  const normalised = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(raw)
    ? `${raw.replace(" ", "T")}Z`
    : raw;
  const date = new Date(normalised);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** e.g. "12 Mar 2026" — used for the card's `<time>` stamp. */
export function formatDate(value?: string | null): string | null {
  const date = parseDate(value);
  if (!date) return null;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

/** ISO string for a `<time dateTime>` attribute, or null when unparseable. */
export function dateTimeAttr(value?: string | null): string | null {
  return parseDate(value)?.toISOString() ?? null;
}

/** Collapse whitespace and cut on a word boundary so excerpts read cleanly. */
export function excerpt(text: string, max = 220): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : max).trimEnd()}…`;
}

/** Accent tone per status — framed/active get the site's signature colours. */
const STATUS_TONE: Record<string, string> = {
  framed: "border-[#eca8d6]/40 text-[#eca8d6]",
  active: "border-[#67e8f9]/45 text-[#67e8f9]",
};

function Chevron() {
  return (
    <span
      aria-hidden="true"
      className="text-muted-foreground transition-transform duration-300 group-open:rotate-180"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path
          d="M2.5 4.5 6 8l3.5-3.5"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function PermalinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M6.5 9.5 9.5 6.5M7 3.8 8.3 2.5a3 3 0 0 1 4.2 4.2L11.2 8M9 12.2 7.7 13.5a3 3 0 0 1-4.2-4.2L4.8 8"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground/80">
        {label}
      </dt>
      <dd className="mt-1.5 text-foreground/80">{children}</dd>
    </div>
  );
}

type ProblemCardProps = {
  problem: Problem;
  /** Heading level for the card title — defaults to `h3` inside a section. */
  headingLevel?: "h2" | "h3";
};

export function ProblemCard({ problem, headingLevel = "h3" }: ProblemCardProps) {
  const Heading = headingLevel;

  const status = statusLabel(problem.status);
  const statusKey = (problem.status ?? "").trim().toLowerCase();
  const tone = STATUS_TONE[statusKey] ?? "border-foreground/20 text-muted-foreground";

  const createdLabel = formatDate(problem.created_at);
  const createdIso = dateTimeAttr(problem.created_at);

  const titleId = `problem-${problem.slug}-title`;
  const description = (problem.description ?? "").trim();
  const collapsed = excerpt(description);

  const details: Array<[string, string]> = (
    [
      ["Who is affected", problem.affected],
      ["What has already been tried", problem.tried],
      ["What success looks like", problem.success_looks_like],
      ["What the submitter can contribute", problem.contribution],
    ] as Array<[string, string | null | undefined]>
  ).flatMap(([label, value]) => {
    const text = (value ?? "").trim();
    return text ? [[label, text] as [string, string]] : [];
  });

  // Only disclose when there is genuinely more than the visible excerpt.
  const hasFullText =
    details.length > 0 || collapsed !== description.replace(/\s+/g, " ").trim();

  return (
    <article
      id={problem.slug}
      aria-labelledby={titleId}
      className="card-glow hover-lift group flex h-full scroll-mt-32 flex-col overflow-hidden rounded-3xl border border-foreground/10 bg-foreground/[0.02] p-7"
    >
      <div className="flex flex-wrap items-center gap-3">
        {status ? (
          <span
            className={`inline-flex w-fit items-center rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.15em] ${tone}`}
          >
            {status}
          </span>
        ) : null}
        {createdLabel ? (
          <time
            dateTime={createdIso ?? undefined}
            className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70"
          >
            {createdLabel}
          </time>
        ) : null}
      </div>

      <div className="mt-4 flex items-start justify-between gap-4">
        <Heading
          id={titleId}
          className="min-w-0 break-words text-2xl font-display leading-snug tracking-tight text-balance"
        >
          {problem.title}
        </Heading>
        <a
          href={`#${problem.slug}`}
          aria-label={`Permalink to ${problem.title}`}
          title="Permalink to this problem"
          className="mt-1 shrink-0 rounded-md p-1.5 text-muted-foreground/60 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
        >
          <PermalinkIcon />
        </a>
      </div>

      {problem.location?.trim() ? (
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
          {problem.location.trim()}
        </p>
      ) : null}

      {description ? (
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground text-pretty">
          {collapsed}
        </p>
      ) : null}

      {hasFullText ? (
        <details className="group mt-6 rounded-2xl border border-foreground/10 bg-foreground/[0.02] transition-colors open:bg-foreground/[0.04]">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 [&::-webkit-details-marker]:hidden">
            Read the full submission
            <Chevron />
          </summary>
          <div className="space-y-5 border-t border-foreground/10 px-5 py-5 text-sm leading-relaxed text-muted-foreground">
            {description ? <p className="text-pretty">{description}</p> : null}
            {details.length ? (
              <dl className="space-y-5">
                {details.map(([label, text]) => (
                  <Detail key={label} label={label}>
                    {text}
                  </Detail>
                ))}
              </dl>
            ) : null}
          </div>
        </details>
      ) : null}
    </article>
  );
}
