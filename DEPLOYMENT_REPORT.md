# Deployment Report — Build For Good

A truthful record of the current deployment configuration and what was observed
live. Metrics that could not be independently reproduced have been removed
rather than guessed.

## Canonical URLs

| | URL |
| --- | --- |
| Canonical site (apex) | **https://buildforgood.world** |
| `www` | https://www.buildforgood.world (also serves the site) |
| Direct Worker URL (backup) | https://buildforgood.shadownik.workers.dev |

## Configuration (`wrangler.toml`)

- **Worker name:** `buildforgood`
- **Entry point:** `worker/index.js`
- **Compatibility date:** `2026-10-01`
- **Account id:** `2eff373f1fc9834a686bfb5982b151b2`
- **Custom domains:** `buildforgood.world`, `www.buildforgood.world`
  (Cloudflare manages DNS + certificates); `workers_dev = true`
- **Assets:** static export directory `./out`, binding `ASSETS`,
  `not_found_handling = "404-page"`, `run_worker_first = ["/api/*", "/projects/*"]`
- **D1:** binding `DB`, database `buildforgood-prod`
- **Output:** `out/` — Next.js static export (`output: 'export'` in
  `next.config.mjs`)

The Worker serves the static export via the `ASSETS` binding, handles the
`/api/*` JSON API, and server-renders `/projects/:slug` pages from D1.

## Deploy sequence

```bash
npm run build            # Next.js static export → out/
npx wrangler deploy      # upload assets + worker/index.js (== npm run deploy)
```

CI (`.github/workflows/deploy.yml`) runs the same two steps on a push to `main`
(`npm ci` → `npm run build` → `npx wrangler deploy`) and then checks
`/api/health`.

## Live verification

Observed on 2026-10-16 against the canonical origin, using plain `curl` (no
build or deploy was run to produce this report):

| Endpoint | Observed |
| --- | --- |
| `/`, `/manifesto`, `/values`, `/membership`, `/problems`, `/projects`, `/activities`, `/about`, `/founders`, `/contact` | 200 |
| `/admin` | 200 (the page shell; the admin API is Access-gated) |
| `/projects/<slug>` | 200 (Worker-rendered from D1, e.g. `/projects/aquatrack-water-quality-kit`) |
| `/api/health` | 200 → `{"ok":true,"service":"buildforgood","db":"ok"}` |
| `/api/stats` | 200 → `{"ok":true,"applications":0,"problems":6,"projects":6,"public_problems":6}` |
| `/api/problems` | 200 → 6 public problems (`total: 6`) |
| `/api/problems/6` | 200 (numeric-id fallback for a slugless seeded row) |
| `/api/projects` | 200 → 6 approved projects (`total: 6`) |
| `/api/projects/<slug>` | 200 |
| `/api/admin/me` (no Access JWT) | 401 (expected — fails closed) |
| `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest`, `/og.png` | 200 |

Apex, `www`, and the direct Worker URL all returned 200, and `/api/health`
returned 200 (with `"db":"ok"`) on both the canonical origin and the backup
Worker URL.

### Security headers observed

The live responses carry the headers the repository ships:

- **Static HTML** uses the [`public/_headers`](public/_headers) policy:
  `Content-Security-Policy: default-src 'self'; script-src 'self'
  'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self'
  https://fonts.gstatic.com data:; img-src 'self' data: https:;
  media-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self';
  form-action 'self'; frame-ancestors 'none'`, plus
  `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`,
  `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, and
  `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
- **`/api/*` responses** use the stricter [`worker/index.js`](worker/index.js)
  policy: `default-src 'self'; script-src 'self'; object-src 'none';
  frame-ancestors 'none';` (no `'unsafe-inline'`), with the same
  `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and
  `Permissions-Policy` headers.

The backup Worker URL returns the same API headers.

## Caveats (observed, not assumed)

- The live deployment matches the repository as of the observation above:
  `/api/health` includes the `db` field, `/api/stats` responds with counts,
  `GET /api/problems` and `GET /api/projects` return the seeded rows, and the
  security headers are present.
- An earlier revision of this report (observed 2026-10-15) recorded a lagging
  deployment — `/api/health` without `db`, `/api/stats` → 404, `GET
  /api/problems` → 405, and no security headers. Those findings no longer
  apply; this report is limited to what `curl` returned on the date above.
- `GET /api/problems/<project-slug>` and `GET /api/projects/<problem-slug>`
  correctly return 404 — problem and project handles are separate namespaces.

## Notes

- Build/deploy timings, asset counts, and Worker version IDs are intentionally
  omitted: they could not be reproduced here, and hard rules forbid inventing
  metrics. Capture them from the CI run or `wrangler deploy` output if needed.
- The D1 database name is `buildforgood-prod` (the earlier `buildforgood-forms`
  name, and the account id previously quoted in this file, were stale).
