import type { Metadata } from "next";
import Link from "next/link";
import { PageShell, Section } from "@/components/site/page-shell";
import { ApplyForm } from "@/components/site/apply-form";
import { JsonLd, breadcrumbLd, serviceLd, webPageLd, howToLd } from "@/components/seo/json-ld";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Membership",
  description:
    "Open to meaningful problems, selective with people. The Build For Good filter: the twelve dimensions, a real conversation, and a 30-day trial.",
  path: "/membership",
});

const dimensions = [
  ["Character (gate)", "Keep promises — even when it costs"],
  ["Kindness", "Make people feel respected and safe"],
  ["Curiosity", "Ask better questions than you answer"],
  ["Ambition", "Set real goals, show consistent effort"],
  ["Competence", "Show what you've built or done"],
  ["Humility", "“I don't know”, accepts correction"],
  ["Critical thinking", "Question your own assumptions"],
  ["Collaboration", "Make others better"],
  ["Responsibility", "Think through consequences before acting"],
  ["Discipline", "Follow through, repeatedly"],
  ["Growth mindset", "Use criticism as fuel"],
  ["Positive intent", "Want capability to create, not to dominate"],
];

const doors = [
  {
    title: "Bring a problem",
    standard: "Open to anyone, anywhere",
    why: "Problems need solving — not permission.",
    href: "/problems",
    cta: "Submit a problem",
  },
  {
    title: "Join Build For Good",
    standard: "Application → conversation → 30-day trial",
    why: "The filter protects the community from those who would erode it.",
    href: "#apply",
    cta: "Apply to join",
  },
  {
    title: "Join a Lab",
    standard: "Depends on what the project needs",
    why: "Some work needs domain expertise; some needs translation — you don't have to be a member to help.",
    href: "/problems",
    cta: "See the Problem Commons",
  },
];

export default function MembershipPage() {
  return (
    <>
      {/*
       * No visible Q&A exists on this page, so a FAQPage would mean inventing
       * questions. A Service node truthfully describes the offering (selective
       * membership) that the page actually presents.
       */}
      <JsonLd
        data={[
          webPageLd({
            path: "/membership",
            name: "Membership — Build For Good",
            description:
              "The Build For Good filter: the twelve dimensions, the conversation, and the 30-day trial.",
          }),
          serviceLd({
            path: "/membership",
            name: "Build For Good membership",
            description:
              "Selective membership to a global multidisciplinary community: apply, talk with us, then a 30-day trial before it is confirmed.",
            serviceType: "Community membership",
          }),
          howToLd({
            path: "/membership",
            name: "How to apply to Build For Good",
            description:
              "Application process for joining Build For Good: submit application, conversation, 30-day trial",
            steps: [
              {
                name: "Apply",
                itemListElement: [
                  { type: "HowToTip", name: "Fill out the application form", text: "No CV, no years-of-experience field — just tell us what you've built and one thing you're struggling with." },
                  { type: "HowToTip", name: "Submit your application", text: "We'll review it within 72 hours." },
                ],
              },
              {
                name: "Talk",
                itemListElement: [
                  { type: "HowToTip", name: "Schedule a 15–20 minute conversation", text: "Not an interrogation — you're deciding whether we're worth your time too." },
                ],
              },
              {
                name: "Trial",
                itemListElement: [
                  { type: "HowToTip", name: "Complete a 30-day provisional membership", text: "Introduce yourself, help someone, show up once. Then it's confirmed." },
                ],
              },
            ],
          }),
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Membership", path: "/membership" },
          ]),
        ]}
      />
      <PageShell
        eyebrow="Membership"
        title={<>Open to problems.<br />Selective with people.</>}
        lead="We choose small and excellent over fast and ordinary. The application protects the community — it does not gatekeep status."
      >
        <Section eyebrow="Three doors" title="Everyone finds their door in one screen.">
          <div className="grid lg:grid-cols-3 gap-px bg-foreground/10 border border-foreground/10">
            {doors.map((d) => (
              <div key={d.title} className="card-glow hover-lift bg-background p-6 sm:p-8 lg:p-10 flex flex-col">
                <h3 className="text-3xl font-display">{d.title}</h3>
                <p className="mt-4 font-mono text-xs uppercase tracking-widest text-[#eca8d6]">
                  {d.standard}
                </p>
                <p className="mt-4 text-muted-foreground leading-relaxed flex-1">{d.why}</p>
                <Link
                  href={d.href}
                  className="link-underline mt-8 inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  {d.cta} →
                </Link>
              </div>
            ))}
          </div>
        </Section>

        <Section
          eyebrow="The filter"
          title="Twelve dimensions. Character is a gate, not an average."
          muted
        >
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-foreground/10 border border-foreground/10">
            {dimensions.map(([name, desc]) => (
              <div key={name} className="card-glow bg-background p-5 sm:p-6">
                <h3 className="font-medium">{name}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 text-lg text-muted-foreground max-w-2xl">
            Score each 1–5. Anyone scoring 1–2 on Character is declined regardless of
            every other score. Otherwise: Character ≥ 4, average of the rest ≥ 3. The
            full standard is public in our{" "}
            <Link href="/values" className="link-underline text-foreground">
              values
            </Link>
            .
          </p>
        </Section>

        <Section eyebrow="The process" title="Under ten minutes to apply. Then a real conversation.">
          <div className="grid sm:grid-cols-3 gap-px bg-foreground/10 border border-foreground/10">
            {[
              ["Apply", "No CV, no years-of-experience field — by design. We ask what you've built, and one thing you're struggling with."],
              ["Talk", "A 15–20 minute voice conversation. Not an interrogation — you're deciding whether we're worth your time too."],
              ["Trial", "Membership is provisional for 30 days. Introduce yourself, help someone, show up once. Then it's confirmed."],
            ].map(([k, v], i) => (
              <div key={k} className="card-glow bg-background p-6 sm:p-8">
                <span className="font-mono text-sm text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 text-2xl font-display">{k}</h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">{v}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 text-lg text-muted-foreground max-w-3xl">
            Not ready to apply? You can still{" "}
            <Link href="/problems" className="link-underline text-foreground">
              bring a problem
            </Link>{" "}
            or join a Lab — contributing to a problem never requires membership. Or see
            the{" "}
            <Link href="/activities" className="link-underline text-foreground">
              weekly rituals
            </Link>{" "}
            members run.
          </p>
        </Section>

        <Section id="apply" eyebrow="Apply" title="Bring us your honesty, not your résumé." muted>
          <ApplyForm />
        </Section>

        <Section>
          <p className="text-2xl md:text-3xl font-display max-w-3xl leading-tight">
            We judge by conduct, not credentials. A small group of trustworthy
            people is worth more than thousands of inactive ones.
          </p>
        </Section>
      </PageShell>
    </>
  );
}
