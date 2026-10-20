import type { Metadata } from "next";
import Link from "next/link";
import { PageShell, Section } from "@/components/site/page-shell";
import { Reveal } from "@/components/motion/reveal";
import { ContactForm } from "@/components/site/contact-form";
import { SuggestionForm } from "@/components/site/suggestion-form";
import { FeedbackForm } from "@/components/site/feedback-form";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { JsonLd, breadcrumbLd, webPageLd } from "@/components/seo/json-ld";
import { pageMetadata, SITE } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description:
    "Message the Build For Good team, suggest an idea, or report a problem. Every message reaches a human — usually within 72 hours.",
  path: "/contact",
});

const contactPageLd = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  "@id": `${SITE.url}/contact#contactpage`,
  url: `${SITE.url}/contact`,
  name: `Contact — ${SITE.name}`,
  isPartOf: { "@id": `${SITE.url}/#website` },
  about: { "@id": `${SITE.url}/#organization` },
  mainEntity: {
    "@type": "ContactPoint",
    "@id": `${SITE.url}/#contactpoint`,
    contactType: "customer support",
    email: SITE.email,
    url: `${SITE.url}/contact`,
    availableLanguage: ["English"],
  },
};

export default function ContactPage() {
  return (
    <>
      <JsonLd
        data={[
          webPageLd({
            path: "/contact",
            name: `Contact — ${SITE.name}`,
            description:
              "Message the Build For Good team, suggest an idea, or report a problem. Every message reaches a human.",
          }),
          contactPageLd,
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Contact", path: "/contact" },
          ]),
        ]}
      />
      <PageShell
        eyebrow="Contact"
        title="Say what needs saying."
        lead="Three doors. One shared inbox. A human at the other end. Reach us, suggest something, or tell us what's broken — pick the door that fits."
      >
        <Section eyebrow="Reach us directly" title="Start with an address, not a maze.">
          <div className="grid md:grid-cols-2 gap-px bg-foreground/10 border border-foreground/10">
            <Reveal y={16}>
              <div className="card-glow bg-background p-6 sm:p-8 lg:p-10 h-full">
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Email
                </p>
                <a
                  href={`mailto:${SITE.email}`}
                  className="link-underline mt-4 inline-flex min-h-11 items-center text-xl md:text-2xl break-all text-foreground"
                >
                  {SITE.email}
                </a>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  Best for anything that doesn't fit a form — partnerships, press,
                  corrections, or a problem you'd rather write in your own words.
                </p>
              </div>
            </Reveal>
            <Reveal y={16} delay={70}>
              <div className="card-glow bg-background p-6 sm:p-8 lg:p-10 h-full">
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  GitHub
                </p>
                <a
                  href={SITE.github}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="link-underline mt-4 inline-flex min-h-11 items-center text-xl md:text-2xl break-all text-foreground"
                >
                  github.com/webuildforgood
                </a>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  The site, the tools, and the issues are in the open. File a bug where
                  the code lives — or read it before you trust us with anything.
                </p>
              </div>
            </Reveal>
          </div>
        </Section>

        <Section eyebrow="Ways to reach us" title="Pick the door that fits." muted>
          <Tabs defaultValue="message" className="gap-12">
            <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-full border border-foreground/10 bg-foreground/[0.02] p-1.5 sm:w-fit">
              <TabsTrigger
                value="message"
                className="h-11 flex-none rounded-full px-5 font-mono text-xs uppercase tracking-[0.18em] data-[state=active]:bg-foreground data-[state=active]:text-background"
              >
                Message us
              </TabsTrigger>
              <TabsTrigger
                value="suggestion"
                className="h-11 flex-none rounded-full px-5 font-mono text-xs uppercase tracking-[0.18em] data-[state=active]:bg-foreground data-[state=active]:text-background"
              >
                Suggest an idea
              </TabsTrigger>
              <TabsTrigger
                value="feedback"
                className="h-11 flex-none rounded-full px-5 font-mono text-xs uppercase tracking-[0.18em] data-[state=active]:bg-foreground data-[state=active]:text-background"
              >
                Report a problem
              </TabsTrigger>
            </TabsList>

            <TabsContent value="message" className="pt-2">
              <div className="mb-12 max-w-2xl">
                <h2 className="text-3xl md:text-4xl font-display leading-tight">
                  Message us
                </h2>
                <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
                  Questions about membership, a problem that needs a human, or something
                  you're not sure where to send. Write plainly and we'll do the same.
                </p>
              </div>
              <ContactForm />
            </TabsContent>

            <TabsContent value="suggestion" className="pt-2">
              <div className="mb-12 max-w-2xl">
                <h2 className="text-3xl md:text-4xl font-display leading-tight">
                  Suggest an idea
                </h2>
                <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
                  An activity worth running, a discipline we're missing, a way to make the
                  community better. Rough ideas are welcome — they're easier to shape than
                  finished ones.
                </p>
              </div>
              <SuggestionForm />
            </TabsContent>

            <TabsContent value="feedback" className="pt-2">
              <div className="mb-12 max-w-2xl">
                <h2 className="text-3xl md:text-4xl font-display leading-tight">
                  Report a problem
                </h2>
                <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
                  Something broken, confusing, slow, or wrong — tell us. Sharp criticism
                  is welcome; it's how the site earns the trust of the people using it.
                </p>
              </div>
              <FeedbackForm />
            </TabsContent>
          </Tabs>
        </Section>

        <Section>
          <div className="grid lg:grid-cols-12 gap-12 items-end">
            <Reveal y={20} className="lg:col-span-8">
              <p className="font-mono text-sm uppercase tracking-widest text-muted-foreground mb-6">
                What to expect
              </p>
              <p className="text-3xl md:text-5xl font-display leading-[1.02] max-w-3xl">
                A person reads it. Usually within 72 hours. Never a form letter.
              </p>
            </Reveal>
            <Reveal y={20} delay={100} className="lg:col-span-4">
              <p className="text-muted-foreground leading-relaxed">
                We don't share what you send us, we don't add you to a list you didn't
                ask for, and we're happy to delete a message and its replies on request.
              </p>
              <Link
                href="/membership"
                className="link-underline mt-6 inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground"
              >
                Looking to join instead? See membership →
              </Link>
            </Reveal>
          </div>
        </Section>
      </PageShell>
    </>
  );
}
