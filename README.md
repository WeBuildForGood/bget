# Build For Good — Build. Grow. Evolve. Together.

The public website for **Build For Good**, a global, multidisciplinary community
for turning meaningful problems into collective action.

> Bring us a problem. We'll bring together the people who can help.

| | |
| --- | --- |
| **Canonical site** | **https://buildforgood.world** (apex; `www.buildforgood.world` also serves it) |
| **Direct Worker URL (backup)** | https://buildforgood.shadownik.workers.dev |
| **Hosting** | Cloudflare Workers (`buildforgood`) + D1 |
| **Admin** | `/admin` and `/api/admin/*`, protected by Cloudflare Access |

Build For Good is a community where people submit real problems and build
**Labs** to solve them. Anyone can contribute a problem to the **Problem
Commons**; membership is **by application**. The site is the public expression
of that community: the manifesto, values, the Problem Commons, the Labs
(projects) showcase, and the ways to take part.

---

## 1. Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router), **static export** (`output: 'export'`) |
| Language | TypeScript |
| UI | React 19, Tailwind v4 + design tokens (`app/globals.css`), lucide-react |
| Hosting | Cloudflare Workers static assets (`wrangler.toml` → `[assets]`) |
| API | `worker/index.js` — JSON API for public forms + the Cloudflare Access admin API |
| Database | Cloudflare D1 (`buildforgood-prod`, binding `DB`), schema in `migrations/` |

The Next app is fully static. All server logic lives in the Worker, which serves
the export through the `ASSETS` binding and handles `/api/*`. Cloudflare
`run_worker_first` sends `/api/*` and `/projects/*` to the Worker; everything
else is served from the static export.

- Cloudflare account id: `2eff373f1fc9834a686bfb5982b151b2`
- D1 database: `buildforgood-prod` (binding `DB`)

---

## 2. Pages

| Route | What it is |
| --- | --- |
| `/` | Landing page (hero, what we do, how it works, disciplines, standard, three doors) |
| `/manifesto` | The manifesto and the twelve dimensions |
| `/values` | Values expressed as behaviours we reward vs. correct |
| `/membership` | Filter, process, and the **application form** |
| `/problems` | Problem Commons loop/criteria and the **problem-submission form** |
| `/projects` | Labs / projects showcase (member-submitted; approved projects are public) |
| `/projects/:slug` | Project detail (static page when one exists, otherwise Worker-rendered from D1) |
| `/activities` | The five recurring rituals |
| `/founders` | About the founders |
| `/about` | What Build For Good is, the founder, and how we present people |
| `/contact` | Contact, suggestions and feedback forms |
| `/admin` | Admin review panel (gated via Cloudflare Access) |

---

## 3. Project structure

```text
app/
  ├── layout.tsx                    # Fonts + metadata + JSON-LD
  ├── page.tsx                      # Landing page
  ├── manifesto|values|membership|problems|activities|about|founders|projects|contact|admin/
  │   └── page.tsx
  ├── sitemap.ts                    # /sitemap.xml  (Next metadata route)
  ├── robots.ts                     # /robots.txt   (Next metadata route)
  ├── manifest.ts                   # /manifest.webmanifest (Next metadata route)
  ├── error.tsx / not-found.tsx
  └── globals.css
components/
  ├── landing/                      # Landing sections (design language + motion)
  ├── site/                         # Shared page shell, forms, UI helpers
  ├── motion/                       # Reveal/Counter/ScrollProgress primitives
  ├── projects/                     # Projects UI (list/card/form)
  ├── admin/                        # Admin UI
  ├── seo/                          # JSON-LD helpers
  └── ui/                           # shadcn-style primitives
worker/
  ├── index.js                      # Worker entry (security headers, error handling)
  ├── router.js                     # Route dispatch
  ├── access.js                     # Cloudflare Access JWT verification (fails closed)
  ├── routes/
  │   ├── public.js                 # Public JSON API
  │   ├── admin.js                  # Admin JSON API (Access-protected)
  │   └── projects-ssr.js           # Worker-rendered /projects/:slug pages
  └── lib/                          # json, validate, html, format, slug, ratelimit, notify, assets
lib/
  └── site.ts                       # Canonical site config (name, URL, metadata)
migrations/
  ├── 0001_init.sql                 # applications, problems
  ├── 0002_projects.sql             # projects
  ├── 0003_inbox.sql                # contact_messages, suggestions, feedback
  └── 0004_rate_limits_and_slugs.sql# problems.slug, rate_limits
seed/
  ├── README.md                     # What the seed contains and why
  ├── problems.sql                  # 6 Problem Commons rows
  └── projects.sql                  # 6 Labs rows
scripts/
  └── seed.mjs                      # Idempotent D1 seed runner
tests/
  ├── ratelimit.test.mjs            # node --test unit tests for worker/lib/*
  ├── slug.test.mjs                 # (ratelimit, slug, validate)
  └── validate.test.mjs
public/
  ├── _headers                      # Cloudflare static-asset security/cache headers
  ├── icon.svg, apple-icon*.png
  ├── og.png                        # Social/OG image (referenced from lib/site.ts)
  └── llms.txt, llms-full.txt
wrangler.toml                        # Worker name, custom domain, assets, D1 binding
```

