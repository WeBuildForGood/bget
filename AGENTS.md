# AGENTS.md — guidance for AI agents

Build For Good is a Next.js 16 static export (`output: 'export'` → `out/`)
served by a Cloudflare Worker (`worker/index.js`) that also exposes a JSON API
and a Cloudflare Access-protected admin API, backed by Cloudflare D1
(`buildforgood-prod`). Canonical origin: **https://buildforgood.world** (backup:
https://buildforgood.shadownik.workers.dev). Read `README.md` for the full
architecture and API surface, and `SECURITY.md` for the security posture.

## Build & deploy sequence

Always build before deploying — the Worker serves the static export from `out/`:

```bash
npm ci
npm run build         # next build → out/ (static export)
npx wrangler deploy   # upload assets + worker/index.js  (== npm run deploy)
```

Do **not** run `npx wrangler deploy` or `npm run build` casually: deploying
publishes to the live site, and builds can be expensive. Never deploy from a
dirty or half-finished tree.

To verify your work **without** building or deploying:

```bash
npm test           # node --test tests/  — worker/lib/* unit tests
npm run typecheck  # tsc --noEmit
```

`npm run lint` is an alias of `npm run typecheck`; there is no ESLint here.

## Never commit secrets

- No real credentials in the repo — anything committed is world-readable,
  including git history.
- Ignored local files include `cloudflaretoken.env`,
  `cloudflareaccessshadownik.env`, and `.env*` (see `.gitignore`).
- Runtime secrets go in GitHub Actions secrets (`CF_API_TOKEN`) or Cloudflare
  Worker secrets (`wrangler secret put`), never in `wrangler.toml` or source.
- If you ever spot a committed secret, flag it and rotate it — deleting the
  commit is not enough.

## File-ownership discipline

When several agents (or people) work in this repo at once, **touch only the
files you own** and treat everything else as read-only. Before editing, check
whether a file is outside your scope and, if so, report the needed change
instead of making it. Keep changes consistent with the surrounding code, style,
and naming. Do not reformat or delete unfamiliar work without understanding it.

## Infrastructure register

Environment/infrastructure facts for this project (Cloudflare account, D1
database, domains, credentials locations, other projects) are recorded in the
local register at **`/workspace/projects/resources-inventory`**. Consult it
before guessing at IDs, hostnames, or where a secret lives; keep it updated when
infrastructure changes.

## Docs to keep in sync

`README.md` (architecture, API routes, operations), `SECURITY.md`,
`DEPLOYMENT_REPORT.md`, `CONTRIBUTING.md`, and `.github/*` are the
human-facing docs. Update the relevant doc whenever behaviour, commands, routes,
or structure change.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
