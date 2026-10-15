"use client";

import { useEffect, useState, useRef } from "react";
import { Reveal, RevealText } from "@/components/motion/reveal";
import { ArrowDown } from "lucide-react";

const words = ["human", "kind", "humble", "curious"];

export function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      prefersReducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
  }, []);

  useEffect(() => {
    if (prefersReducedMotion.current) return;
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % words.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col justify-center items-start overflow-hidden bg-black">
      {/* Background video */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
          className="w-full h-full object-cover object-center opacity-80"
        >
          <source src="/images/hero-bg.mp4" type="video/mp4" />
        </video>
        {/* Subtle overlay to ensure text readability on the left */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
      </div>

      {/* Subtle grid lines */}
      <div className="absolute inset-0 z-[2] overflow-hidden pointer-events-none opacity-20">
        {[...Array(8)].map((_, i) => (
          <div
            key={`h-${i}`}
            className="absolute h-px bg-white/10"
            style={{
              top: `${12.5 * (i + 1)}%`,
              left: 0,
              right: 0,
            }}
          />
        ))}
        {[...Array(12)].map((_, i) => (
          <div
            key={`v-${i}`}
            className="absolute w-px bg-white/10"
            style={{
              left: `${8.33 * (i + 1)}%`,
              top: 0,
              bottom: 0,
            }}
          />
        ))}
      </div>
      
      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 lg:px-12 py-32 lg:py-40">
        <div className="lg:max-w-[55%]">
        {/* Eyebrow */}
        <Reveal y={14} duration={650}>
          <span className="inline-flex items-center gap-3 text-sm font-mono text-white/60">
            <span className="w-8 h-px bg-white/30" />
            A global community for turning problems into collective action
          </span>
        </Reveal>
        
        {/* Main headline */}
        <Reveal delay={90} y={24} duration={850}>
          <h1 className="text-left text-[clamp(2rem,6vw,7rem)] font-display leading-[0.92] tracking-tight text-white">
            <span className="block whitespace-nowrap">Become more capable,</span>
            <span className="block whitespace-nowrap">
              never less{" "}
              <span className="relative inline-block">
                <RevealText
                  text={words[wordIndex]}
                  as="span"
                  delay={0}
                  stagger={45}
                  blur={16}
                />
              </span>
            </span>
          </h1>
        </Reveal>
        </div>
      </div>
       
      {/* Stats — 3 metrics static, no auto-scroll */}
      <Reveal delay={500} y={16}>
        <div className="absolute bottom-12 left-0 right-0 px-6 lg:px-12">
          <div className="max-w-[1400px] mx-auto flex items-start gap-10 lg:gap-20">
            {[
              { value: "12", label: "dimensions we judge character by" },
              { value: "5", label: "rituals, every week" },
              { value: "1", label: "standard: character before capability" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col gap-2">
                <span className="text-3xl lg:text-4xl font-display text-white">{stat.value}</span>
                <span className="text-xs text-white/50 leading-tight">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Scroll indicator */}
      <Reveal delay={800} y={16}>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40 hover:text-white/60 transition-colors duration-500 animate-bounce-slow">
          <ArrowDown className="w-6 h-6" />
          <span className="font-mono text-xs tracking-widest uppercase">Scroll</span>
        </div>
      </Reveal>

      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(8px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2.5s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}