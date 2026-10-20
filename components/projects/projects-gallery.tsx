"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import {
  ProjectCard,
  STAGE_ORDER,
  projectTags,
  splitList,
  safeHref,
  stageLabel,
  type Project,
} from "@/components/projects/project-card";

type FetchState = "loading" | "ready" | "error";

/** How many rows to request in a single page. Keeps client-side search truthful. */
const PAGE_LIMIT = 200;

/** Pull an array of rows out of whatever envelope the Worker responds with. */
function pickArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    for (const key of ["projects", "items", "data", "results"]) {
      const value = (data as Record<string, unknown>)[key];
      if (Array.isArray(value)) return value;
    }
  }
  return [];
}

/** Narrow an unknown row to a usable Project, dropping anything malformed. */
function toProject(value: unknown): Project | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const slug = typeof row.slug === "string" ? row.slug.trim() : "";
  const title = typeof row.title === "string" ? row.title.trim() : "";
  if (!slug || !title) return null;

  const status = typeof row.status === "string" ? row.status : null;
  // The public endpoint already filters to approved rows and may not echo a
  // `status` field at all. Only drop rows that clearly are not public, so a
  // Worker change that adds/renames the field can never blank the gallery.
  if (status && ["pending", "rejected", "archived"].includes(status.toLowerCase())) {
    return null;
  }

  const str = (key: string): string | null =>
    typeof row[key] === "string" && (row[key] as string).trim() ? (row[key] as string) : null;

  return {
    slug,
    title,
    one_liner: str("one_liner"),
    description: str("description"),
    disciplines: str("disciplines"),
    stage: str("stage"),
    url: str("url"),
    repo: str("repo"),
    demo: str("demo"),
    cover_image: str("cover_image"),
    lead_name: str("lead_name"),
    location: str("location"),
    team: str("team"),
    tags:
      typeof row.tags === "string"
        ? (row.tags as string)
        : Array.isArray(row.tags)
          ? (row.tags as unknown[]).map((tag) => String(tag))
          : null,
    featured:
      typeof row.featured === "number"
        ? (row.featured as number)
        : typeof row.featured === "boolean"
          ? (row.featured ? 1 : 0)
          : null,
    status,
    created_at: str("created_at"),
  };
}

const controlClass =
  "w-full min-h-11 rounded-md border border-foreground/15 bg-foreground/[0.02] px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 hover:border-foreground/25 focus:border-foreground/40 focus:bg-foreground/[0.04]";

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground"
    >
      {children}
    </label>
  );
}

function Chevron() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
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

function LoadingGrid() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" role="status" aria-busy="true">
      <span className="sr-only">Loading projects…</span>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-3xl border border-foreground/10 bg-foreground/[0.02]"
        >
          <div className="aspect-[16/10] w-full animate-pulse bg-foreground/[0.04]" />
          <div className="p-7">
            <div className="h-5 w-20 animate-pulse rounded-full bg-foreground/10" />
            <div className="mt-5 h-7 w-3/4 animate-pulse rounded bg-foreground/10" />
            <div className="mt-4 h-4 w-full animate-pulse rounded bg-foreground/10" />
            <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-foreground/10" />
            <div className="mt-10 h-4 w-1/3 animate-pulse rounded bg-foreground/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** A readable haystack for the client-side search across the loaded rows. */
