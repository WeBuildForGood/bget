import type { Metadata } from "next";
import Link from "next/link";
import { PageShell, Section } from "@/components/site/page-shell";
import { JsonLd, breadcrumbLd, webPageLd } from "@/components/seo/json-ld";
import { pageMetadata, SITE } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "About",
  description:
    "A global, multidisciplinary community turning meaningful problems into collective action. Founded by Nikhil Nagpure and built by everyone who contributes.",
  path: "/about",
});

const pillars = [
  ["B — Build", "Build things that matter. Move from idea → action → experiment → real-world impact."],
  ["G — Grow", "Grow intellectually, technically, emotionally, ethically. Become more capable without becoming less human."],
  ["E — Evolve", "Question your assumptions, accept criticism, change your mind when the evidence demands it."],
  ["T — Together", "Collective intelligence accomplishes what isolated individuals cannot. Different disciplines. One problem."],
];

const disciplines = [
  "Mathematics", "Physics", "Medicine & health", "Engineering", "Software & AI",
  "Cybersecurity", "Business & entrepreneurship", "Strategy & policy", "Philosophy",
  "Design & art", "Law", "Environment", "Education", "Agriculture", "Skilled trades",
];

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={[
          webPageLd({
            path: "/about",
            name: `About ${SITE.name}`,
            description:
              "A global network for turning meaningful problems into collective action, founded by Nikhil Nagpure.",
            type: "AboutPage",
          }),
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "About", path: "/about" },
          ]),
        ]}
      />
      <PageShell
        eyebrow="About"
        title={<>A global network turning<br />problems into action.</>}
        lead="Build For Good is a multidisciplinary community of ambitious, curious, and compassionate builders who want to become more capable without becoming less human. Founded by Nikhil Nagpure. Built by everyone who contributes."
      >
        <Section eyebrow="What the name means" title="Build. Grow. Evolve. Together.">
          <div className="grid md:grid-cols-2 gap-px bg-foreground/10 border border-foreground/10">
            {pillars.map(([k, v]) => (
              <div key={k} className="card-glow bg-background p-6 sm:p-8 lg:p-10">
                <h3 className="text-3xl font-display">{k}</h3>
                <p className="mt-4 text-muted-foreground leading-relaxed">{v}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section
          eyebrow="Multidisciplinary by design"
          title="Not just software — every field that can help."
          muted
        >
          <div className="flex flex-wrap gap-3">
            {disciplines.map((d) => (
              <span key={d} className="card-glow hover-lift border border-foreground/15 px-5 py-3 text-sm">
                {d}
              </span>
            ))}
            <span className="card-glow border border-foreground/15 bg-foreground/[0.04] px-5 py-3 text-sm text-muted-foreground">
              + fields that don't exist yet
            </span>
          </div>
          <p className="mt-10 text-lg text-muted-foreground max-w-3xl">
            These disciplines meet on real work, not just in name. The{" "}
            <Link href="/problems" className="link-underline text-foreground">
              Problem Commons
            </Link>{" "}
            is where a doctor, an engineer, and a philosopher end up on the same team.
          </p>
        </Section>

        <Section eyebrow="Founder & Steward" title="One person started it. It isn't meant to stay one person's work.">
          <div className="grid lg:grid-cols-12 gap-12">
            <div className="lg:col-span-4">
              <div className="card-glow w-40 h-40 rounded-full border border-foreground/15 bg-foreground/[0.03] flex items-center justify-center">
                <span className="font-display text-5xl">NN</span>
              </div>
              <h3 className="mt-6 text-2xl font-display">Nikhil Nagpure</h3>
              <p className="mt-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Founder &amp; Steward
              </p>
            </div>
            <div className="lg:col-span-8 space-y-6 text-lg text-muted-foreground leading-relaxed">
              <p className="text-foreground">
                “I protect the culture, connect people, create opportunities, build
                alongside you, and listen.”
              </p>
              <p>
                I started Build For Good out of a simple frustration: the most capable people I
                met were scattered across fields and countries, and the places that
                gathered them rewarded status over substance. I wanted somewhere that
                judged you by your conduct, not your credentials — where someone could
                say “I don't know” without losing standing, and where a doctor, an
                engineer, and a philosopher would sit at the same table.
              </p>
              <p>
                Build For Good is not a networking farm, not a self-promotion channel, and not my
                startup. It belongs to its members. Nobody's contribution ranks higher
                because they founded it, and I can be outvoted. The point of starting
                this was never to become the centre of it. The{" "}
                <Link href="/manifesto" className="link-underline text-foreground">
                  manifesto
                </Link>{" "}
                is the promise we hold each other to.
              </p>
            </div>
          </div>
        </Section>

        <Section eyebrow="How we show people" title="Never invent a team." muted>
          <div className="grid md:grid-cols-3 gap-px bg-foreground/10 border border-foreground/10">
            {[
              ["Founder & Steward", "Started it; protects the culture."],
              ["Stewards & Guides", "Moderation, onboarding, hosting, mentoring — all earned."],
              ["Members & contributors", "Confirmed members and anyone who contributed to a problem."],
            ].map(([k, v]) => (
              <div key={k} className="card-glow bg-background p-6 sm:p-8">
                <h3 className="text-xl font-medium">{k}</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{v}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 text-lg text-muted-foreground max-w-3xl">
            No CTO. No invented advisors. Every person shown exists and does the thing.
            An honest “nobody yet” beats a grid of stock smiles. Contribution is bigger
            than code: research, local knowledge, translation, field work, and
            documentation all count. That is how the{" "}
            <Link href="/values" className="link-underline text-foreground">
              values
            </Link>{" "}
            get enforced in practice.
          </p>
        </Section>

        <Section>
          <div className="grid lg:grid-cols-12 gap-12 items-end">
            <div className="lg:col-span-8">
              <p className="font-mono text-sm uppercase tracking-widest text-muted-foreground mb-6">
                The North Star
              </p>
              <p className="text-4xl md:text-6xl font-display leading-[0.98]">
                Become more capable without becoming less human.
              </p>
            </div>
            <div className="lg:col-span-4 flex flex-wrap gap-4">
              <Link
                href="/manifesto"
                className="hover-lift inline-flex items-center justify-center rounded-full bg-foreground px-8 h-14 text-base font-medium text-background hover:bg-foreground/90"
              >
                Read the manifesto
              </Link>
              <Link
                href="/membership"
                className="hover-lift inline-flex items-center justify-center rounded-full border border-foreground/20 px-8 h-14 text-base hover:bg-foreground/5"
              >
                Apply to join
              </Link>
            </div>
          </div>
        </Section>
      </PageShell>
    </>
  );
}
