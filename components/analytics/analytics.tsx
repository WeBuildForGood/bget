"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  ANALYTICS_ENDPOINT,
  analyticsEnabled,
  sameOriginEndpoint,
  sendPageview,
  userOptedOut,
} from "@/lib/analytics";

/**
 * Self-hosted, privacy-first page-view beacon — the replacement for
 * `@vercel/analytics`, which cannot work on a static export served by
 * Cloudflare Workers (see the note at the top of `lib/analytics.ts`).
 *
 * Behaviour:
 *  - Renders nothing, always. The server and the first client render both
 *    produce `null`, so hydration can never mismatch.
 *  - No-ops entirely unless `NEXT_PUBLIC_ANALYTICS_ENDPOINT` was set at build
 *    time AND that endpoint resolves to this origin AND the visitor has not set
 *    Do Not Track / Global Privacy Control.
 *  - Sends a single same-origin beacon per path per page session. No cookies,
 *    no fingerprint, no third-party requests. See `lib/analytics.ts` for the
 *    full privacy contract.
 *
 * Dependency note for the owner: `@vercel/analytics` is now unused. It is left
 * in `package.json` only because it is outside this change's scope — remove it
 * with `npm uninstall @vercel/analytics` when convenient.
 */

/** Paths already reported during this page session (guards StrictMode remounts). */
const reported = new Set<string>();

export function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!analyticsEnabled) return;
    if (userOptedOut()) return;

    const endpoint = sameOriginEndpoint(ANALYTICS_ENDPOINT);
    if (!endpoint) return;

    const path = pathname || "/";
    if (reported.has(path)) return;
    reported.add(path);

    sendPageview(endpoint, { path });
  }, [pathname]);

  return null;
}
