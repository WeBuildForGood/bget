import type { Metadata } from "next";
import Link from "next/link";
import { PageShell, Section, Eyebrow } from "@/components/site/page-shell";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { JsonLd, breadcrumbLd, webPageLd } from "@/components/seo/json-ld";
import { pageMetadata, SITE } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Founders",
  description:
    "The people who started Build For Good — and the roles still open. Founded by Nikhil Nagpure. No invented team, no borrowed titles.",
  path: "/founders",
});

const founderLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": `${SITE.url}/founders#founder`,
  name: SITE.founder,
  jobTitle: "Founder & Steward",
  description:
    "Founder of Build For Good, a global multidisciplinary community turning meaningful problems into collective action.",
  url: `${SITE.url}/founders`,
  worksFor: { "@id": `${SITE.url}/#organization` },
  founderOf: { "@id": `${SITE.url}/#organization` },
  sameAs: [SITE.github],
};

const roles = [
  {
    title: "Founder",
    holder: "Nikhil Nagpure",
    open: false,
    owns: "The culture, the long view, and the promise that every submission gets a human answer.",
    accountable:
      "Staying small enough to stay honest. Setting no direction alone — and being outvoted without a fight.",
  },
  {
    title: "Stewards",
    holder: "Roles open",
    open: true,
    owns: "Moderation, onboarding, hosting, and mentoring. The unglamorous work that keeps a room worth being in.",
    accountable:
      "Earned, never appointed. If a Steward stops showing up, the title goes with the behaviour.",
  },
  {
    title: "Guides",
    holder: "Roles open",
    open: true,
    owns: "Field knowledge. Clinicians, engineers, researchers, designers, tradespeople who review real work in their discipline.",
    accountable:
      "Saying 'this is wrong' in their own field, kindly, and helping the team get it right rather than just grading it.",
  },
  {
    title: "Members & contributors",
    holder: "Open to join",
    open: true,
    owns: "The actual building. Research, prototypes, translation, field work, documentation, follow-through.",
    accountable:
      "The values, in practice. Contribution is bigger than code, and everyone's work is visible to everyone.",
  },
];

