"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight } from "lucide-react";
import { usePublicMetrics, formatMetric } from "./use-public-metrics";

const words = ["human", "kind", "humble", "curious"];

type HeroStat = {
  value: string;
  label: string;
  mobileLabel: string;
};

/**
 * Palette the rotating headline word sweeps through while it reveals. The sweep
 * runs across the letter positions, then every letter settles back to white.
 */
const WORD_COLORS = ["#eca8d6", "#a78bfa", "#67e8f9", "#fbbf24", "#eca8d6"];

function lerp(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}

function hexToRgb(hex: string) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

/** Colour for letter `i`, interpolated along the palette. */
function colourAt(i: number, length: number) {
  const pos = (i / Math.max(length - 1, 1)) * (WORD_COLORS.length - 1);
  const lo = Math.floor(pos);
  const hi = Math.min(lo + 1, WORD_COLORS.length - 1);
  const t = pos - lo;
  const [r1, g1, b1] = hexToRgb(WORD_COLORS[lo]);
  const [r2, g2, b2] = hexToRgb(WORD_COLORS[hi]);
  return `rgb(${lerp(r1, r2, t)},${lerp(g1, g2, t)},${lerp(b1, b2, t)})`;
}

/**
 * Blur + colour reveal for the rotating hero word. Each letter fades/blurs in on
 * a stagger, painted with a gradient that shifts across the word; once the word
 * has settled every letter eases back to crisp white.
 */
function BlurWord({ word, reducedMotion }: { word: string; reducedMotion: boolean }) {
  const letters = word.split("");
  const STAGGER = 40; // ms between letters
  const DURATION = 400; // ms per-letter blur/opacity fade
  const HOLD = STAGGER * letters.length + DURATION + 150; // ms before colour settles to white

  const [states, setStates] = useState(() =>
    letters.map(() => ({ opacity: reducedMotion ? 1 : 0, blur: reducedMotion ? 0 : 16 }))
  );
  const [coloured, setColoured] = useState(!reducedMotion);

  useEffect(() => {
    if (reducedMotion) {
      setStates(letters.map(() => ({ opacity: 1, blur: 0 })));
      setColoured(false);
      return;
    }

    setStates(letters.map(() => ({ opacity: 0, blur: 16 })));
    setColoured(true);

    let rafId: number | null = null;
    let start: number | null = null;
    const totalDuration = STAGGER * letters.length + DURATION;

    const tick = (now: number) => {
      if (start === null) start = now;
      const elapsed = now - start;

      const nextStates = letters.map((_, i) => {
        const letterOffset = i * STAGGER;
        if (elapsed < letterOffset) {
          return { opacity: 0, blur: 16 };
        }
        const letterElapsed = elapsed - letterOffset;
        if (letterElapsed >= DURATION) {
          return { opacity: 1, blur: 0 };
        }
        const progress = letterElapsed / DURATION;
        const eased = 1 - Math.pow(1 - progress, 3);
        return { opacity: eased, blur: 16 * (1 - eased) };
      });

      setStates(nextStates);

      if (elapsed < totalDuration) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);

    const colourTimer = setTimeout(() => {
      setColoured(false);
    }, HOLD);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      clearTimeout(colourTimer);
    };
  }, [word, reducedMotion]);

  return (
    <span aria-label={word} className="inline-block">
      {letters.map((char, i) => {
        const state = reducedMotion
          ? { opacity: 1, blur: 0 }
          : states[i] ?? { opacity: 1, blur: 0 };
        return (
          <span
            key={`${char}-${i}`}
            aria-hidden="true"
            style={{
              display: "inline-block",
              opacity: state.opacity,
              filter: state.blur ? `blur(${state.blur}px)` : "none",
              color: !reducedMotion && coloured ? colourAt(i, letters.length) : "white",
              transition: "color 0.5s ease-out",
            }}
          >
            {char}
          </span>
        );
      })}
    </span>
  );
}

