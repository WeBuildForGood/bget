/**
 * Thin fetch layer for the admin JSON API (`/api/admin/*`).
 *
 * Every request goes through `apiRequest`, which:
 *   - always sends Access cookies (`credentials: "include"`),
 *   - never throws on a non-2xx status or a malformed body,
 *   - rethrows only genuine aborts, so callers can quietly ignore requests
 *     that were superseded (see `useCollectionData`).
 *
 * Mutations are thin named wrappers so the panel never builds URLs by hand and
 * the request shapes stay in one place next to the worker contract.
 */

/** Result of a JSON request that always resolves, even on failure. */
export type ApiResult<T> = {
  ok: boolean;
  /** HTTP status, or 0 when the request never reached the server. */
  status: number;
  data: T | null;
  /** True when `fetch` itself failed (offline, DNS, CORS, abort aside). */
  networkError: boolean;
};

const NETWORK_STATUS = 0;

/** True for a fetch/body-read `AbortError` (name-based; DOMException may be absent in tests). */
export function isAbortError(err: unknown): boolean {
  if (typeof DOMException !== "undefined" && err instanceof DOMException) {
    return err.name === "AbortError";
  }
  return err instanceof Error && err.name === "AbortError";
}

/** Cloudflare Access rejects with 401 (no token) or 403 (token rejected). */
export function isUnauthorizedStatus(status: number): boolean {
  return status === 401 || status === 403;
}

/**
 * Fetch JSON from the admin API without throwing on bad responses.
 *
 * @throws only an abort error so a caller can bail out of a superseded request.
 */
export async function apiRequest<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  let res: Response;
  try {
    res = await fetch(path, {
      credentials: "include",
      ...init,
      headers: {
        accept: "application/json",
        ...((init?.headers as Record<string, string> | undefined) ?? {}),
      },
    });
  } catch (err) {
    if (isAbortError(err)) throw err;
    return { ok: false, status: NETWORK_STATUS, data: null, networkError: true };
  }

  let data: T | null = null;
  try {
    data = (await res.json()) as T;
  } catch (err) {
    if (isAbortError(err)) throw err;
    data = null;
  }

  return { ok: res.ok, status: res.status, data, networkError: false };
}

/* ------------------------------------------------------------------ */
/* Mutations                                                           */
/* ------------------------------------------------------------------ */

/** PATCH /api/admin/:collection/:id — update status and/or notes. */
export function patchRecord(
  collection: string,
  id: string,
  body: Record<string, unknown>,
) {
  return apiRequest<{ ok?: boolean }>(
    `/api/admin/${collection}/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

/** DELETE /api/admin/:collection/:id — permanently remove one row. */
export function deleteRecord(collection: string, id: string) {
  return apiRequest<{ ok?: boolean }>(
    `/api/admin/${collection}/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
}

/** PATCH /api/admin/:collection/status — apply one status to many ids. */
export function bulkSetStatus(
  collection: string,
  ids: number[],
  status: string,
) {
  return apiRequest<{ ok?: boolean; updated?: number }>(
    `/api/admin/${collection}/status`,
    {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ids, status }),
    },
  );
}

/* ------------------------------------------------------------------ */
/* Error text                                                          */
/* ------------------------------------------------------------------ */

/**
 * The worker returns machine codes (`{ ok: false, error: "invalid_table" }`),
 * not prose. Map the common ones and otherwise surface the raw code so nothing
 * is silently swallowed.
 */
const ERROR_MESSAGES: Record<string, string> = {
  unauthorized: "Your session has expired. Sign in again.",
  forbidden: "You don't have access to do that.",
  not_found: "That record no longer exists.",
  invalid_id: "That record id isn't valid.",
  invalid: "The server rejected that change.",
  invalid_table: "Unknown collection.",
  invalid_json: "The server couldn't read the request.",
  invalid_body: "The server couldn't read the request.",
  payload_too_large: "That value is too long to save.",
  network_error: "Couldn't reach the admin service.",
  rate_limited: "Too many requests. Wait a moment and try again.",
};

/**
 * Human-readable message for a failed response.
 *
 * Prefers our curated text for known machine codes, but when the worker (or a
 * proxy in front of it) sends prose — `message`, or an unrecognised `error`
 * string that is clearly a sentence — surface that verbatim so nothing useful
 * is hidden behind a generic fallback.
 */
export function errorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;
  const record = data as { error?: unknown; message?: unknown };

  const prose =
    typeof record.message === "string" && record.message.trim()
      ? record.message.trim()
      : null;
  const code =
    typeof record.error === "string" && record.error.trim()
      ? record.error.trim()
      : null;

  if (code) {
    const mapped = ERROR_MESSAGES[code];
    if (mapped) return mapped;
    // Not a code we know: a multi-word string is prose, so show it as-is.
    if (prose) return prose;
    if (/\s/.test(code)) return code;
    return `${fallback} (${code})`;
  }

  return prose ?? fallback;
}

/* ------------------------------------------------------------------ */
/* CSV export                                                          */
/* ------------------------------------------------------------------ */

/**
 * GET /api/admin/export?table=<collection> and save it as a file.
 *
 * Uses fetch rather than a plain link so that an expired Access session or a
 * server error can be surfaced instead of navigating the tab to an error body.
 */
export async function downloadCsv(collection: string): Promise<ApiResult<unknown>> {
  let res: Response;
  try {
    res = await fetch(
      `/api/admin/export?table=${encodeURIComponent(collection)}`,
      { credentials: "include", headers: { accept: "text/csv" } },
    );
  } catch {
    return { ok: false, status: NETWORK_STATUS, data: null, networkError: true };
  }

  if (!res.ok) {
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { ok: false, status: res.status, data, networkError: false };
  }

  const blob = await res.blob();
  const filename =
    filenameFromHeader(res.headers.get("content-disposition")) ??
    `${collection}.csv`;
  triggerDownload(blob, filename);
  return { ok: true, status: res.status, data: null, networkError: false };
}

function filenameFromHeader(header: string | null): string | null {
  if (!header) return null;
  const match = /filename="?([^";]+)"?/i.exec(header);
  return match ? match[1].trim() : null;
}

function triggerDownload(blob: Blob, filename: string): void {
  if (typeof document === "undefined" || typeof URL === "undefined") return;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Let the browser start the download before the object URL is released.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
