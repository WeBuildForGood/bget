-- Build For Good — Problem Commons seed data
--
-- Columns match migrations/0001_init.sql exactly. No column outside
-- 0001_init.sql (including any concurrently added `problems.slug`) is
-- referenced, so this file is safe to apply before or after that change.
--
-- Idempotency: every row uses an explicit `id` with `INSERT OR REPLACE`, so
-- running this file any number of times converges to exactly these six rows.
-- `created_at` and `reviewed_at` are pinned to fixed values so re-runs do not
-- shift the ordering or timestamps.
--
-- All six rows are `visibility = 'public'` and reviewed (`status` is either
-- `framed` or `active`). Content is deliberately qualitative: no invented
-- statistics are presented as fact.

INSERT OR REPLACE INTO problems
  (id, created_at, title, description, submitter_name, location, affected,
   tried, success_looks_like, why_bget, contribution, visibility, status, reviewed_at)
VALUES
  (1,
   '2026-07-14 09:20:00',
   'First-line triage of obstetric danger signs when no clinician is on site',
   'Community health officers and midwives in rural clinics are often the only staff on site when a woman arrives in labour, and they must decide within minutes whether a case can be handled locally or referred to a district hospital that may be hours away. The danger signs are documented in national guidelines, yet applying them under pressure, with intermittent electricity and no senior clinician to consult, is where delays and misjudged referrals happen. The problem is not knowledge of the signs. It is a reliable, low-cost way to apply them consistently and to escalate when the clinic is on its own.',
   'Abena Owusu',
   'Upper East Region, Ghana',
   'Community health officers, midwives, and the pregnant women and families they serve in clinics without a resident doctor.',
   'Paper partographs and printed referral checklists; scheduled radio check-ins with district supervisors; an informal phone group with the district hospital. Each helps, but none work when there is no signal, no charged phone, or no supervisor on shift.',
   'A triage aid that a single health officer can use in under five minutes, offline, in the local language, that reliably flags the cases that must be referred and gives a clear, documented reason to escalate. It will be judged against real referrals and reviewed by practising midwives.',
   'It needs clinical judgement, human-factors design, offline software, and translation in the same room as the people who will use it. No single discipline gets there alone.',
   'I am a practising midwife. I can recruit clinics for field testing, help translate, and say plainly when a design will not survive a real shift.',
   'public', 'framed', '2026-07-14 09:20:00'),

  (2,
   '2026-08-02 14:05:00',
   'Knowing whether a village water point is safe to drink, without a laboratory',
   'Community water committees are responsible for keeping boreholes and shallow wells working, but they have almost no way to tell whether the water is safe to drink between the rare visits from a district water office. Contamination is usually noticed only after people fall ill, by which point the source has been used for days. Committees need a testing approach they can run themselves, afford to restock, and understand well enough to act on.',
   'Thokozani Banda',
   'Salima District, Malawi',
   'Rural households, schoolchildren, and the volunteer water committees responsible for shared water points.',
   'H2S vial tests distributed through NGOs; chlorination after breakdowns; requests to the district water office. The vials run out and results are hard to interpret, and chlorination is inconsistent.',
   'A low-cost kit and a simple decision rule that a trained volunteer can use to classify a source as safe, treat, or avoid, with results recorded so the committee and the nearest health centre can see patterns over time.',
   'It is chemistry, hardware, supply chains, data, and community trust at once, and it has to be cheap enough to actually be restocked.',
   'I coordinate water committees across several villages. I can run field trials and give honest feedback on what volunteers will and will not keep doing.',
   'public', 'active', '2026-08-02 14:05:00'),

  (3,
   '2026-06-21 11:40:00',
   'Cutting the time between an emergency call and a dispatched ambulance',
   'In a busy city, the time from a caller reaching emergency services to an ambulance leaving the station is often longer than the drive itself, and the reasons are rarely clinical. Call-takers must collect an address from a frightened caller who may not know the street name, find the nearest available unit, and coordinate with a control room that may be working from a whiteboard, a spreadsheet, or a phone log. Every minute of that overhead is a minute the patient does not have.',
   'Daniel Mwangi',
   'Nairobi, Kenya',
   'Callers, patients, and the ambulance crews who arrive late to scenes they could have reached sooner.',
   'More phone lines, a shared spreadsheet of unit status, and informal radio coordination. These reduce some friction but do not give dispatch, crews, and hospitals one live picture they all trust.',
   'A dispatch aid that shortens call intake and unit selection without adding a step that crews abandon under pressure, measured against real call logs and reviewed with the people who take the calls.',
   'It is operations research, human factors, mapping, and lightweight software, and it only works if the people who dispatch it helped design it.',
   'I have years of dispatch logs and can get a control room to test changes against real shifts.',
   'public', 'framed', '2026-06-21 11:40:00'),

  (4,
   '2026-08-19 08:15:00',
   'Making soil-carbon measurement affordable for smallholder farms',
   'Smallholder cooperatives are being asked to adopt practices that build soil carbon, and some are offered payments for measurable improvement, but the measurement itself is the bottleneck. Laboratory soil testing is too slow and too costly to run across hundreds of small farms, and remote-sensing or model estimates are not trusted by the farmers or the buyers paying for them. There is a real gap between what farmers can change and what anyone can afford to verify.',
   'Wanjiru Kamau',
   'Kiambu and Nyeri counties, Kenya',
   'Smallholder farmers, their cooperatives, and the agronomists and buyers trying to reward soil-health improvements.',
   'Occasional laboratory sampling of composite plots; third-party remote-sensing products; farmer-recorded practice logs. Each is either too coarse, too costly, or too easy to dispute.',
   'A field method, with simple equipment and clear protocols, that gives a defensible soil-carbon estimate per farm at a fraction of laboratory cost, validated against laboratory results on a subset of farms.',
   'It spans soil science, sensing, statistics, and cooperative logistics, and it will be judged by whether farmers trust the number.',
   'I work with cooperatives. I can arrange farms for sampling and pressure-test any method against real field conditions.',
   'public', 'active', '2026-08-19 08:15:00'),

  (5,
   '2026-09-05 16:30:00',
   'Screening schoolchildren for hearing loss where no audiologist is within reach',
   'Children who cannot hear well are often mislabelled as inattentive, slow, or disruptive, and where there is no audiologist nearby a treatable hearing problem can quietly shape a whole education. Teachers and school nurses are well placed to notice the pattern, but they have no simple, reliable way to screen a class and know which children genuinely need referral. The children who most need a specialist are the least likely to be identified.',
   'Marisol Reyes',
   'Cebu Province, Philippines',
   'Schoolchildren, their teachers and families, and the small number of specialists asked to see only the cases that reach them.',
   'Whisper tests and questionnaires run by teachers; hearing camps a few times a year; referral to a distant hospital. Whisper tests are unreliable, and camps reach only the schools that hear about them.',
   'A screening protocol and low-cost tool that a trained teacher or nurse can run on a whole class, with a referral rule that catches the children who need one and does not overwhelm the specialists with false alarms.',
   'It is audiology, acoustics, education, and field-friendly hardware, and it has to be simple enough to survive a real classroom.',
   'I am a school nurse. I can run screening days, train teachers, and track which referrals actually reached an audiologist.',
   'public', 'framed', '2026-09-05 16:30:00'),

  (6,
   '2026-09-27 10:10:00',
   'Keeping people on treatment for chronic illness between clinic visits',
   'For conditions such as hypertension, diabetes, and HIV, the medicine only works if it is taken for years, yet many people miss doses or stop long before their next appointment, and the clinic often learns of it only when they return unwell. People frequently stop for reasons that have nothing to do with belief in the treatment, including running out of stock, travel, cost, side effects, or a schedule too complex to keep track of. Reminders alone do not fix this, because the barriers are rarely just forgetting.',
   'Sipho Ndlovu',
   'Eastern Cape, South Africa',
   'People living with chronic conditions, their households, and the clinics that see them only after a crisis.',
   'SMS reminders; longer prescription refills; treatment supporters; pill organisers. Each helps some patients, but none reaches the ones who quietly disengage.',
   'A lightweight way to notice early that someone is falling off treatment and to act on the real reason, whether supply, transport, cost, or side effects, with measures that show fewer missed refills rather than just more messages sent.',
   'It needs clinical, behavioural, logistics, and design thinking together, and it must be built with patients rather than for them.',
   'I work with community health workers and a clinic. I can help reach patients and understand the barriers they actually face.',
   'public', 'active', '2026-09-27 10:10:00');