export default function FoundersPage() {
  return (
    <>
      <JsonLd
        data={[
          webPageLd({
            path: "/founders",
            name: `Founders — ${SITE.name}`,
            description:
              "The people who started Build For Good — and the roles still open. Founded by Nikhil Nagpure.",
            type: "AboutPage",
          }),
          founderLd,
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Founders", path: "/founders" },
          ]),
        ]}
      />
      <PageShell
        eyebrow="The people behind it"
        title="Founders"
        lead="One person started Build For Good. It's not meant to stay one person's work. Here is who founded it, what that role is accountable for, and where the doors are still open."
      >
        <Section
          eyebrow="Founder & Steward"
          title="Nikhil Nagpure"
        >
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            <Reveal y={24} className="lg:col-span-4">
              <div className="lg:sticky lg:top-28">
                <div className="card-glow grid-lines relative aspect-[4/5] w-full max-w-xs rounded-lg border border-foreground/15 bg-foreground/[0.03] flex items-center justify-center overflow-hidden">
                  <div className="aurora pointer-events-none absolute inset-0" aria-hidden="true" />
                  <span className="relative font-display text-7xl text-foreground">NN</span>
                </div>
                <p className="mt-4 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Nikhil Nagpure — Founder &amp; Steward
                </p>
              </div>
            </Reveal>

            <div className="lg:col-span-8 space-y-8">
              <Reveal y={20}>
                <blockquote className="text-2xl md:text-3xl font-display leading-[1.15] text-foreground">
                  “I would rather build a small room where people keep their word than a
                  large one where nobody has to.”
                </blockquote>
              </Reveal>

              <Reveal y={20} delay={70}>
                <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                  <p className="text-foreground">
                    Nikhil is the founder and steward of Build For Good. He is not a
                    professional community-builder, a serial founder, or anyone whose
                    credentials deserve their own paragraph. He is a builder who kept
                    running into the same waste: extraordinary people, working alone, on
                    problems that needed each other.
                  </p>
                  <p>
                    He started this instead of complaining about it. The ambition is not
                    his — it belongs to everyone who joins — but the first version of it
                    is his to hold steady until the community is strong enough to hold it
                    itself.
                  </p>
                </div>
              </Reveal>

              <Reveal y={20} delay={140}>
                <div className="card-glow border border-foreground/10 p-6 sm:p-8">
                  <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    What he believes
                  </h3>
                  <ul className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
                    <li>
                      Capability is rarely the bottleneck — trust and coordination are.
                    </li>
                    <li>
                      Conduct is a better signal than credentials — a promise kept beats a
                      résumé every time.
                    </li>
                    <li>
                      The right number of people to start something serious is small, and
                      smaller than most people are comfortable admitting.
                    </li>
                    <li>
                      A community is only as honest as the things it is willing to say out
                      loud: “I don't know”, “I was wrong”, “this didn't work”.
                    </li>
                  </ul>
                </div>
              </Reveal>

              <Reveal y={20} delay={210}>
                <div className="flex flex-wrap gap-4">
                  <Button asChild variant="outline" className="hover-lift rounded-full h-12 px-7">
                    <a href={SITE.github} target="_blank" rel="noreferrer noopener">
                      GitHub
                    </a>
                  </Button>
                  <Button asChild variant="outline" className="hover-lift rounded-full h-12 px-7">
                    <Link href="/contact">Contact</Link>
                  </Button>
                </div>
              </Reveal>
            </div>
          </div>
        </Section>

        <Section
          eyebrow="How the founding team works"
          title="Titles describe accountability, not status."
          intro="Every role names what it owns and what it answers for. If a role has no holder, that's written plainly — an honest gap beats a borrowed name."
          muted
        >
          <div className="grid md:grid-cols-2 gap-px bg-foreground/10 border border-foreground/10">
            {roles.map((r, i) => (
              <Reveal key={r.title} y={20} delay={i * 60} className="card-glow bg-background p-6 sm:p-8 lg:p-10">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-2xl md:text-3xl font-display">{r.title}</h3>
                  <span
                    className={`mt-1 shrink-0 font-mono text-xs uppercase tracking-[0.18em] ${
                      r.open ? "text-[#eca8d6]" : "text-muted-foreground"
                    }`}
                  >
                    {r.open ? "Open" : "Filled"}
                  </span>
                </div>
                <p className="mt-3 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {r.holder}
                </p>
                <dl className="mt-6 space-y-5">
                  <div>
                    <dt className="font-mono text-xs uppercase tracking-[0.15em] text-foreground">
                      Owns
                    </dt>
                    <dd className="mt-2 text-muted-foreground leading-relaxed">{r.owns}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-xs uppercase tracking-[0.15em] text-foreground">
                      Accountable for
                    </dt>
                    <dd className="mt-2 text-muted-foreground leading-relaxed">
                      {r.accountable}
                    </dd>
                  </div>
                </dl>
              </Reveal>
            ))}
          </div>
          <Reveal y={20} delay={120}>
            <p className="mt-10 text-lg text-muted-foreground max-w-3xl">
              There is no CTO, no advisory board, and no glossy team page waiting to be
              filled with stock portraits. That is deliberate. Every person shown here
              exists and does the thing — and until someone does, the role stays{" "}
              <em className="text-foreground not-italic">open</em>.
            </p>
          </Reveal>
        </Section>

        <Section eyebrow="Co-found the rest" title="The founding is not finished. It barely started.">
          <div className="grid lg:grid-cols-12 gap-12 items-end">
            <Reveal y={20} className="lg:col-span-8">
              <div className="space-y-6 text-lg text-muted-foreground leading-relaxed max-w-3xl">
                <p>
                  The first version of Build For Good needs people who will co-found its
                  culture, not just consume it: stewards who host and welcome, guides who
                  keep their field honest, and members who would rather build one real
                  thing than describe ten.
                </p>
                <p className="text-foreground">
                  If you have been waiting for permission, this is it. The people who
                  arrive early are the ones the place gets shaped around.
                </p>
              </div>
            </Reveal>
            <Reveal y={20} delay={120} className="lg:col-span-4">
              <div className="flex flex-wrap gap-4">
                <Button asChild className="hover-lift rounded-full h-14 px-8 bg-foreground text-background hover:bg-foreground/90">
                  <Link href="/membership">Apply to join</Link>
                </Button>
                <Button asChild variant="outline" className="hover-lift rounded-full h-14 px-8">
                  <Link href="/problems">Bring a problem</Link>
                </Button>
              </div>
            </Reveal>
          </div>

          <Reveal y={20} delay={180}>
            <div className="mt-16 flex flex-wrap items-center gap-4 border-t border-foreground/10 pt-8">
              <Eyebrow>Read next</Eyebrow>
              <Link href="/manifesto" className="link-underline inline-flex min-h-11 items-center text-muted-foreground hover:text-foreground">
                The manifesto
              </Link>
              <span className="text-muted-foreground/40">·</span>
              <Link href="/values" className="link-underline inline-flex min-h-11 items-center text-muted-foreground hover:text-foreground">
                How we behave
              </Link>
              <span className="text-muted-foreground/40">·</span>
              <Link href="/about" className="link-underline inline-flex min-h-11 items-center text-muted-foreground hover:text-foreground">
                About Build For Good
              </Link>
            </div>
          </Reveal>
        </Section>
      </PageShell>
    </>
  );
}
