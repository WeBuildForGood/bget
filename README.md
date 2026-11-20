# Build For Good — Build. Grow. Evolve. Together.

The public website for **Build For Good**, a global, multidisciplinary community
for turning meaningful problems into collective action.

> Bring us a problem. We'll bring together the people who can help.

| | |
| --- | --- |
| **Canonical site** | **https://buildforgood.world** (apex; `www.buildforgood.world` redirects to apex) |
| **Staging site** | **https://staging.buildforgood.world** (Cloudflare Access restricted) |
| **Worker origin** | `workers_dev = false`, `preview_urls = false` (enforces custom domains & Access policies) |
| **Hosting** | Cloudflare Workers (`buildforgood` / `buildforgood-staging`) + D1 |
| **Admin** | `/admin` and `/api/admin/*`, protected by Cloudflare Access |
| **Documentation** | [`docs/`](docs/) — Full BGET operating system (manifesto, governance, Problem Commons) |

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
| `/privacy` | Privacy policy (local-first, no tracking) |
| `/terms` | Community terms and contribution standards |
| `/accessibility` | Accessibility statement and conformance targets |
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
  ├── 0004_rate_limits_and_slugs.sql# problems.slug, rate_limits
  ├── 0005-subscribers.sql          # subscribers table
  └── 0006-mail-sends.sql           # mail_sends log table
docs/                               # BGET community operating system (manifesto, governance, etc.)
tools/                              # Outreach & invitation utilities
seed/
  ├── README.md                     # What the seed contains and why
  ├── problems.sql                  # 6 Problem Commons rows (INSERT OR IGNORE)
  └── projects.sql                  # 6 Labs rows (INSERT OR IGNORE)
scripts/
  └── seed.mjs                      # Safe D1 seed runner (local by default)
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
| `GET` | `/api/metrics` | Public honest metrics summary | — |
| `GET` | `/api/subscribers/count` | Active newsletter subscriber count | — |
| `POST` | `/api/subscribe` | Join email newsletter (deduped, generic 202) | `subscribers` |
| `POST` | `/api/unsubscribe` | Unsubscribe email address (generic 202) | `subscribers` |
| `GET` | `/api/subscribers` | Active subscribers list (Cloudflare Access protected) | `subscribers` |
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
| `npm test` | `node --test tests/` | Unit tests for `worker/lib/*` (rate limit, slug, validation, mailing) |
| `npm run lint` | `npm run typecheck` | Full project type-check |
| `npm run typecheck` | `tsc --noEmit && tsc -p tsconfig.worker.json` | Type-check Next.js frontend + Cloudflare Worker edge code |
| `npm run typecheck:worker` | `tsc -p tsconfig.worker.json` | Type-check Cloudflare Worker edge code only |
| `npm start` | `next start` | Not used for this static-export Worker deployment |

> **Note:** `npm run typecheck` validates both Next.js TypeScript files and Worker JavaScript files. `npm test` runs the zero-dependency unit suite under `tests/` with the Node built-in test runner (`node --test tests/`); it covers the pure helpers in `worker/lib/*.js` (rate limiting, slug generation, input validation, mailing payloads).

---

## 7. Deployment & Environments

The deploy sequence is always:

```bash
NEXT_PUBLIC_SITE_URL="https://buildforgood.world" npm run build   # produce out/ (static export)
npx wrangler deploy                                               # upload assets + worker/index.js
```

For staging:
```bash
NEXT_PUBLIC_SITE_URL="https://staging.buildforgood.world" npm run build
npx wrangler deploy --env staging                                 # deploys to staging.buildforgood.world
```

`wrangler.toml` enforces `workers_dev = false` and `preview_urls = false` to ensure traffic always enters via authorized custom domains with Cloudflare Access protection.

### CI/CD Architecture (`.github/workflows/`)

- **`ci.yml`** — Canonical pull-request and push gate: `npm ci` → `npm test` → `npm run typecheck` → `npm run build`. Emits the required **`test`** status check expected by branch protection.
- **`deploy.yml`** — Deployment pipeline: builds `out/` once in the `build` job, uploads it as an artifact, and downloads it in deployment jobs:
  - `deploy-production` (pushes to `main`): deploys `npx wrangler deploy` to `buildforgood.world`.
  - `deploy-staging` (pushes to `staging`): deploys `npx wrangler deploy --env staging` to `staging.buildforgood.world` with dedicated `buildforgood-staging` D1 database.
- **`deploy-preview.yml`** — Automated ephemeral previews on pull requests using `buildforgood-staging`.
- **`security.yml`** — Nightly automated vulnerability scan running `npm audit` and checking for outdated dependencies.

Required GitHub secret: **`CF_API_TOKEN`** (Cloudflare API token with Workers Scripts and D1 edit permissions).

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

## 10. Community documentation (`docs/`)

The full Build For Good canon and operating system is unified inside this repository under [`docs/`](docs/):

| Document | Purpose / Scope |
| --- | --- |
| [`docs/MANIFESTO.md`](docs/MANIFESTO.md) | The core manifesto, the 12 dimensions of capability, and the founding ethos |
| [`docs/VALUES.md`](docs/VALUES.md) | Cultural principles, rewarded vs. corrected behaviours |
| [`docs/PROBLEM-COMMONS.md`](docs/PROBLEM-COMMONS.md) | The Problem Commons loop, submission criteria, and problem lifecycle |
| [`docs/MEMBERSHIP.md`](docs/MEMBERSHIP.md) | Member criteria, the high-bar filter, selection and onboarding |
| [`docs/ACTIVITIES.md`](docs/ACTIVITIES.md) | The 5 recurring community rituals (Showcase, Jam, Commons Review, etc.) |
| [`docs/GOVERNANCE.md`](docs/GOVERNANCE.md) | Stewardship council, decision frameworks, and code of conduct |
| [`docs/GROWTH.md`](docs/GROWTH.md) | Sustainable member growth, distribution channels, and cohort scaling |
| [`docs/PEOPLE.md`](docs/PEOPLE.md) | People roster, advisory board, core stewards, and contributor roles |
| [`docs/PLAN-90-DAYS.md`](docs/PLAN-90-DAYS.md) | The 90-day operational roadmap and milestone milestones |
| [`docs/RECRUITING.md`](docs/RECRUITING.md) | Outreach strategy for top-tier builders, researchers, and civic leaders |
| [`docs/SUSTAINABILITY.md`](docs/SUSTAINABILITY.md) | Financial stewardship, grants, sponsorships, and resource independence |
| [`docs/BRANDING.md`](docs/BRANDING.md) | Brand identity, typography, visual voice, and design language |
| [`docs/DISCORD.md`](docs/DISCORD.md) | Community Discord channel architecture, roles, and moderation rules |
| [`docs/OUTREACH_TRACKER.md`](docs/OUTREACH_TRACKER.md) | Direct outreach log and tracking for civic tech founders and researchers |
| [`docs/templates/`](docs/templates/) | Application, roster, event kit, and welcome message templates |
| [`docs/templates/outreach/`](docs/templates/outreach/) | Personalized outreach message templates (civic tech leaders, OSS founders) |

Outreach scripts and automation tools live in [`tools/`](tools/).

---

## 11. License

MIT — see [LICENSE](LICENSE). See also [CONTRIBUTING.md](CONTRIBUTING.md),
[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md), and [SECURITY.md](SECURITY.md).
