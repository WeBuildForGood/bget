import type { Metadata } from "next";
import Link from "next/link";
import { PageShell, Section } from "@/components/site/page-shell";
import { JsonLd, breadcrumbLd, webPageLd } from "@/components/seo/json-ld";
import { pageMetadata, SITE } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Terms",
  description:
    "Reasonable terms for using the Build For Good website and taking part in the community — eligibility, conduct, what happens to what you submit, acceptable use, and liability.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <>
      <JsonLd
        data={[
          webPageLd({
            path: "/terms",
            name: `Terms — ${SITE.name}`,
            description:
              "Terms for using the Build For Good website and taking part in the community: eligibility, conduct, submissions, acceptable use, and liability.",
          }),
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Terms", path: "/terms" },
          ]),
        ]}
      />
      <PageShell
        eyebrow="Terms"
        title="Terms for taking part."
        lead="The rules of the road for using this site and joining the community. Written to be read, not to be impressive — and kept short on purpose."
      >
        <Section
          id="overview"
          className="scroll-mt-28"
          eyebrow="Start here"
          title="The short version."
        >
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Last updated: 2026-10-15
          </p>

          <div className="mt-8 card-glow rounded-2xl border border-[#fbbf24]/40 bg-[#fbbf24]/[0.06] p-6 lg:p-8">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#fbbf24]">
              Note — needs human / legal review
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              These terms describe how the site is intended to work and are written in plain
              language by the team behind it. They are{" "}
              <strong className="text-foreground">not legal advice</strong> and have not been
              reviewed by a lawyer. In particular, the age-eligibility line and the exact wording of
              the submission licence need a professional review before they can be relied on as
              binding. If you need certainty, ask us before you rely on a clause.
            </p>
          </div>

          <ul className="mt-10 grid gap-px bg-foreground/10 border border-foreground/10 sm:grid-cols-3">
            {[
              ["Use it fairly", "Take part honestly, don't abuse the site or the people on it."],
              ["You keep your work", "Your submissions stay yours; you let us review and, if you choose, publish them."],
              ["It's provided as-is", "We do our best, but we can't promise the site will always be perfect or available."],
            ].map(([k, v]) => (
              <li key={k} className="bg-background p-6 sm:p-8">
                <h3 className="text-xl font-medium">{k}</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{v}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section
          id="eligibility"
          className="scroll-mt-28"
          eyebrow="Eligibility"
          title="Who these terms are for."
          muted
        >
          <div className="max-w-3xl space-y-6 text-lg text-muted-foreground leading-relaxed">
            <p>
              By using this website you agree to these terms. If you do not agree with them, please
              do not use the site.
            </p>
            <p>
              You must be old enough to enter into an agreement and to use the site lawfully where
              you live. Submitting a problem to the Problem Commons does not require membership;
              membership is granted only through the application-and-conversation process described
              on the{" "}
              <Link href="/membership" className="link-underline text-foreground">
                membership page
              </Link>
              .
            </p>
            <p className="text-sm">
              Open item for review: a specific minimum age has not been set. Until it is, we take it
              as it comes and will remove anything a guardian asks us to remove.
            </p>
          </div>
        </Section>

        <Section
          id="conduct"
          className="scroll-mt-28"
          eyebrow="Conduct"
          title="How we expect people to behave."
        >
          <div className="grid lg:grid-cols-12 gap-12">
            <div className="lg:col-span-7 space-y-6 text-lg text-muted-foreground leading-relaxed">
              <p>
                Taking part here means accepting the community&rsquo;s Contributor Covenant Code of
                Conduct (version 2.1). It asks for empathy, respect for differing views, graceful
                feedback, and taking responsibility for mistakes — and it rules out harassment,
                personal attacks, and publishing other people&rsquo;s private information without
                consent.
              </p>
              <p>
                Conduct is defined and enforced by the community&rsquo;s stewards, following the
                published enforcement ladder: a private correction, then a warning, then a temporary
                ban, and finally a permanent ban.
              </p>
              <p>
                Reports can be sent to the enforcement address named in the code of conduct, or to{" "}
                <a
                  href={`mailto:${SITE.email}`}
                  className="link-underline break-all text-foreground"
                >
                  {SITE.email}
                </a>
                . Complaints are reviewed and investigated fairly, and the reporter&rsquo;s privacy
                is respected.
              </p>
            </div>
            <div className="lg:col-span-5">
              <div className="card-glow rounded-2xl border border-foreground/12 bg-foreground/[0.02] p-6 sm:p-8">
                <h3 className="text-xl font-medium">Read the full code</h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  The complete Code of Conduct, including the enforcement guidelines, lives in the
                  open repository.
                </p>
                <a
                  href={`${SITE.github}/blob/main/CODE_OF_CONDUCT.md`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-6 inline-flex h-11 items-center rounded-full border border-foreground/20 px-5 text-sm text-foreground hover:bg-foreground/5"
                >
                  CODE_OF_CONDUCT.md →
                </a>
              </div>
            </div>
          </div>
        </Section>

        <Section
          id="submissions"
          className="scroll-mt-28"
          eyebrow="What you submit"
          title="Your work stays yours. You choose who sees it."
          muted
        >
          <div className="max-w-3xl space-y-6 text-lg text-muted-foreground leading-relaxed">
            <p>
              You keep ownership of everything you submit — applications, problems, projects,
              suggestions, feedback, and messages.
            </p>
            <p>
              By submitting, you give Build For Good permission to store it, to read it, and to
              share it internally with the stewards who review it. For a problem you mark{" "}
              <em className="not-italic text-foreground">Public</em>, and for a project once a
              person approves it, you also give us permission to publish it on this site. A problem
              you mark review-only or private is never published or quoted.
            </p>
            <p>
              Only submit things you have the right to share. Do not include someone else&rsquo;s
              private information without their consent.
            </p>
            <p className="text-sm">
              Open item for review: the wording above should be confirmed by a lawyer as the
              submission licence, including what happens to material after it is published.
            </p>
          </div>
        </Section>

        <Section
          id="acceptable-use"
          className="scroll-mt-28"
          eyebrow="Acceptable use"
          title="What not to do here."
        >
          <ul className="grid gap-px bg-foreground/10 border border-foreground/10 md:grid-cols-2">
            {[
              ["No spam or flooding", "Don't automate submissions or work around the site's rate limits."],
              ["No abuse of people", "Harassment, threats, hate, and targeted cruelty are grounds for removal under the code of conduct."],
              ["Nothing unlawful", "Don't use the site to break the law or to plan harm."],
              ["Don't impersonate", "Don't pretend to be someone else, or misrepresent who you are."],
              ["Don't attack the site", "No attempts to break, overload, or gain unauthorised access to the site or its admin panel."],
              ["No scraping for resale", "Don't harvest content or personal data for resale or unrelated profiling."],
            ].map(([k, v]) => (
              <li key={k} className="bg-background p-6 sm:p-8">
                <h3 className="text-xl font-medium">{k}</h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">{v}</p>
              </li>
            ))}
          </ul>
          <p className="mt-10 max-w-3xl text-lg text-muted-foreground leading-relaxed">
            We may remove content, decline a submission, or revoke access where it is used in ways
            that break these terms or the code of conduct.
          </p>
        </Section>

        <Section
          id="code-licence"
          className="scroll-mt-28"
          eyebrow="Code and content"
          title="The software is open. The name is not a free-for-all."
          muted
        >
          <div className="grid lg:grid-cols-12 gap-12">
            <div className="lg:col-span-7 space-y-6 text-lg text-muted-foreground leading-relaxed">
              <p>
                The source code in the Build For Good repository is released under the MIT License,
                which lets you use, copy, modify, and redistribute the software under its terms.
              </p>
              <p>
                That licence covers the software. It does not grant rights to the &ldquo;Build For
                Good&rdquo; name, the logo, or the community&rsquo;s written content. Please
                don&rsquo;t use them to suggest an affiliation that doesn&rsquo;t exist.
              </p>
            </div>
            <div className="lg:col-span-5">
              <div className="card-glow rounded-2xl border border-foreground/12 bg-foreground/[0.02] p-6 sm:p-8">
                <h3 className="text-xl font-medium">Read the licence</h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  The full MIT License text is in the repository.
                </p>
                <a
                  href={`${SITE.github}/blob/main/LICENSE`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-6 inline-flex h-11 items-center rounded-full border border-foreground/20 px-5 text-sm text-foreground hover:bg-foreground/5"
                >
                  LICENSE →
                </a>
              </div>
            </div>
          </div>
        </Section>

        <Section
          id="availability"
          className="scroll-mt-28"
          eyebrow="Availability and changes"
          title="The site can change, and so can these terms."
        >
          <div className="max-w-3xl space-y-6 text-lg text-muted-foreground leading-relaxed">
            <p>
              The site is provided free of charge and on an &ldquo;as is&rdquo; basis. We aim to
              keep it running and accurate, but we cannot promise it will always be available or
              free of errors.
            </p>
            <p>
              We may change, pause, or retire parts of the site, and we may update these terms.
              When we do, we will change the &ldquo;last updated&rdquo; date at the top of this page.
              Continuing to use the site after a change means you accept the updated terms.
            </p>
            <p>
              Some links go to services we do not run — GitHub, for example. Those sites have their
              own terms and privacy practices, and listing them is not an endorsement.
            </p>
          </div>
        </Section>

        <Section
          id="liability"
          className="scroll-mt-28"
          eyebrow="Liability"
          title="What we are, and aren't, responsible for."
          muted
        >
          <div className="max-w-3xl space-y-6 text-lg text-muted-foreground leading-relaxed">
            <p>
              To the fullest extent the law allows, Build For Good and the people who steward it
              provide the site and the community without warranties of any kind, and are not liable
              for indirect or consequential loss arising from your use of the site — including loss
              of data, opportunity, or goodwill.
            </p>
            <p>
              Nothing in these terms is intended to exclude or limit any liability that cannot
              lawfully be excluded or limited. If a clause here is unenforceable, the rest of the
              terms still stand.
            </p>
            <p className="text-sm">
              Open item for review: a jurisdiction and a governing-law clause have deliberately not
              been invented. A lawyer should set both.
            </p>
          </div>
        </Section>

        <Section id="related" className="scroll-mt-28" eyebrow="Related" title="The other fine print.">
          <div className="flex flex-wrap gap-4">
            <Link
              href="/privacy"
              className="hover-lift inline-flex h-14 items-center justify-center rounded-full border border-foreground/20 px-8 text-base hover:bg-foreground/5"
            >
              Privacy
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
            Questions about these terms, or about a submission? Write to{" "}
            <a href={`mailto:${SITE.email}`} className="link-underline break-all text-foreground">
              {SITE.email}
            </a>
            .
          </p>
        </Section>
      </PageShell>
    </>
  );
}
