# Security Policy

## Reporting a vulnerability

If you find a security issue in this repository, please report it privately —
**do not open a public GitHub issue.**

Send an email to **nikhilnagpure1111@gmail.com** with:

- What you found and where (file, page, URL)
- Steps to reproduce
- What the impact is (what an attacker could do)
- Any proof-of-concept or suggested fix, if you have one

You should get an acknowledgement within a few days and an update on the
status of the report within 14 days. Please allow reasonable time for a fix
before any public disclosure.

## Scope

This repository contains a **static website** (HTML, CSS, JavaScript) served
from Cloudflare Workers at <https://buildforgood.nikhilnagpure203.workers.dev>.

In scope:

- Vulnerabilities in the site's own HTML/CSS/JS (e.g. cross-site scripting
  via user-controllable reflected content, UI redress, unsafe handling of
  form data on the client)
- Leaked credentials or secrets committed to this repository
- Misconfigurations in the GitHub Actions workflows in `.github/workflows/`

Out of scope:

- Third-party CDNs and services the site loads (Tailwind CDN, Google Fonts,
  unpkg/lucide, formsubmit.co) — report those upstream
- Denial-of-service or availability attacks against Cloudflare Workers
- Social engineering, physical attacks, or issues requiring non-standard
  scenarios

## Secrets handling

- **This repository must never contain real secrets.** It is a public static
  site: anything committed here is world-readable, including in git history.
- The application form posts to FormSubmit; there is no API key or server
  component. Do not add credentials to the frontend — if a change seems to
  need one, it needs a different design.
- Rotate any credential the moment it is committed, even if you delete the
  commit afterwards.

## CI security scanning

The CI pipeline (`.github/workflows/test.yml` and `.github/workflows/deploy.yml`)
runs the following security gates on every push and pull request:

- `npm ci` — reproducible dependency install from `package-lock.json`
- `npm audit --audit-level=moderate` — fail on moderate or higher severity
- Dependency scan (`npm outdated`) — report outdated packages
- `tsc --noEmit` — type-check before build
- `eslint` — lint before build

## Secrets in `wrangler.toml`

- `wrangler.toml` contains **no secrets**. It holds only the worker name,
  account ID, D1 database name/ID, and asset binding configuration.
- All secrets (API tokens, D1 credentials) live in:
  - GitHub Actions encrypted secrets (`secrets.CF_API_TOKEN`)
  - Cloudflare Zero Trust Access secrets (`ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`)
- Never commit `cloudflaretoken.env` or any `.env` file with real values.
- Local development uses `wrangler login` (OAuth) — no token in source.