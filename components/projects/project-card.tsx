import Link from "next/link";

/**
 * Shape of an approved project as returned by `GET /api/projects`.
 * Field names mirror the D1 `projects` table (migrations/0002_projects.sql).
 * Everything except `slug`/`title` is treated as optional so the card renders
 * gracefully even if the Worker returns a partial row.
 */
export type Project = {
  slug: string;
  title: string;
  one_liner?: string | null;
  description?: string | null;
  disciplines?: string | null;
  stage?: string | null;
  url?: string | null;
  repo?: string | null;
  demo?: string | null;
  cover_image?: string | null;
  lead_name?: string | null;
  location?: string | null;
  team?: string | null;
  tags?: string | string[] | null;
  featured?: number | boolean | null;
  status?: string | null;
  created_at?: string | null;
};

/** Canonical stage labels — mirrors the `STAGES` list in project-form.tsx. */
export const STAGE_LABELS: Record<string, string> = {
  idea: "Idea",
  prototype: "Prototype",
  pilot: "Pilot",
  live: "Live",
  scaled: "Scaled",
};

/** Order used when listing stage filter options, most-early work first. */
export const STAGE_ORDER = ["idea", "prototype", "pilot", "live", "scaled"] as const;

/** Turn a possibly-comma-separated D1 TEXT column (or an array) into a list. */
export function splitList(value?: string | string[] | null): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/** Tags may arrive as a comma-separated string (D1 TEXT) or an array. */
export function projectTags(tags: Project["tags"]): string[] {
  return splitList(tags);
}

/**
 * Normalise a possibly-bare URL into something safe to put in an `href`.
 *
 * Only two shapes are trusted as-is: an absolute `http(s)://` URL, or a single
 * leading slash for a site-internal path (`/projects/x`). Everything else is
 * treated as a bare host and prefixed with `https://`.
 *
 * Anything that is *not* a single-leading-slash path is either rejected or
 * rebuilt, so `//evil.example` (a protocol-relative redirect off-site) and
 * `/\evil.example` (browsers treat `\` as `/`, so it resolves the same way) can
 * never leave the origin. This mirrors the strict `safeHttpUrl` used by the SSR
 * renderer.
 */
export function safeHref(value?: string | null): string | null {
  const raw = (value ?? "").trim();
  if (!raw) return null;

  // Absolute http(s) URLs are the only schemes we emit verbatim.
  if (/^https?:\/\//i.test(raw)) return raw;

  // A single leading slash is a site-internal path. A second slash — or a
  // backslash, which the URL parser normalises to a slash — is protocol-relative.
  if (raw.startsWith("//") || raw.startsWith("/\\")) return null;
  if (raw.startsWith("/")) return raw;

  // Bare host/path: strip any leading slashes or backslashes so the result is
  // always a real `https://` URL rather than `https:///…`.
  const host = raw.replace(/^[\\/]+/, "");
  return host ? `https://${host}` : null;
}

/** Human label for a stage value, falling back to the raw string. */
export function stageLabel(stage?: string | null): string | null {
  const raw = (stage ?? "").trim();
  if (!raw) return null;
  return STAGE_LABELS[raw.toLowerCase()] ?? raw;
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

/** e.g. "Mar 2026" — used for the card's `<time>` stamp. */
export function formatMonthYear(value?: string | null): string | null {
  const date = parseDate(value);
  if (!date) return null;
  return date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

/** ISO string for a `<time dateTime>` attribute, or null when unparseable. */
export function dateTimeAttr(value?: string | null): string | null {
  return parseDate(value)?.toISOString() ?? null;
}

type ProjectCardProps = {
  project: Project;
  /** Heading level for the card title — defaults to `h3` inside a section. */
  headingLevel?: "h2" | "h3";
};

export function ProjectCard({ project, headingLevel = "h3" }: ProjectCardProps) {
  const Heading = headingLevel;

  const tags = projectTags(project.tags);
  const shownTags = tags.slice(0, 3);
  const extraTags = tags.length - shownTags.length;

  const disciplines = splitList(project.disciplines).slice(0, 3);

  const stage = stageLabel(project.stage);

  const external = [
    { label: "Website", href: safeHref(project.url) },
    { label: "Repo", href: safeHref(project.repo) },
    { label: "Demo", href: safeHref(project.demo) },
  ].flatMap((link) => (link.href ? [{ label: link.label, href: link.href }] : []));

  const cover = project.cover_image?.trim();
  const meta = [project.lead_name, project.location]
    .map((value) => (value ?? "").trim())
    .filter((value): value is string => Boolean(value));

  const createdLabel = formatMonthYear(project.created_at);
  const createdIso = dateTimeAttr(project.created_at);
  const titleId = `project-${project.slug}-title`;

  return (
    <article
      aria-labelledby={titleId}
      className="card-glow hover-lift group flex h-full flex-col overflow-hidden rounded-3xl border border-foreground/10 bg-foreground/[0.02]"
    >
      {cover ? (
        <div className="aspect-[16/10] w-full overflow-hidden bg-foreground/[0.03]">
          <img
            src={cover}
            alt={`Cover image for ${project.title}`}
            width={1600}
            height={1000}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
        </div>
      ) : null}

      <div className="flex flex-1 flex-col p-7">
        {stage ? (
          <span className="inline-flex w-fit items-center rounded-full border border-[#eca8d6]/30 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-[#eca8d6]">
            {stage}
          </span>
        ) : null}

        <Heading
          id={titleId}
          className="mt-4 break-words text-2xl font-display leading-snug tracking-tight text-balance"
        >
          <Link href={`/projects/${project.slug}`} className="link-underline">
            {project.title}
          </Link>
        </Heading>

        {project.one_liner ? (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">
            {project.one_liner}
          </p>
        ) : null}

        {disciplines.length ? (
          <ul className="mt-5 flex flex-wrap gap-2" aria-label="Disciplines">
            {disciplines.map((discipline) => (
              <li
                key={discipline}
                className="rounded-full border border-foreground/15 bg-foreground/[0.03] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground"
              >
                {discipline}
              </li>
            ))}
          </ul>
        ) : null}

        {shownTags.length ? (
          <ul className="mt-2 flex flex-wrap gap-2" aria-label="Tags">
            {shownTags.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-foreground/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground"
              >
                {tag}
              </li>
            ))}
            {extraTags > 0 ? (
              <li className="rounded-full border border-foreground/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70">
                +{extraTags}
              </li>
            ) : null}
          </ul>
        ) : null}

        <div className="mt-auto pt-6">
          {meta.length || createdLabel ? (
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              {meta.map((part, i) => (
                <span key={part} className="flex items-center gap-2">
                  {i > 0 ? (
                    <span aria-hidden="true" className="text-muted-foreground/40">
                      ·
                    </span>
                  ) : null}
                  {part}
                </span>
              ))}
              {createdLabel ? (
                <span className="flex items-center gap-2">
                  {meta.length ? (
                    <span aria-hidden="true" className="text-muted-foreground/40">
                      ·
                    </span>
                  ) : null}
                  <time dateTime={createdIso ?? undefined}>{createdLabel}</time>
                </span>
              ) : null}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] uppercase tracking-[0.15em]">
            <Link
              href={`/projects/${project.slug}`}
              aria-label={`View project: ${project.title}`}
              className="link-underline text-foreground"
            >
              View project →
            </Link>
            {external.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${link.label} for ${project.title} (opens in a new tab)`}
                className="link-underline text-muted-foreground hover:text-foreground"
              >
                {link.label} <span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
