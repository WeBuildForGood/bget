# 3-Tier Branch Architecture & Protection Rules

This document specifies the professional branch promotion lifecycle and protection rules for the `bget-website` (`WeBuildForGood/bget`) repository.

---

## Architecture Overview

```
feature/* or fix/*  ──(PR)──►  dev (Local baseline)  ──(PR)──►  staging (Restricted Hosted)  ──(PR)──►  main (Production Live)
```

| Branch | Environment | Host URL | Database | Access Control |
|---|---|---|---|---|
| **`main`** | Production | `https://buildforgood.world`<br>`https://www.buildforgood.world` | Cloudflare D1: `buildforgood-prod` | Public site; `/admin` gated by Cloudflare Access |
| **`staging`** | Staging | `https://staging.buildforgood.world` | Cloudflare D1: `buildforgood-staging` | **Strictly Selective**: 100% gated via Cloudflare Zero Trust Access (team emails allowlist) |
| **`dev`** | Local Integration | `http://localhost:3000` / `localhost:4321` | Local SQLite D1 emulator | Local developers only; never publicly exposed |

---

## 1. Branch Rules

### `main` (Production)
- **Deployment:** Automatically deploys to live Cloudflare production worker on push/merge.
- **Rules:**
  - **No direct push:** All changes must arrive via pull request from `staging`.
  - **Required Reviews:** Minimum 1 peer approval required.
  - **Required Status Checks:** Strict pass on CI `test` (`npm run typecheck`, `npm test`, static export build).
  - **Conversation resolution:** All PR review discussions must be marked resolved.
  - **Post-deploy:** Smoke tests against `https://buildforgood.world/api/health` must pass.

### `staging` (Restricted Hosted Staging)
- **Deployment:** Automatically deploys to `buildforgood-staging` on push/merge.
- **Rules:**
  - **No direct push:** All changes must arrive via pull request from `dev`.
  - **Required Status Checks:** Strict pass on CI `test`.
  - **Access Gate:** Site-wide Cloudflare Access Zero Trust policy restricts all access to approved team emails.
  - **Data Isolation:** Uses dedicated D1 database `buildforgood-staging` (`db9f951c-1735-43e4-ac0e-a2bb0eb9f93f`).

### `dev` (Local Development Integration)
- **Deployment:** None (Local baseline only).
- **Rules:**
  - Feature branches (`feat/*`, `fix/*`) branch off `dev` and merge into `dev` via pull request.
  - Required CI validation check on pull request.
  - Force pushes restricted.

---

## 2. GitHub Branch Protection Setup

Configure via GitHub CLI or **Repository Settings → Branches**:

```bash
# Branch protection for main
gh api -X PUT repos/WeBuildForGood/bget/branches/main/protection \
  --input - <<EOF
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["test"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF

# Branch protection for staging
gh api -X PUT repos/WeBuildForGood/bget/branches/staging/protection \
  --input - <<EOF
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["test"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
```

---

## 3. Cloudflare Access (Zero Trust) Staging Setup

To enforce **"only access to us selective people"** on the hosted staging environment:

1. In the **Cloudflare Zero Trust Dashboard**:
   * Navigate to **Access → Applications → Add an application**.
   * Select **Self-hosted**.
   * Application name: `Build For Good - Staging`.
   * Application domain: `staging.buildforgood.world`.
2. Add an **Access Policy**:
   * Action: **Allow**.
   * Rule configuration:
     * **Include:** Emails / Email domain list (e.g., `shadownik.official@gmail.com`, `nikhilnagpure203@gmail.com`, or `@buildforgood.world`).
     * Optional: Add Service Token (e.g. `bget-ci`) if CI automated tests need access to `/api/health`.
3. In `wrangler.toml`:
   * `[env.staging]` routes to `staging.buildforgood.world` with `workers_dev = false` so the public `workers.dev` origin cannot bypass the Access gate.
