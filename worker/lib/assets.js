/**
 * Static-asset helpers.
 *
 * The site is a Next.js static export served through the `ASSETS` binding.
 * `wrangler.toml` configures `not_found_handling = "404-page"`, so a missing
 * asset already yields the exported `out/404.html` with a 404 status.
 * `notFoundPage()` explicitly fetches that page (guarded by a minimal inline
 * fallback) for code paths that need a guaranteed 404 document.
 */

const FALLBACK_404 = `<!doctype html><html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Not found — Build For Good</title></head>
<body style="margin:0;background:#07060a;color:#f4f2ee;font-family:system-ui,sans-serif">
<main style="max-width:640px;margin:0 auto;padding:96px 24px">
<p style="color:#eca8d6;text-transform:uppercase;letter-spacing:.18em;font-size:.7rem">404</p>
<h1 style="font-family:'Inter',system-ui,sans-serif;font-weight:600;font-size:2.6rem;margin:.2em 0">Nothing here.</h1>
<p><a href="/" style="color:#eca8d6;text-decoration:none">Back to Build For Good</a></p>
</main></body></html>`;

/**
 * Fetch the exported 404 page and return it with a 404 status.
 *
 * @param {{ASSETS: Fetcher}} env
 * @param {URL} url
 * @returns {Promise<Response>}
 */
export async function notFoundPage(env, url) {
  try {
    const target = new URL("/404.html", url.origin);
    const res = await env.ASSETS.fetch(
      new Request(target.toString(), { method: "GET" }),
    );
    if (res.status === 200 || res.status === 404) {
      return new Response(res.body, {
        status: 404,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  } catch {
    /* fall through to the inline fallback */
  }
  return new Response(FALLBACK_404, {
    status: 404,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
