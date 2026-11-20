import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Navigation } from "@/components/landing/navigation";
import { HeroSection } from "@/components/landing/hero-section";
import { HomepageFaq } from "@/components/landing/homepage-faq";
import { JsonLd, webPageLd } from "@/components/seo/json-ld";
import { SITE, pageMetadata } from "@/lib/site";

const FeaturesSection = dynamic(() => import("@/components/landing/features-section").then((m) => m.FeaturesSection));
const HowItWorksSection = dynamic(() => import("@/components/landing/how-it-works-section").then((m) => m.HowItWorksSection));
const InfrastructureSection = dynamic(() => import("@/components/landing/infrastructure-section").then((m) => m.InfrastructureSection));
const MetricsSection = dynamic(() => import("@/components/landing/metrics-section").then((m) => m.MetricsSection));
const IntegrationsSection = dynamic(() => import("@/components/landing/integrations-section").then((m) => m.IntegrationsSection));
const SecuritySection = dynamic(() => import("@/components/landing/security-section").then((m) => m.SecuritySection));
const DevelopersSection = dynamic(() => import("@/components/landing/developers-section").then((m) => m.DevelopersSection));
const TestimonialsSection = dynamic(() => import("@/components/landing/testimonials-section").then((m) => m.TestimonialsSection));
const PricingSection = dynamic(() => import("@/components/landing/pricing-section").then((m) => m.PricingSection));
const SubscriptionSection = dynamic(() => import("@/components/landing/subscription-section").then((m) => m.SubscriptionSection));

/**
 * The home route keeps the root layout's brand title (`SITE.name — tagline`)
 * but overrides the shared 191-char `SITE.description` with a search-snippet
 * sized variant (120–160 chars). Canonical stays "/" so the landing page and
 * any trailing-slash duplicates resolve to one URL.
 */
const HOME_DESCRIPTION =
  "Build For Good is a global, multidisciplinary community where exceptional people turn meaningful problems into collective action — together.";

export const metadata: Metadata = pageMetadata({
  title: `${SITE.name} — ${SITE.tagline}`,
  description: HOME_DESCRIPTION,
  path: "/",
});

export default function Home() {
  return (
    <main id="main" className="relative min-h-screen overflow-x-hidden">
      <JsonLd
        data={webPageLd({
          path: "/",
          name: `${SITE.name} — ${SITE.tagline}`,
          description: HOME_DESCRIPTION,
        })}
      />
      <Navigation />
      <HeroSection />
      <HomepageFaq />
      <FeaturesSection />
      <HowItWorksSection />
      <InfrastructureSection />
      <MetricsSection />
      <IntegrationsSection />
      <SecuritySection />
      <DevelopersSection />
      <TestimonialsSection />
      <PricingSection />
      <section className="relative max-w-[1400px] mx-auto px-6 lg:px-12 py-12 lg:py-20">
        <SubscriptionSection />
      </section>
    </main>
  );
}
