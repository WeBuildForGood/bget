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

// A module-level cache and in-flight promise so several sections on the same page share one fetch.
let inFlight: Promise<PublicMetrics | null> | null = null;
let cachedData: PublicMetrics | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 60_000; // 60 seconds

function fetchMetricsWithRetry(retries = 2, delayMs = 1000): Promise<PublicMetrics | null> {
  return fetch("/api/metrics", { headers: { accept: "application/json" } })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data: unknown) => {
      const out: PublicMetrics = {};
      const record = (data ?? {}) as Record<string, unknown>;
      for (const key of NUMERIC_KEYS) {
        const value = record[key];
        if (typeof value === "number" && Number.isFinite(value)) {
          out[key] = value;
        }
      }
      cachedData = out;
      cachedAt = Date.now();
      return out;
    })
    .catch((_err): Promise<PublicMetrics | null> | null => {
      if (retries > 0) {
        return new Promise<PublicMetrics | null>((resolve) => {
          setTimeout(() => {
            resolve(fetchMetricsWithRetry(retries - 1, delayMs * 2));
          }, delayMs);
        });
      }
      return null;
    });
}

function load(): Promise<PublicMetrics | null> {
  const now = Date.now();
  if (cachedData && now - cachedAt < CACHE_TTL_MS) {
    return Promise.resolve(cachedData);
  }
  if (inFlight) return inFlight;

  inFlight = fetchMetricsWithRetry()
    .then((result) => {
      inFlight = null; // Clear on completion so future calls after TTL can fetch fresh data
      return result;
    })
    .catch(() => {
      inFlight = null; // Always clear on failure so subsequent calls can retry
      return null;
    });

  return inFlight;
}

/** Subscribe to the shared, real public metrics. */
export function usePublicMetrics(): {
  metrics: PublicMetrics | null;
  status: MetricsStatus;
} {
  const [metrics, setMetrics] = useState<PublicMetrics | null>(() => {
    if (cachedData && Date.now() - cachedAt < CACHE_TTL_MS) {
      return cachedData;
    }
    return null;
  });
  const [status, setStatus] = useState<MetricsStatus>(() => {
    if (cachedData && Date.now() - cachedAt < CACHE_TTL_MS) {
      return "ready";
    }
    return "loading";
  });

  useEffect(() => {
    let alive = true;
    load().then((value) => {
      if (!alive) return;
      if (value) {
        setMetrics(value);
        setStatus("ready");
      } else if (!cachedData) {
        setStatus("error");
      }
    });

    const onOnline = () => {
      load().then((value) => {
        if (!alive) return;
        if (value) {
          setMetrics(value);
          setStatus("ready");
        }
      });
    };
    window.addEventListener("online", onOnline);

    return () => {
      alive = false;
      window.removeEventListener("online", onOnline);
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
