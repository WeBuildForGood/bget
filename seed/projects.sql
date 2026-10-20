-- Build For Good — project showcase seed data
--
-- Columns match migrations/0002_projects.sql exactly. `slug` is unique and
-- kebab-case; `status` is 'approved' so the public API and the server-rendered
-- project pages pick these rows up.
--
-- Idempotency: explicit `id` with `INSERT OR REPLACE`, and `slug` is stable per
-- row, so re-running converges to exactly these six projects (the UNIQUE slug
-- constraint can never be violated by a duplicate, since each slug always maps
-- to the same id). `created_at` / `updated_at` are pinned so ordering
-- (`featured DESC, created_at DESC`) is deterministic across runs.
--
-- `disciplines` and `tags` are comma-separated lists, which is exactly what
-- worker/lib/format.js `splitList` (and components/projects/project-card.tsx
-- `projectTags`) parse. No fabricated URLs, cover images, or emails are seeded,
-- so nothing here can 404 or impersonate a real address.

INSERT OR REPLACE INTO projects
  (id, created_at, updated_at, slug, title, one_liner, description, disciplines,
   stage, lead_name, location, team, tags, status, featured, reviewed_at)
VALUES
  (1,
   '2026-08-02 14:05:00', '2026-09-20 09:00:00',
   'aquatrack-water-quality-kit',
   'AquaTrack: a low-cost water-quality kit for community committees',
   'A field kit and a simple decision rule that lets trained water-committee volunteers judge whether a shared water point is safe to drink.',
   'AquaTrack is a prototype kit that pairs low-cost sensors and reagent tests with a plain-language decision rule, so a volunteer with a day of training can classify a borehole or shallow well as safe, needing treatment, or to be avoided. Results are logged on a simple card and, where there is signal, by phone, building a record that the committee and the nearest health centre can read together. The team is testing which measurements are worth the cost and which the volunteers will keep doing after the novelty wears off.',
   'Environmental chemistry, embedded hardware, WASH, data, community engagement',
   'prototype', 'Thokozani Banda', 'Salima District, Malawi',
   'Three community volunteers, one water chemist, one hardware engineer, one data volunteer',
   'water quality, sensors, WASH, open hardware',
   'approved', 1, '2026-08-02 14:05:00'),

  (2,
   '2026-07-14 09:20:00', '2026-09-15 09:00:00',
   'mama-triage-protocol',
   'Mama Triage: an offline first-line aid for obstetric danger signs',
   'Helping a lone community health officer decide, in minutes and offline, which women must be referred.',
   'Mama Triage turns a national danger-sign guideline into a short, offline decision aid that runs on an ordinary phone or a printed flip chart, in the local language. It is designed for the moment when no senior clinician is reachable, and it ends every path with a documented reason either to refer or to keep and monitor. The pilot is testing whether the aid changes referral decisions and whether staff keep using it after the first few weeks.',
   'Obstetrics, human factors, offline software, translation',
   'pilot', 'Abena Owusu', 'Upper East Region, Ghana',
   'Two midwives, a district health officer, a UX designer, a translator',
   'maternal health, triage, offline-first, clinical',
   'approved', 1, '2026-07-14 09:20:00'),

  (3,
   '2026-06-21 11:40:00', '2026-08-30 09:00:00',
   'dispatch-timeboard',
   'Dispatch Timeboard: shortening the call-to-dispatch gap',
   'An operations-research and design effort to cut the overhead between an emergency call and an ambulance leaving the station.',
   'This project starts from dispatch logs: where time is lost between a call arriving and a unit leaving. The aim is a shared, live picture of unit status and location that call-takers, crews, and receiving hospitals can all trust, without adding a step that crews abandon under pressure. It is at the idea stage, with the control room and its call-takers involved from the first sketch.',
   'Operations research, emergency medicine, mapping, human factors',
   'idea', 'Daniel Mwangi', 'Nairobi, Kenya',
   'A dispatch supervisor, an operations researcher, a GIS volunteer, a service designer',
   'EMS, dispatch, operations, mapping',
   'approved', 0, '2026-06-21 11:40:00'),

  (4,
   '2026-08-19 08:15:00', '2026-09-25 09:00:00',
   'soil-carbon-field-kit',
   'Soil Carbon Field Kit: affordable measurement for smallholders',
   'A field method and simple kit that give cooperatives a defensible soil-carbon estimate at a fraction of laboratory cost.',
   'The Soil Carbon Field Kit is an attempt to make measurement cheap and trustworthy enough that smallholder cooperatives can verify soil-health improvements and be paid for them. It combines a simple field sampling protocol with a low-cost sensing method and a statistical approach that borrows strength from laboratory samples on a subset of farms. The prototype is being compared against laboratory results before anyone relies on the numbers.',
   'Soil science, sensing, statistics, agronomy',
   'prototype', 'Wanjiru Kamau', 'Kiambu and Nyeri counties, Kenya',
   'An agronomist, a soil scientist, a statistician, two field technicians',
   'soil carbon, agriculture, measurement, climate',
   'approved', 0, '2026-08-19 08:15:00'),

  (5,
   '2026-09-05 16:30:00', '2026-09-28 09:00:00',
   'classroom-hearing-screening',
   'Classroom Hearing Screening: finding the children who need a referral',
   'A screening protocol and low-cost tool a teacher or school nurse can run on a whole class.',
   'This project is designing a classroom-level hearing screen that a trained teacher or nurse can run without an audiologist present, plus a referral rule that catches the children who need specialist care without swamping the few specialists available. It is at the idea stage, working from what schools already do and where those methods fail. The measure of success is whether the children who need help actually reach it.',
   'Audiology, acoustics, education, public health',
   'idea', 'Marisol Reyes', 'Cebu Province, Philippines',
   'A school nurse, an audiologist, a teacher, an acoustics volunteer',
   'hearing, screening, schools, disability',
   'approved', 0, '2026-09-05 16:30:00'),

  (6,
   '2026-06-10 10:00:00', '2026-09-30 09:00:00',
   'adherence-companion',
   'Adherence Companion: noticing early when chronic treatment lapses',
   'A lightweight service to catch the real reasons people fall off long-term treatment, not just to send more reminders.',
   'Adherence Companion helps clinics and community health workers notice, early and gently, that someone is drifting away from long-term treatment for hypertension, diabetes, or HIV, and then act on the actual barrier, whether that is supply, transport, cost, or side effects. It is live in one clinic, where it runs alongside existing refill records rather than replacing them. The team is measuring missed refills and, just as importantly, listening to the reasons behind them.',
   'Clinical care, behavioural science, logistics, service design',
   'live', 'Sipho Ndlovu', 'Eastern Cape, South Africa',
   'A pharmacist, two community health workers, a behavioural scientist, a service designer',
   'adherence, chronic illness, community health, behaviour',
   'approved', 0, '2026-06-10 10:00:00');
