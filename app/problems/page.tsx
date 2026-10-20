import type { Metadata } from "next";
import Link from "next/link";
import { PageShell, Section } from "@/components/site/page-shell";
import { ProblemForm } from "@/components/site/problem-form";
import { ProblemsBoard } from "@/components/problems/problems-board";
import { JsonLd, breadcrumbLd, collectionPageLd } from "@/components/seo/json-ld";
import { pageMetadata } from "@/lib/site";

const DESCRIPTION =
  "Bring us a problem. We'll bring together the people who can help — across disciplines, borders, and status.";

export const metadata: Metadata = pageMetadata({
  title: "Problem Commons",
  description: DESCRIPTION,
  path: "/problems",
});

const loop = [
  ["Submit", "Anyone, anywhere, brings a problem to the table."],
  ["Understand", "Is it real? Who is affected? What's been tried, and what's missing?"],
  ["Assemble", "Find the disciplines the problem actually needs."],
  ["Lab", "A small team researches, designs, prototypes, and tests in the wild."],
  ["Validate", "Does it work outside a document?"],
  ["Deploy", "Can it be implemented where the affected people are?"],
  ["Impact", "Who benefited, what changed, what we learned."],
  ["Share", "Open the knowledge — where appropriate."],
];

const criteria = [
  ["Severity", "How bad is it for those living it?"],
  ["People affected", "How many, and how underserved?"],
  ["Urgency", "Does delay make it worse?"],
  ["Neglectedness", "Is anyone credible already on it?"],
  ["Feasibility", "Can small teams actually move it?"],
  ["Expertise available", "Do the needed disciplines exist near us?"],
  ["Testability", "Can we measure whether a solution worked?"],
  ["Scalability", "Could it help far beyond the first site?"],
  ["Safety & ethics", "Could working on this harm anyone?"],
];

const lifecycle = [
  "Submitted",
  "Reviewed",
  "Framed",
  "Research",
  "Lab forms",
  "Prototype",
  "Pilot",
  "Deployment",
  "Impact",
  "Learn",
];

/**
 * The four things that can happen to a submission. Every line is grounded in
 * copy already on this page: the "framed, parked, or declined with a reason"
 * promise, the capacity rule, the review criteria, and the Lab lifecycle.
 */
const handling = [
  [
    "Framed",
    "It is real — who lives with it, what has been tried, and what is missing are clear enough to work on. A framed problem joins the loop and is published on this board, with the submitter's consent.",
  ],
  [
    "Parked",
    "Real, but not taken up right now. It gets a written reason and stays on the record rather than being left to rot unanswered.",
  ],
  [
    "Declined",
    "Not ours to take on — unsafe, out of scope, or already being moved by someone credible. A warm decline with a reason, because an unanswered submission is a broken promise.",
  ],
  [
    "Becomes a Lab",
    "Framed problems become Labs: small teams that research, design, prototype, and test in the wild — then deploy where the affected people are. Stage 10, what worked and what failed, is mandatory.",
  ],
];

