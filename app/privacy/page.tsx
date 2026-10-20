import type { Metadata } from "next";
import Link from "next/link";
import { PageShell, Section } from "@/components/site/page-shell";
import { JsonLd, breadcrumbLd, webPageLd } from "@/components/seo/json-ld";
import { pageMetadata, SITE } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Privacy",
  description:
    "What the Build For Good website collects through its forms, why, where it is stored, who can see it, how long it is kept, and how to ask us to delete it.",
  path: "/privacy",
});

type FormSpec = {
  name: string;
  href: string;
  purpose: string;
  required: string[];
  optional: string[];
};

/**
 * Field lists mirror the live forms exactly:
 *   components/site/apply-form.tsx, problem-form.tsx,
 *   components/projects/project-form.tsx, contact-form.tsx,
 *   suggestion-form.tsx, feedback-form.tsx.
 */
const forms: FormSpec[] = [
  {
    name: "Membership application",
    href: "/membership#apply",
    purpose: "To review your application and decide whether to invite you to a short conversation.",
    required: ["Name", "Email", "One thing you have made"],
    optional: [
      "Where you are",
      "Disciplines",
      "Something you are genuinely struggling with",
      "Why Build For Good, and what you want to become",
      "Links",
      "Referred by",
    ],
  },
  {
    name: "Problem submission",
    href: "/problems#submit",
    purpose:
      "To read and frame a problem — and, only if you choose Public, to publish it in the Problem Commons.",
    required: ["The problem, in one line", "What is actually happening"],
    optional: [
      "What success would look like",
      "Who is affected",
      "What has already been tried",
      "Why Build For Good might help",
      "What you can contribute",
      "Your name",
      "Email",
      "Where the problem is",
      "Who can see it (Public / review-only / private)",
    ],
  },
  {
    name: "Project submission",
    href: "/projects#submit",
    purpose: "To review a project and, if a person approves it, show it in the public showcase.",
    required: ["Project title", "One-line summary", "Description", "Lead name", "Lead email"],
    optional: [
      "Disciplines",
      "Stage",
      "Tags",
      "Location",
      "Team",
      "Website",
      "Repository",
      "Live demo",
      "Cover image",
    ],
  },
  {
    name: "Contact message",
    href: "/contact",
    purpose: "To read your message and reply.",
    required: ["Name", "Email", "Message"],
    optional: ["Subject"],
  },
  {
    name: "Suggestion",
    href: "/contact",
    purpose: "To consider an idea for the community, and reply if you asked us to.",
    required: ["Topic", "Your idea"],
    optional: ["Name", "Email"],
  },
  {
    name: "Feedback",
    href: "/contact",
    purpose: "To find and fix what is broken, slow, or confusing.",
    required: ["What kind of feedback", "Your feedback"],
    optional: ["Page or area", "Email", "Overall rating (1–5)"],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <JsonLd
        data={[
          webPageLd({
            path: "/privacy",
            name: `Privacy — ${SITE.name}`,
            description:
              "What the Build For Good website collects, why, where it is stored, who can see it, and how to ask for it to be deleted.",
          }),
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Privacy", path: "/privacy" },
          ]),
        ]}
      />
      <PageShell
        eyebrow="Privacy"
        title="Privacy, in plain language."
        lead="This page describes what the Build For Good website actually does with the information you give it. It is written to match how the site is really built — not to hide behind it."
      >
        <Section
          id="overview"
          className="scroll-mt-28"
          eyebrow="Start here"
          title="The short version."
        >
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Last updated: 2026-10-16
          </p>

          <div className="mt-8 card-glow rounded-2xl border border-[#fbbf24]/40 bg-[#fbbf24]/[0.06] p-6 lg:p-8">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#fbbf24]">
              Note — needs human / legal review
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              This is a good-faith description of what the site does today, written by the team
              behind it — it is <strong className="text-foreground">not legal advice</strong>, and
              it has not been reviewed by a lawyer. In particular, a formal retention schedule and
              a children&rsquo;s-data position still need to be agreed before this can be relied on
              as a policy. Treat it as honest documentation, not a guarantee.
            </p>
          </div>

          <ul className="mt-10 grid gap-px bg-foreground/10 border border-foreground/10 sm:grid-cols-2">
            {[
              ["We collect only form fields", "Plus the basics needed to stop spam: the time, your browser string, and a hashed IP for rate limits."],
              ["It lives in Cloudflare D1", "Submissions are stored in one Cloudflare D1 database, reachable only through the site's Worker."],
              ["Stewards can read it", "Through an internal admin panel behind Cloudflare Access. Public problems show only what you marked Public."],
              ["No advertising trackers", "No ad networks, no ad cookies, no selling data, and no third-party analytics."],
            ].map(([k, v]) => (
              <li key={k} className="bg-background p-6 sm:p-8">
                <h3 className="text-xl font-medium">{k}</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{v}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section
          id="collect"
          className="scroll-mt-28"
          eyebrow="What we collect"
          title="Every form, and every field."
          muted
        >
          <p className="max-w-3xl text-lg text-muted-foreground leading-relaxed">
            There are six forms on the site. Below is exactly what each one sends, so you can decide
            field by field whether to fill it in. Nothing is collected from you as you browse.
          </p>

          <div className="mt-12 grid gap-px bg-foreground/10 border border-foreground/10 md:grid-cols-2">
            {forms.map((f) => (
              <div key={f.name} className="card-glow bg-background p-6 sm:p-8 lg:p-10">
                <h3 className="text-2xl font-display">{f.name}</h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">{f.purpose}</p>

                <p className="mt-6 font-mono text-xs uppercase tracking-[0.15em] text-[#eca8d6]">
                  Required
                </p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {f.required.map((item) => (
                    <li
                      key={item}
                      className="rounded-full border border-foreground/15 px-3 py-1.5 text-sm"
                    >
                      {item}
                    </li>
                  ))}
                </ul>

                <p className="mt-5 font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">
                  Optional
                </p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {f.optional.map((item) => (
                    <li
                      key={item}
                      className="rounded-full border border-foreground/12 px-3 py-1.5 text-sm text-muted-foreground"
                    >
                      {item}
                    </li>
                  ))}
                </ul>

                <Link
                  href={f.href}
                  className="mt-6 inline-flex h-11 items-center rounded-full border border-foreground/20 px-5 text-sm hover:bg-foreground/5"
                >
                  Go to the form →
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-12 grid gap-px bg-foreground/10 border border-foreground/10 md:grid-cols-3">
            {[
              [
                "Recorded automatically",
                "Each submission also stores when it arrived and your browser's user-agent string (up to 400 characters). Stewards may add short internal notes and a status while reviewing.",
              ],
              [
                "A hidden anti-spam field",
                "Every form carries one field that people never see. If a bot fills it in, the submission is thrown away and nothing is stored.",
              ],
              [
                "A hashed address, never your IP",
                "To slow down abuse we store a salted SHA-256 hash of the connecting IP address — never the raw address — and prune old entries the next time that address submits.",
              ],
            ].map(([k, v]) => (
              <div key={k} className="bg-background p-6 sm:p-8">
                <h3 className="text-xl font-medium">{k}</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{v}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section
          id="why"
          className="scroll-mt-28"
          eyebrow="Why we collect it"
          title="One purpose per form. Nothing spare."
        >
          <ul className="grid gap-px bg-foreground/10 border border-foreground/10 md:grid-cols-2">
            {[
              ["To review membership", "An application is read to decide whether to invite you to a conversation — nothing else."],
              ["To act on a problem or project", "Submissions are read and framed so they can become real work, or published if you chose that."],
              ["To read and reply", "Contact messages, suggestions, and feedback exist so a person can answer you and improve the site."],
              ["To keep the site usable", "The user-agent string and the hashed IP exist only to recognise and slow down spam and abuse."],
            ].map(([k, v]) => (
              <li key={k} className="bg-background p-6 sm:p-8">
                <h3 className="text-xl font-medium">{k}</h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">{v}</p>
              </li>
            ))}
          </ul>
          <p className="mt-10 max-w-3xl text-lg text-muted-foreground leading-relaxed">
            We do not sell your information, we do not rent it, and we do not use it for advertising.
            We do not build profiles of you across other websites.
          </p>
        </Section>

        <Section
          id="storage"
          className="scroll-mt-28"
          eyebrow="Where it is stored"
          title="One database, on Cloudflare."
          muted
        >
          <div className="grid lg:grid-cols-12 gap-12">
            <div className="lg:col-span-7 space-y-6 text-lg text-muted-foreground leading-relaxed">
              <p>
                The site is a static export served by a Cloudflare Worker, and every form writes to
                a single Cloudflare D1 database (SQLite) bound to that Worker. Rate-limit entries
                live in a separate table in the same database.
              </p>
              <p>
                In other words: your submission is stored on Cloudflare&rsquo;s infrastructure, in a
                database the public cannot reach directly. There is no account and no public login
                on the site — you never create a password here.
              </p>
            </div>
            <div className="lg:col-span-5">
              <div className="card-glow rounded-2xl border border-foreground/12 bg-foreground/[0.02] p-6 sm:p-8">
                <h3 className="text-xl font-medium">The moving parts</h3>
                <ul className="mt-5 space-y-3 text-sm text-muted-foreground leading-relaxed">
                  <li>Cloudflare Worker — runs the site and the form API.</li>
                  <li>Cloudflare D1 — stores submissions and rate-limit hashes.</li>
                  <li>Cloudflare Access — gates the internal admin panel.</li>
                  <li>Optional alerts — a short summary may be emailed or posted to BFG&rsquo;s internal channel if configured.</li>
                </ul>
              </div>
            </div>
          </div>
        </Section>

        <Section
          id="access"
          className="scroll-mt-28"
          eyebrow="Who can see it"
          title="Stewards, by design — and the public, only when you choose."
        >
          <div className="grid gap-px bg-foreground/10 border border-foreground/10 md:grid-cols-2 lg:grid-cols-3">
            {[
              ["BFG stewards", "Read submissions through an internal admin panel protected by Cloudflare Access (Zero Trust). If Access is not configured, the panel fails closed and returns nothing."],
              ["The public — on your terms", "Only a problem you marked Public, once a steward has framed or activated it, appears in the Problem Commons. Approved projects appear in the showcase. Everything else stays internal."],
              ["What the public never sees", "Your email, your name on a problem, internal notes, review timestamps, and the stored user-agent are excluded from public views by default."],
            ].map(([k, v]) => (
              <div key={k} className="bg-background p-6 sm:p-8">
                <h3 className="text-xl font-medium">{k}</h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">{v}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 max-w-3xl text-lg text-muted-foreground leading-relaxed">
            If notifications are switched on, a compact summary of a submission — and, for problems
            and projects, the email address — is sent to BFG&rsquo;s internal alert channel so a
            person notices it quickly. If you left an email, we may also send you a short
            acknowledgement that we received your submission.
          </p>
        </Section>

        <Section
          id="retention"
          className="scroll-mt-28"
          eyebrow="How long we keep it"
          title="Kept while it is useful — and deleted on request."
          muted
        >
          <div className="max-w-3xl space-y-6 text-lg text-muted-foreground leading-relaxed">
            <p>
              To be honest: the site does not yet run on an automatic deletion schedule. A
              submission is kept while it is useful — to review a membership application, to act on
              a problem, or to answer a message.
            </p>
            <p>
              Rate-limit entries are the exception: they are pruned once they are older than the
              one-hour window, the next time that address submits. If it never submits again, they
              remain.
            </p>
            <p className="text-foreground">
              We think a fixed retention period is the right thing to have. It is listed as an open
              item for review at the top of this page, and we would rather say it plainly than
              imply a promise we have not built yet.
            </p>
          </div>
        </Section>

        <Section
          id="deletion"
          className="scroll-mt-28"
          eyebrow="Deleting your data"
          title="Ask us, and we will remove it."
        >
          <div className="grid lg:grid-cols-12 gap-12">
            <div className="lg:col-span-7 space-y-6 text-lg text-muted-foreground leading-relaxed">
              <ol className="space-y-4">
                <li>
                  <span className="font-mono text-sm text-muted-foreground">01</span> Email{" "}
                  <a
                    href={`mailto:${SITE.email}`}
                    className="link-underline break-all text-foreground"
                  >
                    {SITE.email}
                  </a>
                  .
                </li>
                <li>
                  <span className="font-mono text-sm text-muted-foreground">02</span> Tell us the
                  name and email address you used, and roughly when you submitted it.
                </li>
                <li>
                  <span className="font-mono text-sm text-muted-foreground">03</span> A steward
                  deletes the record from the admin panel and confirms it back to you.
                </li>
              </ol>
              <p>
                Deleting a record removes it from the database and, for a public problem or project,
                takes it off the site. It cannot retract copies other people may already have made —
                we can only promise to remove what is ours.
              </p>
            </div>
            <div className="lg:col-span-5">
              <div className="card-glow rounded-2xl border border-foreground/12 bg-foreground/[0.02] p-6 sm:p-8">
                <h3 className="text-xl font-medium">Questions or correction</h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  If anything here is wrong, says more than the site really does, or leaves something
                  out, tell us and we will fix the page.
                </p>
                <a
                  href={`mailto:${SITE.email}`}
                  className="mt-6 inline-flex h-11 items-center rounded-full border border-foreground/20 px-5 text-sm text-foreground hover:bg-foreground/5"
                >
                  {SITE.email}
                </a>
              </div>
            </div>
          </div>
        </Section>

        <Section
          id="trackers"
          className="scroll-mt-28"
          eyebrow="Cookies, analytics and advertising"
          title="No advertising trackers."
          muted
        >
          <div className="max-w-3xl space-y-6 text-lg text-muted-foreground leading-relaxed">
            <p>
              The site runs no advertising trackers and no ad cookies. There is no third-party
              analytics: nothing is sent to Vercel, Google, or any other vendor. The site ships a
              first-party analytics beacon in its code, but it is turned off unless we explicitly
              configure an endpoint for it. If it is ever enabled it would be same-origin only,
              cookie-free, and record just the page path; it honours Do Not Track and Global Privacy
              Control.
            </p>
            <p>
              Public pages set no login cookie, because there is no public login. Cloudflare Access
              may set a session cookie, but only for stewards signing into the internal admin panel.
            </p>
            <p className="text-sm">
              Status: analytics is currently disabled. If we ever enable first-party analytics, we
              will describe exactly what is recorded here before it goes live.
            </p>
          </div>
        </Section>

        <Section id="related" className="scroll-mt-28" eyebrow="Related" title="The other fine print.">
          <div className="flex flex-wrap gap-4">
            <Link
              href="/terms"
              className="hover-lift inline-flex h-14 items-center justify-center rounded-full border border-foreground/20 px-8 text-base hover:bg-foreground/5"
            >
              Terms of use
            </Link>
            <Link
              href="/accessibility"
              className="hover-lift inline-flex h-14 items-center justify-center rounded-full border border-foreground/20 px-8 text-base hover:bg-foreground/5"
            >
              Accessibility
            </Link>
            <Link
              href="/contact"
              className="hover-lift inline-flex h-14 items-center justify-center rounded-full bg-foreground px-8 text-base font-medium text-background hover:bg-foreground/90"
            >
              Contact us
            </Link>
          </div>
          <p className="mt-8 max-w-3xl text-muted-foreground leading-relaxed">
            Your conduct, and ours, is also governed by the community&rsquo;s{" "}
            <Link href="/terms#conduct" className="link-underline text-foreground">
              code of conduct
            </Link>
            , referenced in the terms.
          </p>
        </Section>
      </PageShell>
    </>
  );
}
