import type { Metadata } from "next";
import { Navigation } from "@/components/landing/navigation";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { InfrastructureSection } from "@/components/landing/infrastructure-section";
import { MetricsSection } from "@/components/landing/metrics-section";
import { IntegrationsSection } from "@/components/landing/integrations-section";
import { SecuritySection } from "@/components/landing/security-section";
import { DevelopersSection } from "@/components/landing/developers-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { HomepageFaq } from "@/components/landing/homepage-faq";
import { SubscriptionSection } from "@/components/landing/subscription-section";
import { JsonLd, webPageLd } from "@/components/seo/json-ld";
import { SITE, pageMetadata } from "@/lib/site";
import { BreadcrumbList } from "@/components/ui/breadcrumb";

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
      <BreadcrumbList />
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
