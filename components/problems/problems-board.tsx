"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import {
  ProblemCard,
  STATUS_ORDER,
  statusLabel,
  type Problem,
} from "@/components/problems/problem-card";

type FetchState = "loading" | "ready" | "error";

/** Rows requested per page. The Worker caps `limit` at 100 for /api/problems. */
const PAGE_LIMIT = 100;
/** Hard ceiling on pages walked, so a hostile `total` can't loop forever. */
const MAX_PAGES = 10;

/** Pull an array of rows out of whatever envelope the Worker responds with. */
function pickArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    for (const key of ["problems", "items", "data", "results"]) {
      const value = (data as Record<string, unknown>)[key];
      if (Array.isArray(value)) return value;
    }
  }
  return [];
}

/** Narrow an unknown row to a usable Problem, dropping anything malformed. */
function toProblem(value: unknown): Problem | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;

  const title = typeof row.title === "string" ? row.title.trim() : "";
  const rawSlug = typeof row.slug === "string" ? row.slug.trim() : "";
  const rawId =
    typeof row.id === "number" || typeof row.id === "string" ? String(row.id) : "";
  // The Worker guarantees a slug, but legacy rows may only have an id.
  const slug = rawSlug || rawId;
  if (!slug || !title) return null;

  const str = (key: string): string | null => {
    const value = row[key];
    return typeof value === "string" && value.trim() ? value : null;
  };

  return {
    slug,
    title,
    id: (row.id as number | string | undefined) ?? null,
    description: str("description"),
    affected: str("affected"),
    tried: str("tried"),
    success_looks_like: str("success_looks_like"),
    contribution: str("contribution"),
    location: str("location"),
    status: str("status"),
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

function LoadingList() {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">Loading problems…</span>
      <ul className="grid list-none gap-6 p-0 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <li
            key={i}
            className="overflow-hidden rounded-3xl border border-foreground/10 bg-foreground/[0.02] p-7"
          >
            <div className="h-5 w-20 animate-pulse rounded-full bg-foreground/10" />
            <div className="mt-5 h-7 w-3/4 animate-pulse rounded bg-foreground/10" />
            <div className="mt-4 h-4 w-full animate-pulse rounded bg-foreground/10" />
            <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-foreground/10" />
            <div className="mt-8 h-10 w-full animate-pulse rounded-2xl bg-foreground/[0.06]" />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ProblemsBoard() {
  const [state, setState] = useState<FetchState>("loading");
  const [problems, setProblems] = useState<Problem[]>([]);
  const [total, setTotal] = useState<number | null>(null);

  const [status, setStatus] = useState("all");

  const requestId = useRef(0);

  const load = useCallback(async () => {
    setState("loading");
    const id = ++requestId.current;
    try {
      const all: Problem[] = [];
      let total: number | null = null;
      let offset = 0;

      for (let page = 0; page < MAX_PAGES; page++) {
        const res = await fetch(`/api/problems?limit=${PAGE_LIMIT}&offset=${offset}`, {
          headers: { accept: "application/json" },
        });

        // A 404 means the endpoint is not available in this deployment yet.
        // Degrade to the honest empty state rather than a scary error.
        if (res.status === 404) {
          if (id !== requestId.current) return;
          setProblems([]);
          setTotal(0);
          setState("ready");
          return;
        }
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);

        const data: unknown = await res.json().catch(() => null);
        if (!data || typeof data !== "object") throw new Error("Malformed response");

        const totalRaw = (data as Record<string, unknown>).total;
        if (typeof totalRaw === "number") total = totalRaw;

        const rows = pickArray(data);
        all.push(...rows.map(toProblem).filter((p): p is Problem => p !== null));
        offset += rows.length;

        if (rows.length < PAGE_LIMIT) break;
        if (total !== null && offset >= total) break;
      }

      if (id !== requestId.current) return; // superseded by a newer request
      setProblems(all);
      setTotal(total);
      setState("ready");
    } catch {
      if (id !== requestId.current) return;
      setState("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /**
   * Static export has no `/problems/[slug]` route, so problems are addressed by
   * fragment (`/problems#<slug>`). The cards only exist after the client fetch,
   * so the browser can't scroll to them on load — honour the hash ourselves once
   * the rows are in the DOM.
   */
  const didHonourHash = useRef(false);
  useEffect(() => {
    if (state !== "ready" || didHonourHash.current) return;
    didHonourHash.current = true;
    const raw = window.location.hash.replace(/^#/, "");
    if (!raw) return;
    let target: HTMLElement | null = null;
    try {
      target = document.getElementById(decodeURIComponent(raw));
    } catch {
      target = document.getElementById(raw);
    }
    if (target) {
      requestAnimationFrame(() => target?.scrollIntoView({ block: "start" }));
    }
  }, [state, problems]);

  /** Unique statuses present in the loaded rows, canonical order first. */
  const statuses = useMemo(() => {
    const seen = new Set<string>();
    for (const problem of problems) {
      const raw = (problem.status ?? "").trim().toLowerCase();
      if (raw) seen.add(raw);
    }
    const order = new Map<string, number>(STATUS_ORDER.map((value, i) => [value, i]));
    return Array.from(seen).sort(
      (a, b) => (order.get(a) ?? 99) - (order.get(b) ?? 99) || a.localeCompare(b),
    );
  }, [problems]);

  const filtered = useMemo(() => {
    return problems.filter((problem) => {
      if (status !== "all" && (problem.status ?? "").trim().toLowerCase() !== status) {
        return false;
      }
      return true;
    });
  }, [problems, status]);

  const hasFilters = status !== "all";

  const clearFilters = () => {
    setStatus("all");
  };

  if (state === "loading") return <LoadingList />;

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
          We couldn&apos;t load the commons.
        </h3>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground text-pretty">
          The board is fetched live, and the request didn&apos;t come back. Check your connection
          and try again — or bring a problem while you&apos;re here.
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
            Submit a problem
          </Link>
        </div>
      </div>
    );
  }

  if (problems.length === 0) {
    return (
      <div className="card-glow relative overflow-hidden rounded-3xl border border-foreground/10 p-10 text-center lg:p-16">
        <div className="dot-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
        <div className="relative">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            The commons is open
          </p>
          <h3 className="mx-auto mt-4 max-w-2xl text-3xl font-display text-balance lg:text-4xl">
            No problems framed yet. Be the first.
          </h3>
          <p className="mx-auto mt-5 max-w-xl text-muted-foreground text-pretty">
            Nothing is published here yet. A problem appears once a person has reviewed it and the
            submitter has agreed to make it public — framed, with where it is and how it is going.
            If something in your world needs a team, this is where it starts.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <Link
              href="#submit"
              className="hover-lift inline-flex min-h-12 items-center justify-center rounded-full bg-foreground px-7 text-sm font-medium text-background hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Submit a problem
            </Link>
            <Link
              href="/projects"
              className="hover-lift inline-flex min-h-12 items-center justify-center rounded-full border border-foreground/20 px-7 text-sm hover:bg-foreground/5"
            >
              See the projects
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="w-full sm:w-56">
          <FieldLabel htmlFor="problem-status">Status</FieldLabel>
          <div className="relative">
            <select
              id="problem-status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className={`${controlClass} appearance-none pr-10`}
            >
              <option value="all">All statuses</option>
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {statusLabel(item) ?? item}
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

      <p
        className="mb-6 font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground"
        aria-live="polite"
      >
        {hasFilters
          ? `${filtered.length} of ${problems.length} problems`
          : total !== null && total > problems.length
            ? `${problems.length} of ${total} problems`
            : `${problems.length} problem${problems.length === 1 ? "" : "s"}`}
      </p>

      {filtered.length === 0 ? (
        <div
          role="status"
          className="card-glow rounded-3xl border border-foreground/10 p-10 text-center lg:p-14"
        >
          <h3 className="text-2xl font-display text-balance">No problems match those filters.</h3>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground text-pretty">
            Try a different status — or clear the filters to see everything on the board.
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
        <ul className="grid list-none gap-6 p-0 md:grid-cols-2">
          {filtered.map((problem, i) => (
            <li key={problem.slug} className="h-full">
              <Reveal delay={(i % 2) * 80} y={24} className="h-full">
                <ProblemCard problem={problem} />
              </Reveal>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
