# Contributing to Build For Good

Thanks for helping improve the Build For Good website. It's a small, deliberately
simple static site served by a Cloudflare Worker — contributions that keep it
that way are the most welcome.

**Quality over quantity** applies to contributions too: one focused pull request
that fixes a real problem beats five that add noise. The same bar we hold for
community membership — character before capability, careful work over volume —
applies here.

## Getting started

Requires Node ≥ 20.

```bash
git clone https://github.com/webuildforgood.git
cd bget
npm ci

# Frontend only (Next dev server — no /api/*; those live in the Worker):
npm run dev

# Full site + API locally, exactly as deployed:
npm run build     # required: the Worker serves the static export from out/
npm run preview   # wrangler dev  → http://127.0.0.1:8787
```

`npm run dev` renders the pages but has **no** `/api/*` — use `npm run preview`
to exercise the forms and the Worker API end to end (with local D1).

## The flow: fork → branch → PR

1. **Fork** the repository and create a branch from `main`:
   ```bash
   git checkout -b fix/short-description
   ```
2. **Make your changes.** Keep them scoped — one idea per pull request.
3. **Check locally** (see below) before opening the PR.
4. **Push and open a pull request** against `main`, and fill in the PR template
   (`.github/PULL_REQUEST_TEMPLATE.md`): what changed and *why*.
5. **Respond to review.** Small, reviewable diffs get reviewed quickly.

`main` is protected: CI must pass, at least one review is required, and direct
pushes are not allowed.

## Checking your work locally

Run these before opening a PR:

```bash
# Unit tests (Node's built-in runner; covers worker/lib/*)
npm test

# Type-check
npm run typecheck        # same as: npx tsc --noEmit

# The build gate CI enforces — a successful static export to out/
npm run build

# Optional: exercise the forms + API end to end (build first)
npm run build && npm run preview
```

Notes on the commands:

- **`npm test`** runs `node --test tests/` — the zero-dependency unit suite in
  `tests/` (rate limiting, slug generation, input validation in
  `worker/lib/*.js`). Add a `*.test.mjs` file there and it is picked up
  automatically.
- **`npm run lint`** and **`npm run typecheck`** both run `tsc --noEmit`; there
  is no ESLint setup in this repository.
- **`npm run preview`** (`wrangler dev`) runs the built Worker with a local D1,
  so the `/api/*` routes work end to end; `npm run dev` does not serve them.

## What makes a good pull request

- **No regressions.** `npm test` and `npm run typecheck` pass, and
  `npm run build` succeeds.
- **No console errors.** Open DevTools, reload the affected pages, and check the
  Console and Network tabs.
- **Docs updated.** If you change behaviour, commands, or structure, update
  `README.md` (and this file, if the process itself changes).
- **No secrets.** Never commit credentials or `.env` files — see
  [SECURITY.md](SECURITY.md).

## Code style

- **TypeScript, Next.js App Router.** Server logic belongs in `worker/` (the
  Worker); page components live under `app/`. Match the surrounding patterns.
- **Design tokens, not one-off values.** Colours and radii are CSS custom
  properties defined in `app/globals.css` (dark, `oklch` based — e.g.
  `--background`, `--foreground`, `--border`, `--primary`). Reuse them, or the
  Tailwind utilities generated from them, instead of hard-coding hex values.
- **Fonts** are loaded with `next/font/google` in `app/layout.tsx` (Inter,
  JetBrains Mono). Headings and display numbers share the Inter
  stack via `.font-display`; use the existing font variables.
- **Components.** Reuse the shadcn-style primitives in `components/ui/` and the
  shared form helpers in `components/site/` rather than building new ones.
  `lucide-react` provides icons.
- **Keep API changes in step with the docs.** The public and admin routes are
  documented in `README.md`; update it if you add or change an endpoint.
- **Static export.** The app is `output: 'export'` — no runtime Node server, so
  avoid APIs that require one.

## Reporting bugs and proposing features

Use the issue templates under [`.github/ISSUE_TEMPLATE/`](.github/ISSUE_TEMPLATE/).
For security issues, follow [SECURITY.md](SECURITY.md) instead — please do not
open a public issue for vulnerabilities.

## Code of conduct

This project follows the [Contributor Covenant 2.1](CODE_OF_CONDUCT.md). Be
thoughtful, be kind, be precise. Enforcement reports go to
hello@buildforgood.world.

## License

By contributing, you agree that your contributions are licensed under the
[MIT License](LICENSE).