`lib/site.ts` is the single source of truth for the site name and canonical URL.
Every canonical tag, sitemap entry, robots directive, and JSON-LD `@id` derives
from it; override with `NEXT_PUBLIC_SITE_URL` for staging/preview builds.

---

## 4. API

All API routes live in the Worker. JSON responses; POST bodies are validated,
length-capped, and written to D1 with bound parameters only. A hidden honeypot
field (`company`, or legacy `website`) makes bots get a fake success. Every POST
passes through a per-IP sliding-window rate limiter before touching D1, and
every successful write fans out to best-effort notifications.

Common POST responses: `200 { ok: true, id }` · `422 { ok: false, error: "invalid" | "link_flood", fields }` · `409 { ok: false, error: "duplicate" }` · `405` for wrong method · `429` when rate-limited.

### Public

| Method | Route | Purpose | Stores in |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Liveness + a trivial D1 probe | — |
| `GET` | `/api/stats` | Real row counts | — |
| `GET` | `/api/problems` | Public Problem Commons (`?limit=` ≤100, `?offset=`), newest first | `problems` |
| `GET` | `/api/problems/:slug` | One public problem (numeric-id fallback) | `problems` |
| `POST` | `/api/problems` | Submit a problem (`visibility`, `title`, `description`, …) | `problems` |
| `POST` | `/api/apply` | Membership application (`name`, `email`, `building`, …) | `applications` |
| `POST` | `/api/contact` | Contact message (`name`, `email`, `subject`, `message`) | `contact_messages` |
| `POST` | `/api/suggestions` | Suggestion (`topic`, `body`, `name?`, `email?`) | `suggestions` |
| `POST` | `/api/feedback` | Feedback (`kind`, `body`, `page?`, `email?`, `rating?` 1–5) | `feedback` |
| `GET` | `/api/projects` | Approved projects (`?limit=` ≤200, `?offset=`), featured first | `projects` |
| `GET` | `/api/projects/:slug` | One approved project | `projects` |
| `POST` | `/api/projects` | Submit a project (created with `status = 'pending'`) | `projects` |

Only problems with `visibility = 'public'` and `status IN ('framed','active')`
appear in `GET /api/problems`; only projects with `status = 'approved'` appear
in `GET /api/projects`.

### Admin (Cloudflare Access)

