"use client";

import { useEffect, useState } from "react";

/**
 * Real, aggregate-only metrics served by `GET /api/metrics`.
 *
 * Every field is optional on purpose: if the API has not been deployed with a
 * field yet, or the request fails, the value stays `undefined` and the UI shows
 * "—" rather than a fabricated number. We never invent metrics.
 */
export type PublicMetrics = {
  problems_total?: number;
  problems_public_open?: number;
  problems_solved?: number;
  projects_total?: number;
  projects_approved?: number;
  projects_live?: number;
  applications_total?: number;
  applications_new?: number;
};

export type MetricsStatus = "loading" | "ready" | "error";

const NUMERIC_KEYS: (keyof PublicMetrics)[] = [
  "problems_total",
  "problems_public_open",
  "problems_solved",
  "projects_total",
  "projects_approved",
  "projects_live",
  "applications_total",
  "applications_new",
];

// A module-level promise so several sections on the same page share one fetch.
let inFlight: Promise<PublicMetrics | null> | null = null;

function load(): Promise<PublicMetrics | null> {
  if (inFlight) return inFlight;
  inFlight = fetch("/api/metrics", { headers: { accept: "application/json" } })
    .then((res) =>
      res.ok ? res.json() : Promise.reject(new Error(String(res.status))),
    )
    .then((data: unknown) => {
      const out: PublicMetrics = {};
      const record = (data ?? {}) as Record<string, unknown>;
      for (const key of NUMERIC_KEYS) {
        const value = record[key];
        if (typeof value === "number" && Number.isFinite(value)) {
          out[key] = value;
        }
      }
      return out;
    })
    .catch(() => null);
  return inFlight;
}

/** Subscribe to the shared, real public metrics. */
export function usePublicMetrics(): {
  metrics: PublicMetrics | null;
  status: MetricsStatus;
} {
  const [metrics, setMetrics] = useState<PublicMetrics | null>(null);
  const [status, setStatus] = useState<MetricsStatus>("loading");

  useEffect(() => {
    let alive = true;
    load().then((value) => {
      if (!alive) return;
      if (value) {
        setMetrics(value);
        setStatus("ready");
      } else {
        setStatus("error");
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  return { metrics, status };
}

/**
 * Render a metric honestly: a grouped number when we have a real value, or an
 * em dash while unknown. Never a placeholder that could be mistaken for data.
 */
export function formatMetric(value: number | undefined | null): string {
  return typeof value === "number" && Number.isFinite(value)
    ? value.toLocaleString()
    : "—";
}
