# Branch model & protection rules

Repository: `WeBuildForGood/bget` · Canonical origin: **https://buildforgood.world**

## 1. The three baselines

| Branch | Role | Host | Data | Who can reach it |
|---|---|---|---|---|
| `main` | Production | https://buildforgood.world (+ www) | D1 `buildforgood-prod` | Public site; `/admin` behind Access |
| `staging` | Release candidate / soak | https://staging.buildforgood.world | D1 `buildforgood-staging` | Cloudflare Access — allow **nikhilnagpure203@gmail.com only** |
| `dev` | Integration + local baseline | none (never deployed) | local miniflare D1 (`.wrangler/state`) | Maintainer laptop only |

Promotion is always forward and always a merge commit (never squash, never cherry-pick):

```
feat/*  fix/*  chore/*  ──PR──►  dev  ──PR──►  staging  ──PR──►  main
```

Hotfix: `fix/* ──PR──► main`, then back-merge `main` into `staging` and `dev` the same day.

Merge commits keep `git merge-base --is-ancestor origin/staging origin/main` true, which is how you prove production contains exactly what staging tested.

## 2. Rules actually enforced (GitHub rulesets)

| Rule | `main` | `staging` | `dev` |
|---|---|---|---|
| Pull request required | yes | yes | yes |
| Required approvals | 0 \* | 0 \* | 0 \* |
| Required status check | `Test` | `Test` | `Test` |
| Conversation resolution | yes | yes | no |
| Force push / branch deletion | blocked | blocked | blocked |
| Rules apply to admins | yes | yes | yes |

\* **Solo-maintainer decision.** GitHub never lets a PR author approve their own PR. On a one-person repository a "1 approval" rule is therefore satisfied only by an admin bypass on every single merge — protection theatre, not protection. Mandatory PR + green `Test` + no force-push + no deletion is the honest configuration.

**When a second maintainer joins:** set `required_approving_review_count` to 1 on `main` and `staging`. Nothing else changes.

Verify what is live:

```bash
gh api repos/WeBuildForGood/bget/rulesets --jq '.[] | {name, enforcement, target}'
```

## 3. Environments (GitHub)

| Environment | Deployable from | Required reviewer |
|---|---|---|
| `production` | `main` only | none (solo) |
| `staging` | `staging` only | none (solo) |

A deployment branch policy stops a misconfigured workflow from shipping an unrelated branch. Reviewer gates stay off while there is one maintainer (GitHub does not allow self-approval); turn them on together with the second-maintainer rule above.

## 4. Secrets

- Repo secret `CF_API_TOKEN` — Cloudflare API token for the buildforgood account.
- `CF_API_TOKEN_STAGING` (optional) — a token scoped to the `buildforgood-staging` Worker and staging D1 only. When present, use it in the staging deploy job instead of the production token.
- `CF_ACCESS_CLIENT_ID` / `CF_ACCESS_CLIENT_SECRET` (optional) — Access service token so the staging smoke test can reach the site through Access.
- Never commit tokens. `.env*` and `.dev.vars*` are gitignored.

## 5. Staging access (Cloudflare Access) — REQUIRED

Staging is deployed and **must not be reachable anonymously**. The API there is writable, and the D1 database is isolated but real.

1. Zero Trust → Access → Applications → **Add an application** → Self-hosted.
2. Application domain: `staging.buildforgood.world` (include the whole hostname, not just `/admin`).
3. Policy: **Allow** → Include → **Emails** → `nikhilnagpure203@gmail.com`. No other include rule.
4. Session duration: 24 hours.
5. Optional for CI: create a service token `bget-ci`, add an **Allow → Service Token** rule, and store its Client ID / Secret as the two GitHub secrets above.
6. Copy the application's **AUD** and set the Worker secrets (if/when the Worker verifies Access itself):

   ```bash
   npx wrangler secret put ACCESS_TEAM_DOMAIN --env staging
   npx wrangler secret put ACCESS_AUD --env staging
   ```

7. Verify: an anonymous request must be redirected, never served.

   ```bash
   curl -sI https://staging.buildforgood.world/ | head -1   # expect 302, never 200
   ```

Until step 7 passes, treat staging as public: no real user data, no secrets, no customer information.

## 6. Local baseline (the `dev` branch)

`dev` is a real remote branch with **no deploy job**; the local environment is how it is exercised.

```bash
npm ci
cp .dev.vars.example .dev.vars      # local salt; leave Access vars blank
npm run db:migrate                  # migrations → .wrangler/state (local only)
npm run db:seed                     # seed problems/projects (local only)
npm run build                       # static export → out/
npm run preview                     # wrangler dev → http://127.0.0.1:8787
```

`npm run db:reset` wipes the local state and re-migrates + re-seeds. Nothing in this flow can reach Cloudflare.

## 7. Release checklist

- [ ] PR into `dev` is green (`Test`).
- [ ] PR `dev` → `staging`; merge; staging deploy succeeds.
- [ ] Staging returns 302/401/403 anonymously — never 200.
- [ ] `X-Robots-Tag: noindex` present on staging responses.
- [ ] Soak on staging; exercise the changed flow.
- [ ] PR `staging` → `main`; production deploy + smoke test green.
- [ ] Tag the release: `git tag -a vX.Y.Z -m "..." && git push origin vX.Y.Z`.
- [ ] Back-merge `main` into `staging` and `dev`.