Every admin route requires a valid `Cf-Access-Jwt-Assertion`; when Access is not
configured the Worker **fails closed** and returns `401`.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/admin/me` | Authenticated email |
| `GET` | `/api/admin/summary` | Counts per collection and per status |
| `GET` | `/api/admin/export?table=<collection>` | CSV download (max 5000 rows) |
| `GET` | `/api/admin/:collection?status=&q=&limit=&offset=` | List rows (limit ≤ 500) |
| `PATCH` | `/api/admin/:collection/:id` | Update `{ status?, notes? }` |
| `PATCH` | `/api/admin/:collection/status` | Bulk update `{ ids: [...], status }` (≤ 500 ids) |
| `DELETE` | `/api/admin/:collection/:id` | Delete a row (hard delete) |

`:collection` is one of `applications`, `problems`, `projects`,
`contact_messages`, `suggestions`, `feedback`. Table and column identifiers come
from an allowlist — never from user input — and all values are bound parameters.

---

## 5. Data & migrations (D1)

D1 database: **`buildforgood-prod`** (binding `DB`). Schema:

- [`0001_init.sql`](migrations/0001_init.sql) — `applications`, `problems`
- [`0002_projects.sql`](migrations/0002_projects.sql) — `projects` (slug, status, featured)
- [`0003_inbox.sql`](migrations/0003_inbox.sql) — `contact_messages`, `suggestions`, `feedback`
- [`0004_rate_limits_and_slugs.sql`](migrations/0004_rate_limits_and_slugs.sql) — `problems.slug` + `rate_limits`

Apply schema (remote):

```bash
export CLOUDFLARE_ACCOUNT_ID=2eff373f1fc9834a686bfb5982b151b2

npx wrangler d1 execute buildforgood-prod --remote --file=migrations/0001_init.sql
npx wrangler d1 execute buildforgood-prod --remote --file=migrations/0002_projects.sql
npx wrangler d1 execute buildforgood-prod --remote --file=migrations/0003_inbox.sql
npx wrangler d1 execute buildforgood-prod --remote --file=migrations/0004_rate_limits_and_slugs.sql
```

For local miniflare D1, swap `--remote` for `--local`.

### Seed data

Two idempotent SQL files give the site credible starting content (6 Problem
Commons rows, 6 Labs). See [`seed/README.md`](seed/README.md) for exactly what
is in them and why.

```bash
# Remote buildforgood-prod (the live database):
node scripts/seed.mjs --yes

