# BGET Discord Architecture

Built for a **small, clean, active** server. Start with what you need; unlock
categories as the community earns them. An empty channel is a dead channel.

**Rule: never create a channel you can't personally seed with 20 good messages.**

---

## 1. Roles

Create in this order (highest → lowest):

| Role | Colour | Who | Key permissions |
|------|--------|-----|-----------------|
| `👑 Founder` | Gold | You | All. Use sparingly — never as a badge in arguments. |
| `🏛️ Steward` | Deep blue | 2–4 trusted elders | Manage channels, kick, timeout, pin, manage messages |
| `🧪 Guide` | Green | Event hosts, mentors | Create invites, embed links, manage threads, speak in events |
| `⭐ Member` | Grey-blue | Confirmed members (post-trial) | Send messages in all member channels, create threads |
| `🌱 Seedling` | Soft green | Trial members (first 30 days) | Read + post in onboarding, THINK, CONNECT; **no** project-team channels |
| `🤖 Bots` | Grey | Automation | — |

**Never** give a role based on how impressive someone sounds. Give it based on
what they've done *inside* BGET.

**Role assignment:** `@Seedling` on approval → `@Member` automatically at day 30
(via a bot check-in) or by a Steward's manual confirmation.

---

## 2. Categories & channels

```
📌 START HERE
  #welcome            ← rules + how to start (bot-gated, post-only for @everyone)
  #manifesto          ← the full manifesto, pinned
  #rules              ← short version of GOVERNANCE.md
  #introductions      ← structured template, ONE message per person
  #announcements      ← post-only, @Steward only
  #bot-commands       ← keep the noise out of real channels

🧠 THINK
  #deep-discussions   ← one big question per week
  #ideas              ← half-formed thoughts welcome
  #questions          ← no question too basic
  #books-and-learning ← what you're reading/learning

🛠️ BUILD
  #projects           ← what people are working on
  #open-source        ← issues, PRs, collabs
  #help               ← specific technical help requests
  #showcase           ← ship it, then show it

🚀 GROW
  #goals              ← weekly intentions, posted publicly
  #accountability     ← pairs/small groups
  #opportunities      ← jobs, grants, events, bounties (member-shared only)
  #resources          ← the good stuff, findable later

🤝 CONNECT
  #general            ← the living room
  #collaboration      ← "I have X, need Y"
  #life               ← beyond code: health, faith, family, hard days

🌍 IMPACT
  #earth-and-nature
  #social-impact
  #impact-reports     ← what we actually did, measured

🔒 BGET LABS            ← unlock at ~50 confirmed members
  #labs-standards
  #lab-<project-name>  ← one per active project, private to its team
  #labs-recruiting     ← projects looking for people

🔊 VOICE
  🔨 Build Night (live)
  ☕ Coffee / cowork
  🎙️ Deep Dive (stage/event)
```

**Threads over channels.** A topic that takes off becomes a thread, not a new
channel. Reap dead channels quarterly.

---

## 3. Permissions setup

**@everyone** → `Read #welcome, #manifesto, #rules` only. Deny `Send Messages`.
**@Seedling** → add send on `START HERE`, `🧠 THINK`, `🤝 CONNECT`, `#goals`.
**@Member** → everything except `🔒 BGET LABS`.
**@Steward** → `Manage Channels`, `Timeout`, `Kick`, `Manage Messages`.
**Founder** → also `Manage Roles` — but only roles *below* your own.

**Verification level:** Medium (Discord account > 10 min). Add **Membership Screening**
with the manifesto's short form — members must accept before seeing the server.

**Essential bots (keep the list short):**

| Purpose | Suggestion |
|---------|-----------|
| Verification + role assign | Carl-bot or Collard |
| Welcome + rules gate | Carl-bot |
| Mod log + timeouts | Carl-bot / Dyno |
| Application/DM reminders | A small custom bot, later |
| Events | Discord native Events |

Avoid turning the server into a slot machine of reactions and levels.
**Do not gamify with XP/leaderboards early** — it rewards posting volume, and
BGET rewards contribution quality. Revisit only if activity genuinely sags.

---

## 4. Onboarding flow (new member's first 10 minutes)

1. Joins → must accept **Membership Screening** (short values + rules).
2. Lands in `#welcome`. Reads: what BGET is (6 lines), the three asks, how to start.
3. Bot DMs: *"Welcome. Two things: post in #introductions using the template, and
   pick one thread this week where you can help someone."*
4. Posts intro → a **human** (you, at first) replies personally within 24h.
   Never let an introduction go unanswered — that's the single highest-leverage
   moment in the whole community.
5. Day 3: bot asks *"What are you working on? Post it in #goals."*
6. Day 7: someone invites them to an event or pairs them with a buddy.
7. Day 14: someone asks *"How do you want to contribute?"* — research, build,
   design, write, test, mentor, translate, organise, connect people, local/field
   work, domain expertise ([PEOPLE.md](PEOPLE.md) §5) — then points them at a
   project, thread, or problem that needs exactly that.
8. Day 30: trial review → `@Member`.

Copy: [templates/welcome-message.md](templates/welcome-message.md)

---

## 5. Launch sequence for your existing server

1. **Back up / archive** existing channels into a `🗄️ archive` category (don't delete).
2. Create the categories above, set permissions per role.
3. Post `#manifesto`, `#rules`, `#welcome`, `#introductions`.
4. Move your existing 2–3 interested people in as `@Seedling` — *they are your
   founding cohort, treat them that way.*
5. Run one **Build Night** within 7 days. Momentum beats perfection.
6. Only then invite person #4.

Full week-by-week: [PLAN-90-DAYS.md](PLAN-90-DAYS.md)