function searchText(project: Project): string {
  return [
    project.title,
    project.one_liner,
    project.description,
    project.stage,
    project.lead_name,
    project.location,
    project.team,
    splitList(project.disciplines).join(" "),
    projectTags(project.tags).join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function ProjectsGallery() {
  const [state, setState] = useState<FetchState>("loading");
  const [projects, setProjects] = useState<Project[]>([]);

  const [query, setQuery] = useState("");
  const [discipline, setDiscipline] = useState("all");
  const [stage, setStage] = useState("all");

  const requestId = useRef(0);

  const load = useCallback(async () => {
    setState("loading");
    const id = ++requestId.current;
    try {
      const res = await fetch(`/api/projects?limit=${PAGE_LIMIT}`, {
        headers: { accept: "application/json" },
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data: unknown = await res.json().catch(() => null);
      if (!data || typeof data !== "object") throw new Error("Malformed response");
      const list = pickArray(data)
        .map(toProject)
        .filter((project): project is Project => project !== null)
        .sort((a, b) => Number(b.featured ?? 0) - Number(a.featured ?? 0));
      if (id !== requestId.current) return; // superseded by a newer request
      setProjects(list);
      setState("ready");
    } catch {
      if (id !== requestId.current) return;
      setState("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /** Unique disciplines present in the loaded rows. */
  const disciplines = useMemo(() => {
    const seen = new Map<string, string>();
    for (const project of projects) {
      for (const item of splitList(project.disciplines)) {
        const key = item.toLowerCase();
        if (!seen.has(key)) seen.set(key, item);
      }
    }
    return Array.from(seen.values()).sort((a, b) => a.localeCompare(b));
  }, [projects]);

  /** Unique stages present in the loaded rows, canonical order first. */
  const stages = useMemo(() => {
    const seen = new Map<string, string>();
    for (const project of projects) {
      const raw = (project.stage ?? "").trim();
      if (!raw) continue;
      const key = raw.toLowerCase();
      if (!seen.has(key)) seen.set(key, key);
    }
    const order = new Map<string, number>(STAGE_ORDER.map((value, i) => [value, i]));
    return Array.from(seen.keys()).sort(
      (a, b) => (order.get(a) ?? 99) - (order.get(b) ?? 99) || a.localeCompare(b),
    );
  }, [projects]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const disciplineKey = discipline.toLowerCase();
    return projects.filter((project) => {
      if (disciplineKey !== "all") {
        const matches = splitList(project.disciplines).some(
          (item) => item.toLowerCase() === disciplineKey,
        );
        if (!matches) return false;
      }
      if (stage !== "all") {
        if ((project.stage ?? "").trim().toLowerCase() !== stage) return false;
      }
      if (needle && !searchText(project).includes(needle)) return false;
      return true;
    });
  }, [projects, query, discipline, stage]);

  const hasFilters = query.trim() !== "" || discipline !== "all" || stage !== "all";

  const clearFilters = () => {
    setQuery("");
    setDiscipline("all");
    setStage("all");
  };

  if (state === "loading") return <LoadingGrid />;

  if (state === "error") {
    return (
      <div
        role="alert"
        className="card-glow rounded-3xl border border-foreground/10 p-10 text-center lg:p-14"
      >
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Connection lost
        </p>
        <h3 className="mt-4 text-3xl font-display text-balance">
          We couldn&apos;t load the showcase.
        </h3>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground text-pretty">
          The gallery is fetched live, and the request didn&apos;t come back. Check your connection
          and try again — or submit a project while you&apos;re here.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <button
            type="button"
            onClick={() => void load()}
            className="hover-lift inline-flex min-h-12 items-center justify-center rounded-full bg-foreground px-7 text-sm font-medium text-background hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Try again
          </button>
          <Link
            href="#submit"
            className="hover-lift inline-flex min-h-12 items-center justify-center rounded-full border border-foreground/20 px-7 text-sm hover:bg-foreground/5"
          >
            Submit a project
          </Link>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="card-glow relative overflow-hidden rounded-3xl border border-foreground/10 p-10 text-center lg:p-16">
        <div
          className="dot-grid pointer-events-none absolute inset-0 opacity-40"
          aria-hidden="true"
        />
        <div className="relative">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            The first wave
          </p>
          <h3 className="mx-auto mt-4 max-w-2xl text-3xl font-display text-balance lg:text-4xl">
            The first Labs are being framed. Yours could be next.
          </h3>
          <p className="mx-auto mt-5 max-w-xl text-muted-foreground text-pretty">
            Nothing is published yet. Projects land here the moment a person approves them — the
            honest record of what members actually built, not what they promised. If you have made
            something real, this wall is waiting for it.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <Link
              href="#submit"
              className="hover-lift inline-flex min-h-12 items-center justify-center rounded-full bg-foreground px-7 text-sm font-medium text-background hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Submit a project
            </Link>
            <Link
              href="/problems"
              className="hover-lift inline-flex min-h-12 items-center justify-center rounded-full border border-foreground/20 px-7 text-sm hover:bg-foreground/5"
            >
              Bring a problem instead
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="w-full sm:max-w-xs">
          <FieldLabel htmlFor="project-search">Search</FieldLabel>
          <input
            id="project-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Title, lead, place, tag…"
            className={controlClass}
          />
        </div>

        <div className="w-full sm:w-56">
          <FieldLabel htmlFor="project-discipline">Discipline</FieldLabel>
          <div className="relative">
            <select
              id="project-discipline"
              value={discipline}
              onChange={(event) => setDiscipline(event.target.value)}
              className={`${controlClass} appearance-none pr-10`}
            >
              <option value="all">All disciplines</option>
              {disciplines.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <Chevron />
          </div>
        </div>

        <div className="w-full sm:w-48">
          <FieldLabel htmlFor="project-stage">Stage</FieldLabel>
          <div className="relative">
            <select
              id="project-stage"
              value={stage}
              onChange={(event) => setStage(event.target.value)}
              className={`${controlClass} appearance-none pr-10`}
            >
              <option value="all">All stages</option>
              {stages.map((item) => (
                <option key={item} value={item}>
                  {stageLabel(item)}
                </option>
              ))}
            </select>
            <Chevron />
          </div>
        </div>

        {hasFilters ? (
          <button
            type="button"
            onClick={clearFilters}
            className="hover-lift inline-flex min-h-11 items-center justify-center rounded-full border border-foreground/20 px-6 text-sm hover:bg-foreground/5"
          >
            Clear
          </button>
        ) : null}
      </div>

      <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground" aria-live="polite">
        {filtered.length === projects.length
          ? `${projects.length} project${projects.length === 1 ? "" : "s"}`
          : `${filtered.length} of ${projects.length} projects`}
      </p>

      {filtered.length === 0 ? (
        <div
          className="card-glow rounded-3xl border border-foreground/10 p-10 text-center lg:p-14"
          role="status"
        >
          <h3 className="text-2xl font-display text-balance">No projects match those filters.</h3>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground text-pretty">
            Try a different discipline or stage — or clear the filters to see everything in the
            showcase. The search reads titles, summaries, people, places, and tags.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="hover-lift mt-8 inline-flex min-h-12 items-center justify-center rounded-full border border-foreground/20 px-7 text-sm hover:bg-foreground/5"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <ul className="grid list-none gap-6 p-0 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project, i) => (
            <li key={project.slug} className="h-full">
              <Reveal delay={(i % 3) * 70} y={24} className="h-full">
                <ProjectCard project={project} />
              </Reveal>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
