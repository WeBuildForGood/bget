import type { Metadata } from "next";
import Link from "next/link";
import { PageShell, Section } from "@/components/site/page-shell";
import { JsonLd, breadcrumbLd, eventSeriesLd, webPageLd } from "@/components/seo/json-ld";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Activities",
  description:
    "A manifesto doesn't make people stay — something happening does. The five recurring Build For Good rituals that turn community into action.",
  path: "/activities",
});

const core = [
  {
    icon: "🔨",
    name: "Build Night",
    cadence: "Weekly · 90 min · voice + screen share",
    repeat: "P1W",
    quote: "We're building something together tonight.",
    body: "10 min kickoff → 60 min building together → 20 min show-and-tell. Anything counts: automation, a website, a CLI tool, a cyber lab, a hardware prototype, an NGO site. No spectators — everyone builds something.",
  },
  {
    icon: "🎙️",
    name: "Deep Dive",
    cadence: "Weekly or fortnightly · 20–30 min",
    repeat: "P1W",
    quote: "One member presents something they're obsessed with.",
    body: "25 min talk → 15 min genuine Q&A, recorded. Anyone can speak, including week-one members. Rotating host: you convene, you are not the permanent speaker.",
  },
  {
    icon: "🧩",
    name: "Challenge",
    cadence: "Fortnightly · 1 week · teams of 2–4",
    repeat: "P2W",
    quote: "A small collaborative problem with a deadline.",
    body: "Announced Monday, demos Sunday. Judged on usefulness, effort, and collaboration — not polish. The prize: recognition and a slot at the next Deep Dive.",
  },
  {
    icon: "🧠",
    name: "Think",
    cadence: "Weekly · async-first",
    repeat: "P1W",
    quote: "A question worth arguing about well.",
    body: "A prompt runs all week, async so time zones don't kill it. One person steelman-moderates and posts the best opposing arguments before it closes. The goal: think better together — not win.",
  },
  {
    icon: "🌍",
    name: "Impact",
    cadence: "Monthly · physical or measurable",
    repeat: "P1M",
    quote: "Make the philosophy real.",
    body: "Tree planting, local cleanups, free teaching, software for an NGO, open-source maintenance. Measured and reported — for example, “we planted 40 trees with nine people” beats “we did good”.",
  },
];

const quarterly = [
  ["Showcase", "Quarterly", "Every active project demos — the external-facing moment."],
  ["Retreat / Meetup", "2× per year", "Relationships compound faster in person than in any channel."],
  ["Charter Review", "Quarterly", "Members propose changes to the rules. Keeps it theirs."],
  ["Project Retros", "End of each project", "What worked, what didn't, who contributed."],
  ["New Member Cohort", "Monthly", "Admit and onboard in small batches, not drip-fed."],
];

export default function ActivitiesPage() {
  return (
    <>
      <JsonLd
        data={[
          webPageLd({
            path: "/activities",
            name: "Activities — Build For Good",
            description:
              "The five recurring Build For Good rituals: Build Night, Deep Dive, Challenge, Think, and Impact.",
          }),
          /*
           * Each core ritual is explicitly recurring and its cadence is written
           * on the page, so an EventSeries is truthful here. `repeatFrequency`
           * is taken straight from the data above (P1W/P2W/P1M) — nothing is
           * invented that a visitor cannot read below.
           */
          eventSeriesLd({
            path: "/activities",
            name: "Build For Good rituals",
            description:
              "The five recurring Build For Good formats: Build Night, Deep Dive, Challenge, Think, and Impact.",
            events: core.map((a) => ({
              name: a.name,
              description: `${a.cadence}. ${a.quote}`,
              repeatFrequency: a.repeat,
            })),
          }),
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Activities", path: "/activities" },
          ]),
        ]}
      />
      <PageShell
        eyebrow="Activities"
        title={<>A manifesto doesn't make<br />people stay.</>}
        lead="Something happening does. Five recurring formats, run as rituals not one-offs — consistency turns a chat server into a real community."
      >
        <Section eyebrow="The core five" title="Our weekly and monthly rhythm.">
          <div className="grid gap-px bg-foreground/10 border border-foreground/10">
            {core.map((a) => (
              <div key={a.name} className="card-glow bg-background p-6 sm:p-8 lg:p-12 grid lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-4">
                  <div className="text-4xl">{a.icon}</div>
                  <h3 className="mt-4 text-3xl font-display">{a.name}</h3>
                  <p className="mt-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                    {a.cadence}
                  </p>
                </div>
                <div className="lg:col-span-8">
                  <p className="text-xl font-display text-muted-foreground">“{a.quote}”</p>
                  <p className="mt-4 text-muted-foreground leading-relaxed">{a.body}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-10 text-lg text-muted-foreground max-w-3xl">
            Each ritual exists to produce something real: a shipped project, a shared
            question, a measured result. That is the{" "}
            <Link href="/manifesto" className="link-underline text-foreground">
              philosophy
            </Link>{" "}
            made concrete rather than aspirational.
          </p>
        </Section>

        <Section eyebrow="Quarterly & milestones" title="The slower, deeper rhythms." muted>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-foreground/10 border border-foreground/10">
            {quarterly.map(([k, cadence, v]) => (
              <div key={k} className="card-glow bg-background p-5 sm:p-8">
                <h3 className="text-xl font-medium">{k}</h3>
                <p className="mt-1 font-mono text-xs uppercase tracking-widest text-[#eca8d6]">{cadence}</p>
                <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{v}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section eyebrow="If you can only keep one alive" title="Keep Build Night.">
          <p className="text-lg text-muted-foreground max-w-3xl">
            Shared work builds relationships faster than any amount of conversation.
            We launch the rituals gradually — Build Night first, then Think, then Deep
            Dive, then Challenge, then Impact — so that participation stays real.
          </p>
          <div className="mt-12 flex flex-wrap gap-4">
            <Link
              href="/membership"
              className="hover-lift inline-flex items-center justify-center rounded-full bg-foreground px-8 h-14 text-base font-medium text-background hover:bg-foreground/90"
            >
              Join Build For Good
            </Link>
            <Link
              href="/problems"
              className="hover-lift inline-flex items-center justify-center rounded-full border border-foreground/20 px-8 h-14 text-base hover:bg-foreground/5"
            >
              Bring a problem
            </Link>
            <Link
              href="/projects"
              className="hover-lift inline-flex items-center justify-center rounded-full border border-foreground/20 px-8 h-14 text-base hover:bg-foreground/5"
            >
              See what members ship
            </Link>
          </div>
        </Section>
      </PageShell>
    </>
  );
}
