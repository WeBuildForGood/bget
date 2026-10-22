/**
 * Request router.
 *
 * `wrangler.toml` sets `run_worker_first` for `/api/*`, `/projects`, and
 * `/projects/*`, so the Worker only sees those paths in practice; everything
 * else (including `/projects` itself) is served from the static export via the
 * `ASSETS` binding.
 *
 * Layout:
 *   /api/admin/*   -> admin JSON API   (Cloudflare Access protected)
 *   /api/*         -> public JSON API  (health, stats, problems, projects, forms)
 *   /projects/*    -> static page, else D1-backed SSR page
 *   everything else-> static assets
 */

import { json, optionsResponse } from "./lib/json.js";
import { handlePublic } from "./routes/public.js";
import { handleAdmin } from "./routes/admin.js";
import { handleProjects } from "./routes/projects-ssr.js";
import { handleSitemap } from "./routes/sitemap.js";

/**
 * Dispatch a single request.
 *
 * @param {Request} request
 * @param {{DB: D1Database, ASSETS: Fetcher}} env
 * @param {ExecutionContext} ctx
 * @returns {Promise<Response>}
 */
export async function handleRequest(request, env, ctx) {
  const url = new URL(request.url);
  const { pathname } = url;
  const method = request.method;

  if (pathname === "/api" || pathname === "/api/") {
    return json({ ok: false, error: "not_found" }, 404);
  }

  if (pathname.startsWith("/api/")) {
    // CORS preflight is answered before routing so every route gets a 204 with
    // an appropriate `Allow` header.
    if (method === "OPTIONS") {
      return optionsResponse(allowForApiPath(pathname), request, url);
    }
    if (pathname.startsWith("/api/admin/") || pathname === "/api/admin") {
      return handleAdmin(request, env, ctx, url);
    }
    return handlePublic(request, env, ctx, url);
  }

  if (pathname === "/projects" || pathname.startsWith("/projects/")) {
    if (method === "OPTIONS") {
      return optionsResponse("GET, HEAD, OPTIONS", request, url);
    }
    return handleProjects(request, env, ctx, url);
  }

  // Dynamic sitemap: merges the built-in static routes with live project slugs
  // from D1, so new projects are discoverable without a redeploy.
  if (pathname === "/sitemap.xml") {
    if (method !== "GET" && method !== "HEAD") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: { allow: "GET, HEAD, OPTIONS" },
      });
    }
    return handleSitemap(env);
  }

  // Static export handles the rest.
  return env.ASSETS.fetch(request);
}

/**
 * The methods a given API path accepts, used for the `Allow` header on
 * preflight responses.
 *
 * @param {string} pathname
 * @returns {string}
 */
function allowForApiPath(pathname) {
  if (pathname.startsWith("/api/admin/")) return "GET, PATCH, DELETE, POST, OPTIONS";
  if (pathname === "/api/projects" || pathname === "/api/problems") {
    return "GET, POST, OPTIONS";
  }
  if (
    pathname.startsWith("/api/projects/") ||
    pathname.startsWith("/api/problems/")
  ) {
    return "GET, HEAD, OPTIONS";
  }
  if (
    pathname === "/api/health" ||
    pathname === "/api/stats" ||
    pathname === "/api/metrics"
  ) {
    return "GET, HEAD, OPTIONS";
  }
  if (pathname === "/api/apply") return "POST, OPTIONS";
  if (pathname === "/api/subscribe" || pathname === "/api/unsubscribe")
    return "POST, OPTIONS";
  if (
    pathname === "/api/contact" ||
    pathname === "/api/suggestions" ||
    pathname === "/api/feedback"
  ) {
    return "POST, OPTIONS";
  }
  return "GET, POST, OPTIONS";
}
