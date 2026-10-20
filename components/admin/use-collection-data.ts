"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  apiRequest,
  errorMessage,
  isAbortError,
  isUnauthorizedStatus,
  type ApiResult,
} from "./api";
import type { AdminRecord, CollectionKey } from "./config";

export type CollectionQuery = {
  /** "all" or one of the collection's statuses. */
  status: string;
  /** Debounced search term; empty means no search. */
  q: string;
  offset: number;
  limit: number;
};

export type CollectionData = {
  items: AdminRecord[];
  total: number;
  /** Page size the server actually honoured (it clamps `limit`). */
  limit: number;
  loading: boolean;
  error: string | null;
};

type ListResponse = {
  ok?: boolean;
  items?: AdminRecord[];
  total?: number;
  limit?: number;
};

/** Debounce a rapidly changing value (search input) by `delay` ms. */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/**
 * Load one page of a collection and keep it honest under concurrent requests.
 *
 * A monotonic sequence number plus an `AbortController` guarantee that a slow
 * response can never overwrite a newer one, and that unmount/refetch aborts
 * in-flight work instead of landing stale rows on screen.
 *
 * `reload({ silent: true })` refetches without flipping `loading`, which is
 * what mutations use to reconcile against the server without a skeleton flash.
 */
export function useCollectionData(
  collection: CollectionKey,
  query: CollectionQuery,
  onUnauthorized: () => void,
) {
  const [state, setState] = useState<CollectionData>({
    items: [],
    total: 0,
    limit: query.limit,
    loading: true,
    error: null,
  });

  const seq = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const unauthorizedRef = useRef(onUnauthorized);
  unauthorizedRef.current = onUnauthorized;

  const load = useCallback(
    async (options?: { silent?: boolean }) => {
      const id = ++seq.current;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      if (!options?.silent) {
        setState((prev) => ({ ...prev, loading: true, error: null }));
      }

      const params = new URLSearchParams();
      if (query.status && query.status !== "all") {
        params.set("status", query.status);
      }
      const term = query.q.trim();
      if (term) params.set("q", term);
      params.set("limit", String(query.limit));
      params.set("offset", String(query.offset));

      let result: ApiResult<ListResponse>;
      try {
        result = await apiRequest<ListResponse>(
          `/api/admin/${collection}?${params.toString()}`,
          { signal: controller.signal },
        );
      } catch (err) {
        if (isAbortError(err) || id !== seq.current) return;
        setState({
          items: [],
          total: 0,
          limit: query.limit,
          loading: false,
          error: "Couldn't reach the admin service.",
        });
        return;
      }

      // A superseded request must never touch state.
      if (id !== seq.current) return;

      if (isUnauthorizedStatus(result.status)) {
        unauthorizedRef.current();
        return;
      }

      const data = result.data;
      if (!result.ok || !data || data.ok !== true) {
        setState({
          items: [],
          total: 0,
          limit: query.limit,
          loading: false,
          error: errorMessage(data, "Could not load this collection."),
        });
        return;
      }

      setState({
        items: Array.isArray(data.items) ? data.items : [],
        total: typeof data.total === "number" ? data.total : 0,
        limit: typeof data.limit === "number" ? data.limit : query.limit,
        loading: false,
        error: null,
      });
    },
    [collection, query.status, query.q, query.offset, query.limit],
  );

  useEffect(() => {
    void load();
    return () => abortRef.current?.abort();
  }, [load]);

  /** Optimistic local patch of a single row; reconciled by the next `reload`. */
  const setItems = useCallback(
    (updater: AdminRecord[] | ((prev: AdminRecord[]) => AdminRecord[])) => {
      setState((prev) => ({
        ...prev,
        items:
          typeof updater === "function" ? updater(prev.items) : updater,
      }));
    },
    [],
  );

  return { ...state, reload: load, setItems };
}
