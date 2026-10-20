/**
 * Self-hosted analytics — configuration and transport helpers.
 *
 * WHY THIS EXISTS
 * ---------------
 * The site previously shipped `@vercel/analytics` through `<Analytics />` in the
 * root layout. That package only works when a Vercel edge runtime is serving the
 * app: in production it injects a script from `/_vercel/insights/script.js` and
 * posts events to the `/_vercel/insights/*` endpoints. This site is a Next.js
 * *static export* (`output: 'export'`) served as plain assets by a Cloudflare
 * Worker, so none of those paths exist. The practical result was a 404 script
 * request, a `[Vercel Web Analytics] Failed to load script …` console error on
 * every page, and zero events actually collected.
 *
 * PRIVACY CONTRACT — keep all of these true if you change the code
 * ---------------------------------------------------------------
 *  - No cookies and no client storage: we never read or write `document.cookie`,
 *    `localStorage`, or `sessionStorage`.
 *  - No fingerprinting: the payload is `{ path }` alone. We never send the
 *    user-agent, screen size, timezone, languages, plugins, canvas, or any other
 *    device/browser signal.
 *  - No third-party requests: an endpoint is rejected at runtime unless it
 *    resolves to the *current origin*, so a viewed path never leaves our domain.
 *  - Respects Do Not Track and Global Privacy Control: when either is set the
 *    beacon is not sent at all.
 *  - Off by default: with no `NEXT_PUBLIC_ANALYTICS_ENDPOINT` at build time the
 *    component is a total no-op and the site makes no analytics requests.
 *
 * The receiving endpoint (e.g. `/api/hit`) is owned by the Worker, not by this
 * module. Until such a route exists, leave `NEXT_PUBLIC_ANALYTICS_ENDPOINT`
 * unset and the whole feature stays dormant.
 */

/**
 * First-party endpoint to receive page views. Inlined at build time by Next
 * (same mechanism as `NEXT_PUBLIC_SITE_URL` in `lib/site.ts`). Empty means
 * analytics is disabled.
 */
export const ANALYTICS_ENDPOINT: string = (
  process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT ?? ""
).trim();

/** True only when a first-party endpoint was configured at build time. */
export const analyticsEnabled: boolean = ANALYTICS_ENDPOINT.length > 0;

export type PageviewPayload = {
  /** Root-relative path of the viewed page, e.g. "/manifesto". */
  path: string;
};

type PrivacyNavigator = Navigator & {
  msDoNotTrack?: string;
  globalPrivacyControl?: boolean;
};

type PrivacyWindow = Window & {
  doNotTrack?: string | null;
};

/**
 * Whether the visitor has asked not to be measured. Covers the DNT header
 * (standard plus the legacy Microsoft property) and Global Privacy Control.
 * Returns `true` in any non-browser context so nothing is ever sent server-side.
 */
export function userOptedOut(): boolean {
  if (typeof navigator === "undefined") return true;

  const nav = navigator as PrivacyNavigator;
  const win = typeof window === "undefined" ? undefined : (window as PrivacyWindow);

  if (nav.doNotTrack === "1" || nav.msDoNotTrack === "1") return true;
  if (win && win.doNotTrack === "1") return true;
  if (nav.globalPrivacyControl === true) return true;

  return false;
}

/**
 * Resolve a configured endpoint to an absolute URL only when it points at the
 * current origin. This is the single guard that enforces "no third-party
 * requests" — a cross-origin value is silently dropped.
 */
export function sameOriginEndpoint(endpoint: string): string | null {
  if (!endpoint || typeof window === "undefined") return null;
  try {
    const url = new URL(endpoint, window.location.href);
    return url.origin === window.location.origin ? url.toString() : null;
  } catch {
    return null;
  }
}

/**
 * Fire-and-forget page-view beacon. Prefers `sendBeacon` (survives page unload,
 * never blocks navigation) and falls back to `fetch(..., { keepalive: true })`.
 * `credentials: "omit"` guarantees no cookies ride along.
 */
export function sendPageview(endpoint: string, payload: PageviewPayload): void {
  if (typeof navigator === "undefined") return;

  const body = JSON.stringify(payload);

  try {
    if (typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon(endpoint, blob)) return;
    }
  } catch {
    // Fall through to fetch.
  }

  try {
    void fetch(endpoint, {
      method: "POST",
      body,
      headers: { "content-type": "application/json" },
      keepalive: true,
      credentials: "omit",
      mode: "same-origin",
      cache: "no-store",
    }).catch(() => {
      // Analytics must never surface errors to the visitor.
    });
  } catch {
    // Ignore — analytics is best-effort by design.
  }
}
