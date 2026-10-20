# Seed data — Build For Good

Two idempotent SQL files that give the site credible, real-feeling content
instead of empty tables:

| File | Table | Rows |
| --- | --- | --- |
| [`problems.sql`](./problems.sql) | `problems` (Problem Commons) | 6 |
| [`projects.sql`](./projects.sql) | `projects` (project showcase) | 6 |

The seed is intentionally **qualitative**. No invented statistics, no fake
URLs, cover images, or email addresses are written, so nothing here can 404,
impersonate a real mailbox, or read as a fabricated research claim.

## Apply it

From the repository root:

```bash
# Live database (remote) — the one the site actually serves:
node scripts/seed.mjs --yes

# A different database name:
node scripts/seed.mjs --yes --db buildforgood-prod

# Local miniflare D1 only (safe; never touches production):
node scripts/seed.mjs --yes --local
```

`scripts/seed.mjs` prints row counts **before and after**, groups them by
`status`, and shows the `featured=1` count. It refuses to run without `--yes`.
Running the SQL directly with wrangler is equally valid:

```bash
npx wrangler d1 execute buildforgood-prod --remote --file=seed/problems.sql
npx wrangler d1 execute buildforgood-prod --remote --file=seed/projects.sql
```

## What is in it

### Problem Commons — six entry points, one per discipline

Every row is `visibility = 'public'` and reviewed, with `status` either
`framed` or `active` — exactly the filter the public API applies
(`worker/routes/public.js` → `PUBLIC_PROBLEM_WHERE`). Each entry fills the full
intake form: `title`, `description`, `submitter_name`, `location`, `affected`,
`tried`, `success_looks_like`, `why_bget`, `contribution`.

| id | Title | status | Region |
| --- | --- | --- | --- |
| 1 | First-line triage of obstetric danger signs when no clinician is on site | framed | Upper East Region, Ghana |
| 2 | Knowing whether a village water point is safe to drink, without a laboratory | active | Salima District, Malawi |
| 3 | Cutting the time between an emergency call and a dispatched ambulance | framed | Nairobi, Kenya |
| 4 | Making soil-carbon measurement affordable for smallholder farms | active | Kiambu and Nyeri counties, Kenya |
| 5 | Screening schoolchildren for hearing loss where no audiologist is within reach | framed | Cebu Province, Philippines |
| 6 | Keeping people on treatment for chronic illness between clinic visits | active | Eastern Cape, South Africa |

Why these read as real:

- **They are framed the way a submitter would frame them** — the constraint
  (no clinician, no lab, no signal, no audiologist) is the problem, not the
  diagnosis. Each `description` is 2–4 specific sentences and avoids claims
  that would need a citation.
- **`tried` names real approaches that genuinely exist** — partographs, H2S
  vial tests, SMS reminders, treatment supporters — and says honestly where
  each falls short, rather than pretending nothing has been attempted.
- **`success_looks_like` is measurable but not over-quantified** — "fewer
  missed refills", "a defensible per-farm estimate" — so a team could define a
  baseline later without the seed inventing one.
- **The spread is deliberate**: maternal health, WASH, emergency services,
  soil science, audiology, and chronic-care adherence across six countries and
  three continents, so the Commons demonstrates cross-discipline reach.
- **`contribution` gives each submitter a concrete, honest role** ("I am a
  practising midwife… I can recruit clinics for field testing"), which is what
  makes a problem look ownable rather than anonymous.

### Projects — six Labs across the lifecycle

Each is `status = 'approved'` so it appears in `GET /api/projects` and gets a
server-rendered page at `/projects/<slug>`. `slug` is kebab-case and unique;
`disciplines` and `tags` are comma-separated lists, which is exactly what
`worker/lib/format.js#splitList` parses.

| id | slug | Stage | Featured | Discipline focus |
| --- | --- | --- | --- | --- |
| 1 | `aquatrack-water-quality-kit` | prototype | **yes** | environmental chemistry, open hardware, WASH |
| 2 | `mama-triage-protocol` | pilot | **yes** | obstetrics, human factors, offline software |
| 3 | `dispatch-timeboard` | idea | no | operations research, EMS, mapping |
| 4 | `soil-carbon-field-kit` | prototype | no | soil science, sensing, statistics |
| 5 | `classroom-hearing-screening` | idea | no | audiology, education, public health |
| 6 | `adherence-companion` | live | no | clinical care, behavioural science, logistics |

Why these read as real Labs:

- **They pair with the Commons.** Each project is the Lab that could grow out
  of the matching problem, sharing the same lead — the story the site tells
  ("Framed problems become Labs"). Five are idea/prototype/pilot and one is
  live, matching how a young community's portfolio actually looks — not six
  finished products.
- **Stages are honest.** Only the chronic-care project is `live`, and even its
  description says it runs in *one* clinic alongside existing records.
- **Two are `featured`** (ids 1 and 2) so the gallery's pinned row has content
  while the rest fill the grid.
- **No fake links.** `url`, `repo`, `demo`, `cover_image`, and `lead_email`
  are left `NULL`, so no card renders a broken link or a real-looking address.
  `team` and `disciplines` describe plausible multidisciplinary squads.

## Idempotency

Both files use explicit `id`s with `INSERT OR REPLACE`, and every `created_at`
/ `updated_at` / `reviewed_at` is pinned to a fixed value. Re-running a file any
number of times therefore **converges to exactly these twelve rows**:

- The primary key makes each insert replace, not duplicate, its row.
- `projects.slug` is `UNIQUE`; each slug always maps to the same `id`, so the
  `OR REPLACE` conflict target never fires on slug alone.
- Stable timestamps keep ordering deterministic — problems list by
  `created_at DESC`, projects by `featured DESC, created_at DESC`.
- `problems.sql` does **not** reference `problems.slug` (added later in
  `migrations/0004_rate_limits_and_slugs.sql`). It only touches columns from
  `migrations/0001`–`0003`, so it applies cleanly whether or not that column
  exists. When `0004` is present the seeded rows simply have `slug = NULL`,
  which the public API already handles: `publicProblem()` falls back to the
  numeric id as the handle, and the unique index permits multiple `NULL`s.

Verified locally with miniflare D1 (`wrangler d1 execute --local`): applying
each file twice leaves `problems = 6`, `projects = 6`, `projects.featured = 2`,
and the distinct-id and distinct-slug counts unchanged, both with and without
migration `0004` applied.

## Notes

- These rows are illustrative community content, not claims about real
  named individuals. Submitter and lead names are plausible placeholders, and
  no contact details are stored.
- The seed assumes the tables are empty (they were). Because it uses explicit
  low ids, applying it to a database that has already collected **real**
  submissions could replace rows with those ids. Only seed a fresh or
  re-seedable database.
