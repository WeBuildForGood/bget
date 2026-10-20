/**
 * BGET Worker — entry point.
 *
 * Serves the static Next.js export (via the `ASSETS` binding), the public JSON
 * API used by the site's forms, the Cloudflare Access protected admin API, and
 * server-rendered public project pages. Data lives in D1 (binding `DB`).
 *
 * Routing lives in ./router.js; the individual route groups live in ./routes/.
 */

import { handleRequest } from "./router.js";
import { json } from "./lib/json.js";

export default {
  /**
   * @param {Request} request
   * @param {{DB: D1Database, ASSETS: Fetcher, ACCESS_TEAM_DOMAIN?: string, ACCESS_AUD?: string, NOTIFY_WEBHOOK?: string, RESEND_API_KEY?: string, NOTIFY_EMAIL?: string, NOTIFY_FROM?: string, RATE_LIMIT_SALT?: string}} env
   * @param {ExecutionContext} ctx
   * @returns {Promise<Response>}
   */
  async fetch(request, env, ctx) {
    try {
      const response = await handleRequest(request, env, ctx);

      // Add security headers to all responses.
      // We add these at the Worker entry point so every code path (API, SSR,
      // static assets, error responses) gets them uniformly.
      //
      // IMPORTANT: responses returned from a binding (e.g. `env.ASSETS.fetch`)
      // have IMMUTABLE headers — calling `.set()` on them throws
      // `TypeError: Can't modify immutable headers`, which would turn every
      // "unknown project" or bare `/projects/` request into a 500. So we copy
      // the headers into a fresh `Headers` and rebuild the response instead of
      // mutating the original.
      const url = new URL(request.url);
      const isApi = url.pathname.startsWith("/api/");
      const contentType = response.headers.get("content-type") ?? "";
      const isHtml = contentType.includes("text/html");
      const headers = new Headers(response.headers);
      const setHeader = (name, value) => headers.set(name, value);

      // X-Frame-Options: DENY prevents clickjacking on all responses.
      // X-Content-Type-Options: nosniff prevents MIME sniffing attacks.
      // These are safe for every response type.
      setHeader("X-Frame-Options", "DENY");
      setHeader("X-Content-Type-Options", "nosniff");

      // Content-Security-Policy differs for API vs HTML.
      //
      // The API gets a strict CSP (no inline anything).
      //
      // Worker-rendered HTML (e.g. `/projects/<slug>` SSR pages) MUST allow
      // `'unsafe-inline'` for styles and scripts: those documents carry an
      // inline `<style>` block (mirroring the static export's dark aesthetic)
      // and an inline `<script type="application/ld+json">` block. Without
      // `'unsafe-inline'` the pages render completely unstyled and the
      // structured data is dropped. This mirrors `public/_headers`, the policy
      // used for the statically served pages. `https://fonts.googleapis.com`
      // is allowed because the SSR pages link the Inter stylesheet.
      if (isApi) {
        setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none';");
      } else if (isHtml) {
        setHeader("Content-Security-Policy",
          "default-src 'self'; " +
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
          "font-src 'self' https://fonts.gstatic.com data:; " +
          "script-src 'self' 'unsafe-inline'; " +
          "object-src 'none'; " +
          "frame-ancestors 'none'; " +
          "connect-src 'self'; " +
          "img-src 'self' data: https:;"
        );
      }

      setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
      setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

      // Rebuild the response with our headers. `response.body` is null for
      // bodiless statuses (204/304) and HEAD responses, which `new Response`
      // accepts with those statuses, so this is safe for every code path.
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (err) {
      console.error("worker: unhandled error", err);
      const url = new URL(request.url);
      if (url.pathname.startsWith("/api/")) {
        const errResp = json({ ok: false, error: "server_error" }, 500);
        errResp.headers.set("X-Frame-Options", "DENY");
        errResp.headers.set("X-Content-Type-Options", "nosniff");
        errResp.headers.set("Content-Security-Policy", "default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none';");
        return errResp;
      }
      return new Response("Internal Server Error", {
        status: 500,
        headers: { "content-type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff" },
      });
    }
  },
};
