# Branch Protection Rules

This document outlines the required branch protection rules for the `bget-website` repository.

## `main` branch

- **Status checks required:** Must have `test` passing (status check named exactly `'test'`).
- **Pull request reviews:** At least **1 review** is required before merging.
- **Restrict pushes:** **No direct push** — all changes must come via pull request.
- **Require conversation resolution:** All conversations must be resolved.
- **Require signed commits:** Optional but recommended.

## `staging` branch (optional)

- Same rules as `main` for consistency.
- Used for staging environment deployments when PRs are merged to `staging` or labeled with `preview`.

## Setup instructions

1. Go to **Settings → Branches** in the repository.
2. Add a protection rule for `main`.
3. Check the required status checks and select `test`.
4. Set "Require pull request reviews before merging" to **1**.
5. Enable "Restrict who can push to matching branches" -> **No direct push allowed**.