export function HeroSection() {
  const [mounted, setMounted] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false
  );
  const { metrics, status: metricsStatus } = usePublicMetrics();
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % words.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [reducedMotion]);

  // Defer loading the hero video until the window `load` event has fired and the
  // main thread is idle — i.e. strictly after the LCP element has painted.
  useEffect(() => {
    if (typeof window === "undefined" || reducedMotion) return;
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    let idleId: number | undefined;
    let capId: ReturnType<typeof setTimeout> | undefined;
    let done = false;

    const start = () => {
      if (done) return;
      done = true;
      if (typeof w.requestIdleCallback === "function") {
        idleId = w.requestIdleCallback(() => setVideoReady(true), { timeout: 2000 });
      } else {
        setVideoReady(true);
      }
    };

    if (document.readyState === "complete") {
      start();
    } else {
      window.addEventListener("load", start, { once: true });
      capId = setTimeout(start, 3500);
    }

    return () => {
      window.removeEventListener("load", start);
      if (idleId !== undefined) w.cancelIdleCallback?.(idleId);
      if (capId !== undefined) clearTimeout(capId);
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (!videoReady) return;
    const video = videoRef.current;
    if (!video) return;
    video.load();
    const played = video.play();
    if (played && typeof played.catch === "function") played.catch(() => {});
  }, [videoReady]);

  // Real aggregate-only metrics from `/api/metrics`.
  const heroStats: HeroStat[] = [
    {
      value:
        metricsStatus === "loading"
          ? "…"
          : formatMetric(metrics?.problems_public_open),
      label: "problems to solve",
      mobileLabel: "to solve",
    },
    {
      value:
        metricsStatus === "loading"
          ? "…"
          : formatMetric(metrics?.projects_approved),
      label: "projects active",
      mobileLabel: "projects",
    },
    {
      value:
        metricsStatus === "loading"
          ? "…"
          : formatMetric(metrics?.problems_total),
      label: "problems received",
      mobileLabel: "received",
    },
  ];

  return (
    <section
      style={{ minHeight: "100svh" }}
      className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-black pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]"
    >
      <noscript>
        <style>{`
          .hero-animate { opacity: 1 !important; transform: none !important; }
        `}</style>
      </noscript>

      {/* Background video & poster */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          poster="/images/hero-poster.webp"
          width={1280}
          height={720}
          aria-hidden="true"
          className="w-full h-full object-cover object-[70%_center] sm:object-center opacity-75 lg:opacity-85"
        >
          {videoReady && <source src="/images/hero-bg.mp4" type="video/mp4" />}
        </video>

        {/* Readability gradients: full veil on mobile, subtle directional vignette on desktop */}
        <div className="absolute inset-0 bg-black/60 lg:bg-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/80 lg:hidden" />
        <div className="hidden lg:block absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-black/20" />
        <div className="hidden lg:block absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/85" />
      </div>

      {/* Subtle architectural grid lines */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none opacity-[0.12]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.25) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.25) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
          maskImage: "radial-gradient(ellipse at 50% 50%, black 40%, transparent 85%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 50%, black 40%, transparent 85%)",
        }}
        aria-hidden="true"
      />

      {/* Main hero inner container */}
      <div className="relative z-10 flex flex-1 w-full max-w-[1400px] mx-auto flex-col justify-between px-6 sm:px-8 lg:px-12 pt-24 sm:pt-28 pb-6 lg:pt-32 lg:pb-8">
        
        {/* Main Content (Vertically centered within available space, never overlapping bottom stats) */}
        <div className="w-full lg:max-w-[65%] xl:max-w-[58%] my-auto py-2 sm:py-4 lg:py-6">
          
          {/* Eyebrow */}
          <div
            className={`hero-animate transition-all duration-700 ease-out ${
              mounted || reducedMotion ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
          >
            <span className="inline-flex items-center gap-3 font-mono text-xs sm:text-sm text-white/70 tracking-wider">
              <span className="h-px w-6 sm:w-8 shrink-0 bg-white/40" />
              <span>A global community turning problems into collective action</span>
            </span>
          </div>

          {/* Headline (H1) with rotating BlurWord */}
          <div
            className={`hero-animate transition-all duration-700 delay-100 ease-out ${
              mounted || reducedMotion ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            }`}
          >
            <h1 className="mt-3.5 sm:mt-4 text-left font-display text-[clamp(1.75rem,7vw,2.5rem)] lg:text-[clamp(2.75rem,4.4vw,4.75rem)] font-bold tracking-tight text-white leading-[1.05] lg:leading-[0.98]">
              <span className="block sm:whitespace-nowrap">Become more capable,</span>
              <span className="block sm:whitespace-nowrap mt-1 lg:mt-2">
                never less{" "}
                <span className="relative inline-block text-white">
                  <BlurWord
                    key={words[wordIndex]}
                    word={words[wordIndex]}
                    reducedMotion={reducedMotion}
                  />
                </span>
              </span>
            </h1>
          </div>

          {/* Subtitle description paragraph placed directly under H1 */}
          <div
            className={`hero-animate transition-all duration-700 delay-200 ease-out ${
              mounted || reducedMotion ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            }`}
          >
            <p className="mt-4 sm:mt-5 text-left text-white/85 leading-relaxed text-sm sm:text-base lg:text-lg max-w-xl">
              We bring exceptional people together to solve meaningful problems — not just
              software, but health, energy, water, education, and climate challenges that
              matter to real communities.
            </p>
          </div>

          {/* Action buttons (responsive single block: stacked on mobile, row on tablet/desktop) */}
          <div
            className={`hero-animate transition-all duration-700 delay-300 ease-out ${
              mounted || reducedMotion ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            }`}
          >
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <Link
                href="/membership"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-sm bg-white text-black transition-all duration-200 hover:bg-neutral-100 hover:shadow-[0_0_24px_rgba(255,255,255,0.22)] active:scale-[0.98] group"
              >
                <span>Apply to join</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>

              <Link
                href="/problems"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-medium text-sm border border-white/20 bg-white/[0.05] backdrop-blur-md text-white transition-all duration-200 hover:bg-white/10 hover:border-white/40 active:scale-[0.98] group"
              >
                <span>Bring a problem</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile / Tablet Stats & Scroll Card */}
        <div
          className={`hero-animate lg:hidden w-full mt-6 sm:mt-8 transition-all duration-700 delay-400 ease-out ${
            mounted || reducedMotion ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          <div className="rounded-2xl border border-white/15 bg-white/[0.04] backdrop-blur-md p-3.5 sm:p-4 shadow-lg">
            <dl className="grid grid-cols-3 divide-x divide-white/15 text-center min-w-0">
              {heroStats.map((stat, i) => (
                <div
                  key={`${stat.label}-${i}`}
                  className="flex flex-col items-center gap-1 px-1 min-w-0"
                >
                  <dt className="font-display text-xl sm:text-2xl font-bold leading-tight text-white tabular-nums truncate w-full">
                    {stat.value}
                  </dt>
                  <dd className="font-mono text-[10px] sm:text-xs text-white/70 font-medium tracking-wide uppercase truncate w-full">
                    {stat.mobileLabel}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Mobile Scroll Indicator */}
          <div className="mt-3.5 flex justify-center">
            <a
              href="#faq"
              aria-label="Scroll to explore"
              className="inline-flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors py-1 cursor-pointer"
            >
              <ArrowDown className="h-3.5 w-3.5 animate-bounce-slow text-white/50" />
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/50">Scroll</span>
            </a>
          </div>
        </div>

        {/* Desktop Stats & Scroll Bottom Row (in normal flow — zero risk of overlap!) */}
        <div
          className={`hero-animate hidden lg:flex w-full items-center justify-between border-t border-white/15 pt-6 mt-auto transition-all duration-700 delay-400 ease-out ${
            mounted || reducedMotion ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          <div className="flex items-center gap-12 xl:gap-16">
            {heroStats.map((stat, i) => (
              <div key={`${stat.label}-${i}`} className="flex flex-col gap-1 text-left">
                <span className="font-display text-3xl xl:text-4xl font-bold tracking-tight text-white tabular-nums">
                  {stat.value}
                </span>
                <span className="font-mono text-xs text-white/60 tracking-wider uppercase">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

          {/* Desktop Scroll Indicator */}
          <a
            href="#faq"
            aria-label="Scroll to learn more"
            className="group inline-flex items-center gap-2.5 text-white/50 hover:text-white transition-colors duration-300 cursor-pointer"
          >
            <span className="font-mono text-xs uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">
              Scroll
            </span>
            <ArrowDown className="h-4 w-4 animate-bounce-slow text-white/60 group-hover:text-white transition-colors" />
          </a>
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2.5s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-bounce-slow {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}
