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
   * @param {{DB: D1Database, ASSETS: Fetcher, ACCESS_TEAM_DOMAIN?: string, ACCESS_AUD?: string}} env
   * @param {ExecutionContext} ctx
   * @returns {Promise<Response>}
   */
  async fetch(request, env, ctx) {
    try {
      const response = await handleRequest(request, env, ctx);

      // Add security headers to all responses.
      // We add these at the Worker entry point so every code path (API, SSR,
      // static assets, error responses) gets them uniformly.
      const url = new URL(request.url);
      const isApi = url.pathname.startsWith("/api/");
      const isHtml = response.headers.get("content-type")?.includes("text/html") ?? false;

      // X-Frame-Options: DENY prevents clickjacking on all responses.
      // X-Content-Type-Options: nosniff prevents MIME sniffing attacks.
      // These are safe for every response type.
      response.headers.set("X-Frame-Options", "DENY");
      response.headers.set("X-Content-Type-Options", "nosniff");

      // Content-Security-Policy differs for API vs HTML to avoid breaking
      // SSR pages that load Google Fonts. API gets strict CSP; HTML allows
      // fonts.googleapis.com / fonts.gstatic.com for the Instrument Serif font.
      if (isApi) {
        response.headers.set("Content-Security-Policy", "default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none';");
      } else if (isHtml) {
        response.headers.set("Content-Security-Policy",
          "default-src 'self'; " +
          "style-src 'self' https://fonts.googleapis.com; " +
          "font-src 'self' https://fonts.gstatic.com; " +
          "script-src 'self'; " +
          "object-src 'none'; " +
          "frame-ancestors 'none'; " +
          "connect-src 'self'; " +
          "img-src 'self' data: https:;"
        );
      }

      response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
      response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

      return response;
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