export default function ProblemsPage() {
  return (
    <>
      {/*
       * CollectionPage + BreadcrumbList: this route gathers many public
       * problems. The board is fetched client-side from /api/problems after the
       * static document loads, so there are no entries to enumerate at build
       * time — the node declares the page's intent without fabricating items.
       */}
      <JsonLd
        data={[
          collectionPageLd({
            path: "/problems",
            name: "Problem Commons — Build For Good",
            description: DESCRIPTION,
          }),
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Problem Commons", path: "/problems" },
          ]),
        ]}
      />
      <PageShell
        eyebrow="Problem Commons"
        title={
          <>
            Bring us a problem.
            <br />
            We&apos;ll bring the people.
          </>
        }
        lead="The world has no shortage of problems — only a shortage of people willing and capable of solving them, across disciplines, borders, and status. Submit a problem — anyone, anywhere."
      >
        <Section eyebrow="The loop" title="From the world, back to the world.">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-foreground/10 border border-foreground/10">
            {loop.map(([k, v], i) => (
              <div key={k} className="card-glow bg-background p-6 sm:p-8">
                <span className="font-mono text-sm text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 text-2xl font-display">{k}</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{v}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 text-lg text-muted-foreground max-w-3xl">
            No problem in, no loop. A loop without deployment is a study group.
            Deployment without learning is a one-off.
          </p>
        </Section>

        <Section
          id="commons"
          eyebrow="The commons"
          title="Problems brought to the commons."
          intro="Anything published here was brought by a real person, reviewed by a human, and marked public with consent. Each one shows where it is, how far it has come, and what has already been tried."
        >
          <ProblemsBoard />
        </Section>

        <Section
          eyebrow="How problems are handled"
          title="Framed, parked, or declined — with a reason."
          intro="Every submission gets a human answer. Nothing marked private is published, quoted, or shared."
          muted
        >
          <div className="grid gap-px border border-foreground/10 bg-foreground/10 sm:grid-cols-2">
            {handling.map(([k, v]) => (
              <div key={k} className="card-glow bg-background p-6 sm:p-8">
                <h3 className="text-2xl font-display">{k}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{v}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 max-w-3xl text-lg text-muted-foreground">
            If submissions outpace reviews, we <em className="text-foreground">close intake
            honestly</em> rather than let them rot unanswered. An unanswered submission is a broken
            promise. A closed door is not.
          </p>
        </Section>

        <Section
          eyebrow="What we promise"
          title="Every submission gets a human answer within 72 hours."
        >
          <div className="grid lg:grid-cols-2 gap-16">
            <div className="space-y-6 text-lg">
              <p className="text-muted-foreground line-through decoration-red-400/60">
                “Submit your problem and Build For Good will solve it.”
              </p>
              <p>
                “Submit a problem. Build For Good will help determine whether, how, and with whom
                it can be meaningfully worked on.”
              </p>
            </div>
            <div className="card-glow hover-lift border border-foreground/10 p-6 sm:p-8">
              <h3 className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
                The capacity rule
              </h3>
              <ul className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
                <li>Every submission is framed, parked, or declined with a reason.</li>
                <li>
                  If submissions outpace reviews, we <em className="text-foreground">close
                  intake honestly</em> rather than let them rot unanswered.
                </li>
                <li>An unanswered submission is a broken promise. A closed door is not.</li>
              </ul>
            </div>
          </div>
        </Section>

        <Section eyebrow="How we choose" title="No upvotes. Ever.">
          <p className="text-lg text-muted-foreground max-w-2xl mb-12">
            Voting picks popularity, not importance. In a hypothetical upvote feed, a
            meme with 14,000 votes would bury a rural healthcare problem with four. So
            we weigh every submission on:
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-foreground/10 border border-foreground/10">
            {criteria.map(([k, v]) => (
              <div key={k} className="card-glow bg-background p-5 sm:p-6">
                <h3 className="font-medium">{k}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{v}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 text-lg text-muted-foreground max-w-3xl">
            Framed problems become Labs — small teams that research, design, and build.
            See how that work runs in our{" "}
            <Link href="/activities" className="link-underline text-foreground">
              weekly and monthly rhythm
            </Link>
            .
          </p>
        </Section>

        <Section
          eyebrow="Lifecycle"
          title="Every problem shows its current stage."
          muted
        >
          <ol className="flex flex-wrap items-center gap-3">
            {lifecycle.map((stage, i) => (
              <li key={stage} className="flex items-center gap-3">
                <span className="card-glow hover-lift border border-foreground/15 px-5 py-3 text-sm">
                  {stage}
                </span>
                {i < lifecycle.length - 1 ? (
                  <span className="text-muted-foreground/40">→</span>
                ) : null}
              </li>
            ))}
          </ol>
          <p className="mt-10 text-lg text-muted-foreground max-w-3xl">
            Paused and archived are honest endings. A closed problem with a written
            reason beats an abandoned problem with a green badge. Stage 10 — what
            worked, what failed, what the next team should know — is mandatory.
          </p>
          <p className="mt-6 text-lg text-muted-foreground max-w-3xl">
            Want to be one of the people we bring? That is what{" "}
            <Link href="/membership" className="link-underline text-foreground">
              membership
            </Link>{" "}
            is for.
          </p>
        </Section>

        <Section id="submit" eyebrow="Submit" title="Tell us what's actually happening.">
          <ProblemForm />
        </Section>
      </PageShell>
    </>
  );
}
