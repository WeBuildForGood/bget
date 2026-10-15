import type { Metadata } from "next";
import Link from "next/link";
import { PageShell, Section } from "@/components/site/page-shell";
import { Reveal } from "@/components/motion/reveal";
import { Marquee } from "@/components/motion/marquee";
import { JsonLd, articleLd } from "@/components/seo/json-ld";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Manifesto",
  description:
    "Capability without character is not enough. Why Build For Good exists, what we build, and the standard we hold each other to.",
  path: "/manifesto",
  type: "article",
});

const whatWeDo = [
  { k: "Build", v: "Ship software, startups, research, open source, hardware, creative work — real things that solve real problems." },
  { k: "Grow", v: "Technically, intellectually, physically, emotionally, socially. We do not separate the builder from the human." },
  { k: "Evolve", v: "Challenge your own assumptions, take criticism without fragility, become a better thinker than you were last month." },
  { k: "Together", v: "Collaborate instead of competing destructively. Someone else's win is information, not a threat." },
  { k: "Impact", v: "Measure success by what leaves the world better than we found it — people, society, and nature." },
  { k: "Harmoniously", v: "Ambition without cruelty. Competition without hatred. Disagreement without disrespect." },
];

const beliefs = [
  "Act with integrity when nobody is watching — that is what character means.",
  "Say \"I don't know — let's figure it out.\" Intellectual humility and high ambition belong together.",
  "Character is a prerequisite, not a bonus. Brilliance used to manipulate, humiliate, or exploit has no place here.",
  "Struggle out loud — pretending not to struggle earns no respect here.",
  "The first ten set the tone for the next thousand. We stay small and excellent rather than grow fast and become ordinary.",
];

const nots = [
  "Not a networking farm.",
  "Not a self-promotion channel.",
  "Not a place where status is measured in certifications.",
  "Not owned by any founder's startup — Build For Good belongs to its members.",
  "Not for people who are only here to extract.",
];

const dimensions = [
  ["Character", "Honest, trustworthy, keeps promises"],
  ["Kindness", "Does not treat people as tools"],
  ["Curiosity", "Wants to understand, not merely to appear knowledgeable"],
  ["Ambition", "Has meaningful goals and actually works on them"],
  ["Competence", "Can show something they have built or done"],
  ["Humility", "Comfortable saying \u201cI don't know\u201d"],
  ["Critical thinking", "Questions assumptions — including their own"],
  ["Collaboration", "Makes other people better"],
  ["Responsibility", "Thinks about consequences before acting"],
  ["Discipline", "Follows through"],
  ["Growth mindset", "Takes criticism without becoming defensive"],
  ["Positive intent", "Wants their capability to create, not destroy"],
];

function NumberBadge({ n }: { n: number }) {
  return (
    <span className="index-badge inline-flex h-8 min-w-8 items-center justify-center rounded-full border border-foreground/15 px-2 font-mono text-[11px] tracking-[0.1em] text-muted-foreground transition-colors duration-500 group-hover:border-[#eca8d6]/50 group-hover:text-[#eca8d6]">
      {String(n).padStart(2, "0")}
    </span>
  );
}

