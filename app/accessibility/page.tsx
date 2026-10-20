import type { Metadata } from "next";
import Link from "next/link";
import { PageShell, Section } from "@/components/site/page-shell";
import { JsonLd, breadcrumbLd, webPageLd } from "@/components/seo/json-ld";
import { pageMetadata, SITE } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Accessibility",
  description:
    "The Build For Good accessibility statement — our WCAG 2.2 AA target, the measures actually built into the site, the limitations we know about, and how to tell us what's broken.",
  path: "/accessibility",
});

export default function AccessibilityPage() {
  return (
    <>
      <JsonLd
        data={[
          webPageLd({
            path: "/accessibility",
            name: `Accessibility — ${SITE.name}`,
            description:
              "A genuine accessibility statement for the Build For Good website: WCAG 2.2 AA target, measures taken, known limitations, and how to give feedback.",
          }),
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Accessibility", path: "/accessibility" },
          ]),
        ]}
      />
      <PageShell
        eyebrow="Accessibility"
        title="Accessibility, stated honestly."
        lead="We want this site to work for everyone who needs it. This page says what we aim for, what we have actually built, and where we still fall short — so you can judge it yourself."
      >
        <Section
          id="commitment"
          className="scroll-mt-28"
          eyebrow="Our target"
          title="Aim for WCAG 2.2 AA. Say so plainly when we miss."
        >
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Last updated: 2026-10-15
          </p>

          <div className="mt-8 card-glow rounded-2xl border border-foreground/12 bg-foreground/[0.02] p-6 lg:p-8">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              An honest note
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              We use the Web Content Accessibility Guidelines (WCAG) 2.2 Level AA as our target,
              and we build with them in mind. We have{" "}
              <strong className="text-foreground">not completed an independent accessibility audit</strong>,
              so we do not claim full conformance. What follows is a description of what is really
              in the code today, plus the gaps we already know about.
            </p>
          </div>

          <p className="mt-10 max-w-3xl text-lg text-muted-foreground leading-relaxed">
            If something on this site gets in your way, that is a bug worth fixing. The contact
            section at the bottom of this page says exactly how to report it.
          </p>
        </Section>

        <Section
          id="measures"
          className="scroll-mt-28"
          eyebrow="What we have done"
          title="The accessibility work that is actually in the build."
          muted
        >
          <div className="grid gap-px bg-foreground/10 border border-foreground/10 md:grid-cols-2">
            {[
              ["A way past the navigation", "Every page starts with a “Skip to content” link that becomes visible on keyboard focus and jumps to the main content."],
              ["One clear heading per page", "Each page has exactly one top-level heading, with sections and sub-sections nested beneath it in order."],
              ["Real landmarks", "Pages use a main region, header, navigation, and footer rather than a wall of divs, so assistive technology can move between regions."],
              ["Visible keyboard focus", "Interactive elements show a clear focus outline — reinforced across links, buttons, fields, tabs, and menus — so keyboard users can always see where they are."],
              ["Respect for reduced motion", "When your device asks for reduced motion, the site's animations and transitions are cut down and reveal effects show their content immediately."],
              ["Forms that announce themselves", "Fields have real labels; hints and errors are linked to their control; required fields are marked visually and for screen readers; and success or failure is announced and focused."],
              ["Decoration stays decorative", "Decorative graphics and the footer banner are hidden from assistive technology, so they are not read out as meaning."],
              ["Native controls where possible", "Grouped choices use a real fieldset and legend, and native inputs give keyboard behaviour for free."],
              ["Language and colour scheme declared", "Pages declare their language and advertise the dark colour scheme so native controls and browsers match."],
              ["Reflows to a phone", "Layouts collapse to a single column and long email addresses and links are allowed to wrap, so pages fit a narrow screen without sideways scrolling."],
            ].map(([k, v]) => (
              <div key={k} className="bg-background p-6 sm:p-8">
                <h3 className="text-xl font-medium">{k}</h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">{v}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section
          id="limitations"
          className="scroll-mt-28"
          eyebrow="Known limitations"
          title="Where we know we still fall short."
        >
          <ul className="grid gap-px bg-foreground/10 border border-foreground/10 md:grid-cols-2">
            {[
              ["No independent audit yet", "We have not had the site tested by an external accessibility specialist or by people using a wide range of assistive technology. Until we have, conformance is an aim, not a badge."],
              ["Dark theme only", "The site ships a single dark colour scheme. There is no light mode yet, which will not suit everyone."],
              ["Some features need JavaScript", "Form submission and the live Problem Commons and project lists rely on JavaScript. The site's written content is static and readable without it, but those interactive features are not."],
              ["Large decorative display type", "Headings use a large display typeface. Text reflows and can be enlarged, but we have not yet checked every page at the maximum browser zoom."],
              ["The admin panel is out of scope", "This statement covers the public site. The internal stewardship panel behind Cloudflare Access is not part of the public experience and is not covered here."],
              ["Animations are reduced, not individually audited", "We respect the reduced-motion setting globally, but we have not audited every individual animation by hand."],
            ].map(([k, v]) => (
              <li key={k} className="bg-background p-6 sm:p-8">
                <h3 className="text-xl font-medium">{k}</h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">{v}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section
          id="feedback"
          className="scroll-mt-28"
          eyebrow="Feedback"
          title="Tell us what is broken, and we will fix it."
          muted
        >
          <div className="grid lg:grid-cols-12 gap-12">
            <div className="lg:col-span-7 space-y-6 text-lg text-muted-foreground leading-relaxed">
              <p>
                The most useful report names the page, what you were trying to do, what happened,
                and what you were using — your browser, your device, or the assistive technology
                you rely on.
              </p>
              <p>
                You can also leave feedback through the site&rsquo;s{" "}
                <Link href="/contact" className="link-underline text-foreground">
                  contact form
                </Link>{" "}
                and choose &ldquo;Something is broken&rdquo;.
              </p>
              <p>
                We aim to acknowledge an accessibility report quickly and to tell you honestly
                whether and when it will be fixed. No silent queues.
              </p>
            </div>
            <div className="lg:col-span-5">
              <div className="card-glow rounded-2xl border border-foreground/12 bg-foreground/[0.02] p-6 sm:p-8">
                <h3 className="text-xl font-medium">Report an accessibility issue</h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  A person reads every message, usually within 72 hours.
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

        <Section id="related" className="scroll-mt-28" eyebrow="Related" title="The other fine print.">
          <div className="flex flex-wrap gap-4">
            <Link
              href="/privacy"
              className="hover-lift inline-flex h-14 items-center justify-center rounded-full border border-foreground/20 px-8 text-base hover:bg-foreground/5"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="hover-lift inline-flex h-14 items-center justify-center rounded-full border border-foreground/20 px-8 text-base hover:bg-foreground/5"
            >
              Terms of use
            </Link>
            <Link
              href="/contact"
              className="hover-lift inline-flex h-14 items-center justify-center rounded-full bg-foreground px-8 text-base font-medium text-background hover:bg-foreground/90"
            >
              Contact us
            </Link>
          </div>
        </Section>
      </PageShell>
    </>
  );
}