# Local miniflare only (never touches production):
node scripts/seed.mjs --yes --local
```

`scripts/seed.mjs` prints row counts before and after, and refuses to run
without `--yes`. Applying the SQL directly with `wrangler d1 execute` is equally
valid (see `seed/README.md`).

---

## 6. Local development

Requires Node ≥ 20 and a Cloudflare login (`npx wrangler login`).

```bash
npm ci
npm run build          # static export → out/   (required before preview)
npm run preview        # wrangler dev — serves out/ + /api/* with local D1
# → http://127.0.0.1:8787
```

`npm run dev` (Next dev server) renders the pages but has **no** `/api/*` (those
live in the Worker). Use `npm run preview` to exercise the forms end-to-end.

`npm run build` is required before `npm run preview` because the Worker serves
the static export from `out/`.

Other scripts (see `package.json`):

| Script | Command | Notes |
| --- | --- | --- |
| `npm run dev` | `next dev` | Frontend only — no API |
| `npm run build` | `next build` | Static export → `out/` |
| `npm run preview` | `wrangler dev` | Full site + API, local D1 |
| `npm run deploy` | `wrangler deploy` | Deploy the built Worker (run `build` first) |
| `npm test` | `node --test tests/` | Unit tests for `worker/lib/*` (rate limit, slug, validation) |
| `npm run lint` | `tsc --noEmit` | Type-check (alias of `typecheck`) |
| `npm run typecheck` | `tsc --noEmit` | Type-check |
| `npm start` | `next start` | Not used for this static-export Worker deployment |

> **Note:** `npm run lint` and `npm run typecheck` both run `tsc --noEmit`
> (there is no ESLint setup in this repo). `npm test` runs the zero-dependency
> unit suite under `tests/` with the Node built-in test runner
> (`node --test tests/`); it covers the pure helpers in `worker/lib/*.js`
> (rate limiting, slug generation, input validation). There is no browser/E2E
> suite.

---

## 7. Deployment

The deploy sequence is always:

```bash
npm run build            # produce out/ (static export)
npx wrangler deploy      # upload assets + worker/index.js  (== npm run deploy)
```

`wrangler.toml` sets the custom domains `buildforgood.world` and
`www.buildforgood.world` (Cloudflare creates the DNS records and certificates
automatically) and keeps `workers_dev = true`, so the Worker also answers at
`https://buildforgood.shadownik.workers.dev` (the backup/direct URL).

Manual deploy:

```bash
export CLOUDFLARE_ACCOUNT_ID=2eff373f1fc9834a686bfb5982b151b2
npm run build
npx wrangler deploy
```

### CI (`.github/workflows/`)

- **`quality.yml`** — the fast gate on PRs and `main`: `npm ci`,
  `npm run typecheck`, `npm test`.
- **`ci.yml`** — job literally named **`test`**: `npm ci` + `npm run build`
  (the static-export build gate). Branch protection on `main` requires this
  exact check name.
- **`test.yml`** — `npm ci`, `npm test`, `npm run typecheck`, `npm run build`,
  `npm audit --audit-level=moderate`, an `npm outdated` report, a Trivy
  filesystem scan, and a static-export smoke test (`out/index.html`,
  `out/404.html`).
- **`deploy.yml`** — on a push to `main`: `npm ci` → `npm run typecheck` →
  `npm test` → `npm audit` → `npm run build` → `npx wrangler deploy`, then a
  post-deploy `/api/health` check and a production smoke test. It also has
  `--env staging` and `--env preview` deploy jobs, gated on the `staging` branch
  and on PRs labelled `preview`. `wrangler.toml` currently defines only the
  production Worker — there are no `[env.staging]` / `[env.preview]` blocks, so
  those deploys depend on additional environment configuration.
- **`deploy-preview.yml`** — on PRs to `main`/`staging`: build and
  `npx wrangler deploy --env preview`, then comment the preview URL on the PR.

Required GitHub secret: **`CF_API_TOKEN`** (Workers Scripts + D1 edit).

### Rollback

1. Identify the last good commit.
2. `git checkout <good-commit>`
3. `npm run build && npx wrangler deploy`
4. Verify: `curl -f https://buildforgood.world/api/health`

---

## 8. Cloudflare Access (admin)

`/admin` and `/api/admin/*` are protected by Cloudflare Access (Zero Trust).
Access injects a signed JWT as `Cf-Access-Jwt-Assertion`; the Worker verifies it
locally against the team JWKS (`worker/access.js`) and enforces the application
audience. The authenticated email is available from the verified JWT.

Setup:

1. Create an **Access application** covering the site's admin paths
   (`/admin/*`, `/api/admin/*`) — or the whole hostname, as appropriate.
2. Create an **Access policy** allowing only approved admin emails/domains.
3. Note the **team domain** (`<team>.cloudflareaccess.com`) and the
   application's **Audience (AUD)**, and set them as Worker secrets:
   `wrangler secret put ACCESS_TEAM_DOMAIN` and `wrangler secret put ACCESS_AUD`.

Without those secrets the Worker treats Access as unconfigured and returns
`401` for every admin request. This is the intended, safe default.

---

## 9. SEO

- Canonical origin: **https://buildforgood.world** (defined once in
  `lib/site.ts`; override with `NEXT_PUBLIC_SITE_URL` for other environments).
- Global JSON-LD: Organization + WebSite in `app/layout.tsx`.
- Per-page metadata and canonicals via `pageMetadata()` in `lib/site.ts`.
- `app/sitemap.ts`, `app/robots.ts`, and `app/manifest.ts` produce
  `/sitemap.xml`, `/robots.txt`, and `/manifest.webmanifest` at build time.
- Social/OG image: static `public/og.png`.
- Worker-rendered project pages include `og:title`, `og:description`, and
  `application/ld+json` for stronger SEO, and escape all user content.

---

## 10. Community docs

The full Build For Good canon (manifesto, values, membership, problem commons,
activities, governance, branding) lives outside this repo. This site is the
public-facing expression of it.

---

## 11. License

MIT — see [LICENSE](LICENSE). See also [CONTRIBUTING.md](CONTRIBUTING.md),
[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md), and [SECURITY.md](SECURITY.md).