export default function ManifestoPage() {
  return (
    <>
      <JsonLd
        data={articleLd({
          path: "/manifesto",
          headline: "Capability without character is not enough.",
          description:
            "Why Build For Good exists, what we build, and the standard we hold each other to.",
        })}
      />
      <PageShell
        eyebrow="Manifesto"
        title={<>Capability without character<br />is not enough.</>}
        lead="We build with our hands and our minds — and we refuse to separate the two. Skill without humility, ambition without kindness, and capability without character: none of these make anything worth keeping. Build For Good is where exceptional people across every discipline show up for both."
        image={{ src: "/images/orbit.svg", alt: "" }}
        meta={["Character first", "Multidisciplinary", "Global by design"]}
      >
        <Marquee duration={46} className="border-b border-foreground/10 py-8">
          {["Build", "Grow", "Evolve", "Together", "Build", "Grow", "Evolve", "Together"].map(
            (word, i) => (
              <span key={`${word}-${i}`} className="flex items-center">
                <span className="font-display text-4xl md:text-6xl lg:text-7xl tracking-tight text-foreground/80">
                  {word}
                </span>
                <span className="mx-8 text-2xl text-[#eca8d6]">✳</span>
              </span>
            ),
          )}
        </Marquee>

        <Section eyebrow="What we do" title="Build. Grow. Evolve. Together.">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-foreground/10 border border-foreground/10">
            {whatWeDo.map((item, i) => (
              <div
                key={item.k}
                className="card-glow interactive group bg-background p-8 lg:p-10"
              >
                <NumberBadge n={i + 1} />
                <h3 className="mt-6 text-3xl font-display">{item.k}</h3>
                <p className="mt-4 text-muted-foreground leading-relaxed">{item.v}</p>
              </div>
            ))}
          </div>
          <Reveal y={16}>
            <p className="mt-10 text-lg text-muted-foreground max-w-3xl">
              These are not slogans — they show up as a weekly rhythm of{" "}
              <Link href="/activities" className="link-underline text-foreground">
                Build Nights, Deep Dives, and Challenges
              </Link>
              .
            </p>
          </Reveal>
        </Section>

        <Section eyebrow="What we believe" title="Five things we actually act on." muted>
          <ul className="grid gap-px bg-foreground/10 border border-foreground/10">
            {beliefs.map((b, i) => (
              <li
                key={b}
                className="card-glow group flex gap-6 bg-background px-8 py-7 transition-colors duration-500 hover:bg-foreground/[0.03] lg:px-10"
              >
                <span className="hidden font-mono text-sm text-muted-foreground/60 pt-1 sm:block">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-lg leading-relaxed text-pretty">{b}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section
          eyebrow="What we are not"
          title="The boundaries matter as much as the mission."
        >
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {nots.map((n) => (
              <li
                key={n}
                className="card-glow interactive group relative border border-foreground/10 p-6 text-muted-foreground leading-relaxed"
              >
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#eca8d6]/70">
                  Not
                </span>
                <p className="mt-3 text-foreground/90">{n.replace(/^Not /, "")}</p>
              </li>
            ))}
          </ul>
          <Reveal y={16}>
            <p className="mt-10 text-lg text-muted-foreground max-w-3xl">
              Everything we do reward is written down as an explicit behaviour in our{" "}
              <Link href="/values" className="link-underline text-foreground">
                values
              </Link>
              .
            </p>
          </Reveal>
        </Section>

        <Section
          eyebrow="Our commitment"
          title="What you get, and what we ask."
          muted
        >
          <div className="grid gap-px border border-foreground/10 bg-foreground/10 lg:grid-cols-2">
            <div className="bg-background p-8 lg:p-12">
              <h3 className="flex items-center gap-3 font-mono text-sm uppercase tracking-widest text-[#eca8d6]">
                <span className="h-px w-8 bg-[#eca8d6]/50" />
                We promise you
              </h3>
              <ol className="mt-8 space-y-5 text-lg">
                {[
                  "You will be surrounded by people who make you better.",
                  "You will be judged by your conduct, not your credentials.",
                  "You will be helped when you ask.",
                  "You will be told the truth, kindly.",
                  "Your work and your words are safe here.",
                ].map((p, i) => (
                  <li key={p} className="group flex gap-4">
                    <span className="font-mono text-sm text-muted-foreground pt-1 transition-colors group-hover:text-[#eca8d6]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-pretty">{p}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="bg-background p-8 lg:p-12">
              <h3 className="flex items-center gap-3 font-mono text-sm uppercase tracking-widest text-muted-foreground">
                <span className="h-px w-8 bg-foreground/20" />
                We ask of you
              </h3>
              <ol className="mt-8 space-y-5 text-lg">
                {[
                  "Show up. Contribute more than you extract.",
                  "Stay humble. Nobody here is finished.",
                  "Leave it better. Every project, every channel, every relationship you touch.",
                ].map((p, i) => (
                  <li key={p} className="group flex gap-4">
                    <span className="font-mono text-sm text-muted-foreground pt-1 transition-colors group-hover:text-[#eca8d6]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-pretty">{p}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Section>

        <Section
          id="standard"
          eyebrow="The Build For Good standard"
          title="Twelve dimensions. Character is the gate."
        >
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-foreground/10 border border-foreground/10">
            {dimensions.map(([name, desc], i) => (
              <div
                key={name}
                className="card-glow interactive group bg-background p-6"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-medium">{name}</h3>
                  <span className="font-mono text-[11px] text-muted-foreground/50 transition-colors group-hover:text-[#eca8d6]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <Reveal y={16}>
            <p className="mt-10 text-xl font-display">
              Character is the gate. Everything else is built on top of it.
            </p>
          </Reveal>
        </Section>

        <Section muted>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
            <p className="text-3xl md:text-4xl font-display max-w-2xl leading-tight text-balance">
              Build boldly. Grow continuously. Evolve consciously. Help others rise.
              Leave the world better than you found it.
            </p>
            <div className="flex flex-wrap gap-4 shrink-0">
              <Link
                href="/membership"
                className="sweep hover-lift inline-flex items-center justify-center rounded-full bg-foreground px-8 h-14 text-base font-medium text-background hover:bg-foreground/90"
              >
                Apply to join
              </Link>
              <Link
                href="/values"
                className="hover-lift inline-flex items-center justify-center rounded-full border border-foreground/20 px-8 h-14 text-base hover:bg-foreground/5"
              >
                Read our values
              </Link>
            </div>
          </div>
        </Section>
      </PageShell>
    </>
  );
}
