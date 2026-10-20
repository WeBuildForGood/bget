"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowRight, Check, Zap } from "lucide-react";
import ApplyModal from "@/components/membership/apply-modal";
import ProblemSubmitModal from "@/components/membership/problem-submit-modal";

const plans = [
  {
    name: "Bring a problem",
    description: "Open to anyone, anywhere, in any field",
    features: [
      "Any problem, any sector",
      "A human answer within 72 hours",
      "Framed honestly, with a reason",
      "Reviewed against public criteria",
      "Never shared unless you allow it",
    ],
    cta: "Start Here",
    href: "/problems",
    highlight: false,
  },
  {
    name: "Join Build For Good",
    description: "For exceptional people who want to build together",
    features: [
      "Application → conversation → 30-day trial",
      "Character is the gate, not your CV",
      "Weekly rituals and real projects",
      "Mentorship and genuine help",
      "One referral slot per quarter",
    ],
    cta: "Join Build For Good",
    href: "/membership#apply",
    highlight: true,
  },
  {
    name: "Build For Good Labs",
    description: "For the teams that form around a problem",
    features: [
      "Multidisciplinary project teams",
      "Research, prototype, test, deploy",
      "Open source, nonprofit, or startup",
      "Credit recorded, permanently",
      "Impact measured and shared",
    ],
    cta: "See how Labs work",
    href: "/problems",
    highlight: false,
  },
];

export function PricingSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="pricing" ref={sectionRef} className="relative py-20 lg:py-40">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Header - Dramatic offset */}
        <div className="grid lg:grid-cols-12 gap-8 mb-12 lg:mb-20">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-8">
              <span className="w-12 h-px bg-foreground/30" />
              Three doors
            </span>
            <h2 className={`text-4xl sm:text-6xl md:text-7xl lg:text-[128px] font-display tracking-tight leading-[0.9] transition-all duration-1000 break-words ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}>
              Where would
              <br />
              <span className="text-stroke">you start?</span>
            </h2>
          </div>
          
          <div className="lg:col-span-5 relative p-0 h-64 sm:h-96 lg:h-auto">
            {/* Whale image */}
            <div className={`absolute inset-0 pointer-events-none transition-all duration-1000 delay-100 ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}>
              <picture className="contents">
                <source srcSet="/images/whale.avif" type="image/avif" />
                <img
                  src="/images/whale.webp"
                  alt=""
                  aria-hidden="true"
                  width={1600}
                  height={1031}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-contain object-center"
                />
              </picture>
            </div>

          </div>
        </div>

        {/* Pricing cards - Horizontal layout with overlap */}
        <div className="relative">
          <div className="grid lg:grid-cols-3 gap-4 lg:gap-0">
            {plans.map((plan, index) => (
              <div
                key={plan.name}
                className={`relative bg-background border transition-all duration-700 ${
                  plan.highlight 
                    ? "border-foreground lg:-mx-2 lg:z-10 lg:scale-105" 
                    : "border-foreground/10 lg:first:-mr-2 lg:last:-ml-2"
                } ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                {/* Popular badge */}
                {plan.highlight && (
                  <div className="absolute -top-4 left-8 right-8 flex justify-center">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background text-xs font-mono uppercase tracking-widest">
                      <Zap className="w-3 h-3" />
                      Start here
                    </span>
                  </div>
                )}

                <div className="p-6 sm:p-8 lg:p-10">
                  {/* Plan header */}
                  <div className="mb-8 pb-8 border-b border-foreground/10">
                    <span className="font-mono text-xs text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className="text-2xl lg:text-3xl font-display mt-2">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-10">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="w-4 h-4 text-[#eca8d6] mt-0.5 shrink-0" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  {index === 0 ? (
                    <button
                      onClick={() => setIsSubmitOpen(true)}
                      className={`w-full py-4 flex items-center justify-center gap-2 text-sm font-medium transition-all group ${
                        plan.highlight
                          ? "bg-foreground text-background hover:bg-foreground/90"
                          : "border border-foreground/20 text-foreground hover:border-foreground hover:bg-foreground/5"
                      }`}
                    >
                      {plan.cta}
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  ) : index === 1 ? (
                    <button
                      onClick={() => setIsApplyOpen(true)}
                      className={`w-full py-4 flex items-center justify-center gap-2 text-sm font-medium transition-all group ${
                        plan.highlight
                          ? "bg-foreground text-background hover:bg-foreground/90"
                          : "border border-foreground/20 text-foreground hover:border-foreground hover:bg-foreground/5"
                      }`}
                    >
                      {plan.cta}
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  ) : (
                    <a
                      href={plan.href}
                      className={`w-full py-4 flex items-center justify-center gap-2 text-sm font-medium transition-all group ${
                        plan.highlight
                          ? "bg-foreground text-background hover:bg-foreground/90"
                          : "border border-foreground/20 text-foreground hover:border-foreground hover:bg-foreground/5"
                      }`}
                    >
                      {plan.cta}
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom note with icons */}
        <div className={`mt-12 lg:mt-20 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 pt-8 lg:pt-12 border-t border-foreground/10 transition-all duration-1000 delay-500 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}>
          <div className="flex flex-wrap gap-4 sm:gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2 min-h-11">
              <Check className="w-4 h-4 text-[#eca8d6]" />
              Character before capability
            </span>
            <span className="flex items-center gap-2 min-h-11">
              <Check className="w-4 h-4 text-[#eca8d6]" />
              Contribute more than you take
            </span>
            <span className="flex items-center gap-2 min-h-11">
              <Check className="w-4 h-4 text-[#eca8d6]" />
              Leave it better than you found it
            </span>
          </div>
          <a href="/manifesto" className="inline-flex items-center text-sm underline underline-offset-4 hover:text-foreground transition-colors min-h-11">
            Read the full manifesto
          </a>
        </div>
      </div>

      <style jsx>{`
        .text-stroke {
          -webkit-text-stroke: 1.5px currentColor;
          -webkit-text-fill-color: transparent;
        }
      `}</style>

      {/* Modals */}
      <ApplyModal open={isApplyOpen} onOpenChange={setIsApplyOpen} />
      <ProblemSubmitModal open={isSubmitOpen} onOpenChange={setIsSubmitOpen} />
    </section>
  );
}
