# Security Policy

## Reporting a vulnerability

If you find a security issue in this repository or the deployed site, please
report it privately — **do not open a public GitHub issue.**

Email **hello@buildforgood.world** with:

- What you found and where (file, page, API route, or URL)
- Steps to reproduce
- What the impact is (what an attacker could do)
- Any proof-of-concept or suggested fix, if you have one

You should get an acknowledgement within a few days and an update on the status
of the report within 14 days. Please allow reasonable time for a fix before any
public disclosure.

## Scope

The site is a **static Next.js export** served by a **Cloudflare Worker** that
also exposes a JSON API and an Access-protected admin API, backed by **Cloudflare
D1**. It is reachable at the canonical origin **https://buildforgood.world**
(`www.buildforgood.world` also serves it); the direct Worker hostname
**https://buildforgood.shadownik.workers.dev** is a backup/alternative route to
the same deployment.

In scope:

- The Worker API (`worker/`) — input validation, SQL handling, rate limiting,
  honeypot, CORS, and error handling in the public and admin routes
- Authentication/authorization of the admin area (`/admin`, `/api/admin/*`) —
  e.g. a way to reach admin data without a valid Cloudflare Access JWT
- Data exposure from D1 (e.g. private problem fields, submitter emails, or
  `notes` leaking through a public endpoint)
- Leaked credentials or secrets committed to this repository
- Misconfigurations in the GitHub Actions workflows under `.github/workflows/`
- The static site's own HTML/CSS/JS (e.g. cross-site scripting via
  user-controllable content)

Out of scope:

- Denial-of-service or availability attacks against Cloudflare, Workers, or D1
- Vulnerabilities in third-party services and infrastructure we rely on
  (Cloudflare's platform, GitHub) — report those upstream
- Social engineering, physical attacks, or issues requiring non-standard
  scenarios

## Security posture

Security headers are applied in two places, because the static export and the
Worker are separate code paths:

**Static assets** — [`public/_headers`](public/_headers) is copied to `out/` at
build time and applied by Cloudflare to every static response:

- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- A `Content-Security-Policy` that (necessarily) includes
  `script-src 'unsafe-inline'` and `style-src 'unsafe-inline'`. A fully static
  export emits React/Next hydration as inline `<script>` tags and relies on
  inline `style` attributes, so hashes/nonces are not viable without moving off
  `output: 'export'`. The reasoning is documented inline in `public/_headers`.

**Worker responses** — [`worker/index.js`](worker/index.js) sets headers on
every response it produces (API and Worker-rendered project pages), including
`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`,
`Permissions-Policy`, and a `Content-Security-Policy` — strict (`script-src
'self'`) for `/api/*`, and one that additionally allows Google Fonts
(`fonts.googleapis.com` / `fonts.gstatic.com`) for the Worker-rendered HTML.

> **Verified live (2026-10-16):** these headers *are* present on the live
> deployment. `curl -I https://buildforgood.world/` returns the `public/_headers`
> policy shown above (including `script-src 'self' 'unsafe-inline'`) plus
> `Strict-Transport-Security`; `/api/*` responses carry the stricter
> `worker/index.js` policy (`script-src 'self'`), and the backup Worker host
> behaves the same. See `DEPLOYMENT_REPORT.md` for the exact observed header set.

Other controls in the code:

- **SQL:** all values are bound parameters; table/column identifiers come from
  allowlists, never user input (`worker/routes/admin.js`, `worker/routes/public.js`).
- **Admin auth:** `worker/access.js` verifies the Cloudflare Access JWT
  signature against the team JWKS and checks `aud`/`iss`/`exp`, and **fails
  closed** (401) when `ACCESS_TEAM_DOMAIN` or `ACCESS_AUD` are unset.
- **Abuse controls:** a hidden honeypot field on every public POST, a per-IP
  sliding-window rate limiter (`worker/lib/ratelimit.js` — stores only a salted
  SHA-256 of the IP), and link-flood detection.
- **Output:** JSON via `JSON.stringify`; Worker-rendered HTML escapes user
  content and validates outbound URLs.

## Secrets handling

- **This repository must never contain real secrets.** Anything committed here is
  world-readable, including in git history.
- Secrets live in exactly two places:
  - GitHub Actions encrypted secrets: `CF_API_TOKEN`
  - Cloudflare Worker secrets (`wrangler secret put`): `ACCESS_TEAM_DOMAIN`,
    `ACCESS_AUD`, and the optional `NOTIFY_WEBHOOK`, `RESEND_API_KEY`,
    `NOTIFY_EMAIL`, `NOTIFY_FROM`, `RATE_LIMIT_SALT`
- `wrangler.toml` contains **no secrets** — only the Worker name, account id,
  custom-domain routes, asset binding, and the D1 database name/id.
- Never commit `cloudflaretoken.env`, `cloudflareaccessshadownik.env`, or any
  `.env*` file with real values. They are ignored by `.gitignore`.
- Rotate any credential the moment it is committed, even if you delete the
  commit afterwards.

## CI security scanning

The CI workflows under `.github/workflows/` run:

- `npm ci` — reproducible install from `package-lock.json`
- `npm test` (`node --test tests/`) and `npm run typecheck` (`tsc --noEmit`) —
  unit tests and type-check
- `npm run build` — the static-export build gate
- `npm audit --audit-level=moderate` — fail on moderate or higher severity
- `npm outdated` — an informational dependency report
- Trivy filesystem scan — reports HIGH/CRITICAL findings
