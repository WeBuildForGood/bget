# Deployment Report: buildforgood Website

## Build
- **Command:** `npm run build`
- **Result:** ✅ Success — compiled in 573ms
- **Routes generated:** 16 static pages + assets
  - `/`, `/_not-found`, `/about`, `/activities`, `/admin`, `/contact`, `/founders`, `/manifest.webmanifest`, `/manifesto`, `/membership`, `/problems`, `/projects`, `/robots.txt`, `/sitemap.xml`, `/values`

## Deploy
- **Command:** `npm run deploy` (wrangler deploy)
- **Result:** ✅ Success
- **Deployed URL:** https://buildforgood.nikhilnagpure203.workers.dev
- **Assets uploaded:** 49 files
- **Bindings:** `DB` (D1 Database), `ASSETS` (Cloudflare static assets)
- **Version ID:** 58ed7f0e-7e17-4e23-8990-a94f209a53e1

## Endpoint Verification
All 16 endpoints return HTTP 200:

| Endpoint | Status |
|---|---|
| / | 200 |
| /manifesto | 200 |
| /values | 200 |
| /membership | 200 |
| /problems | 200 |
| /projects | 200 |
| /activities | 200 |
| /about | 200 |
| /founders | 200 |
| /contact | 200 |
| /admin | 200 |
| /api/health | 200 |
| /sitemap.xml | 200 |
| /robots.txt | 200 |
| /manifest.webmanifest | 200 |
| /og.png | 200 |

## Notes
- Output directory: `out/` (static export via `output: 'export'` in next.config.mjs)
- Worker serves static assets via ASSETS binding and handles `/api/*` form endpoints + project detail pages from D1
- Compatibility date: 2026-10-01
- Account: 87fd5601199078add1a9f9f88d3608d6