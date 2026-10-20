"use client";

import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/motion/reveal";
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
 * has settled every letter eases back to white.
 */
function BlurWord({ word, reducedMotion }: { word: string; reducedMotion: boolean }) {
  const letters = word.split("");
  const STAGGER = 45; // ms between letters
  const DURATION = 500; // ms per-letter blur/opacity fade
  const HOLD = STAGGER * letters.length + DURATION + 200; // ms before colour fades out

  const [states, setStates] = useState(() => letters.map(() => ({ opacity: 0, blur: 18 })));
  const [coloured, setColoured] = useState(true);

  useEffect(() => {
    if (reducedMotion) return;

    setStates(letters.map(() => ({ opacity: 0, blur: 18 })));
    setColoured(true);

    const frames: number[] = [];
    const timers: ReturnType<typeof setTimeout>[] = [];

    letters.forEach((_, i) => {
      const timer = setTimeout(() => {
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min((now - start) / DURATION, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setStates((prev) => {
            const next = prev.slice();
            next[i] = { opacity: eased, blur: 18 * (1 - eased) };
            return next;
          });
          if (progress < 1) frames.push(requestAnimationFrame(tick));
        };
        frames.push(requestAnimationFrame(tick));
      }, i * STAGGER);
      timers.push(timer);
    });

    timers.push(setTimeout(() => setColoured(false), HOLD));

    return () => {
      frames.forEach(cancelAnimationFrame);
      timers.forEach(clearTimeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word, reducedMotion]);

  return (
    <span aria-label={word} className="inline-block">
      {letters.map((char, i) => {
        const state = reducedMotion ? { opacity: 1, blur: 0 } : states[i] ?? { opacity: 0, blur: 18 };
        return (
          <span
            key={`${char}-${i}`}
            aria-hidden="true"
            style={{
              display: "inline-block",
              opacity: state.opacity,
              filter: state.blur ? `blur(${state.blur}px)` : "none",
              color: !reducedMotion && coloured ? colourAt(i, letters.length) : "white",
              transition: "color 0.4s ease",
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
  const [isVisible, setIsVisible] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const { metrics, status: metricsStatus } = usePublicMetrics();
  // The hero background video is by far the heaviest asset on the page, so it is
  // not fetched during the critical path. We show a lightweight poster image
  // immediately and only pull the video down once the browser is idle.
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setIsVisible(true);
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
    }, 2500);
    return () => clearInterval(interval);
  }, [reducedMotion]);

  // Defer loading the hero video until the window `load` event has fired and the
  // main thread is idle — i.e. strictly after the LCP element has painted. A
  // hard timeout caps the wait so the video still starts on slow connections.
  // Users who prefer reduced motion never download it at all; they just see the
  // poster, which keeps first paint cheap on every device.
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
      // Safety net: never wait more than 3.5s for `load` before starting.
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

  // Real, aggregate-only metrics from `/api/metrics` (shared, deduped fetch).
  // While the request is in flight we show "…"; if it fails, `formatMetric`
  // yields "—". We never print a fabricated number.
  const heroStats: HeroStat[] = [
    {
      value:
        metricsStatus === "loading"
          ? "…"
          : formatMetric(metrics?.problems_public_open),
      label: "problems to solve",
      mobileLabel: "problems to solve",
    },
    {
      value:
        metricsStatus === "loading"
          ? "…"
          : formatMetric(metrics?.projects_approved),
      label: "projects",
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
      // `100svh` tracks the *smallest* viewport (browser chrome shown), so the
      // hero never hides its bottom row behind mobile browser UI. The inline
      // declaration is ignored — falling back to the `min-h-screen` class
      // (100vh) — on engines that predate `svh` units.
      style={{ minHeight: "100svh" }}
      className="relative min-h-screen flex flex-col overflow-hidden bg-black pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]"
    >
      {/* Background video */}
      <div className="absolute inset-0 z-0">
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
          className="w-full h-full object-cover object-center opacity-80"
        >
          {videoReady && <source src="/images/hero-bg.mp4" type="video/mp4" />}
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

      {/*
        One layout tree, two compositions:
        · Mobile (<lg): a full-height column spread top-to-bottom — eyebrow +
          headline pinned high, stat bar + scroll cue pinned low — so there is
          never a dead gap under the content.
        · Desktop (lg+): the headline block is centred and the stats / scroll cue
          float above the bottom edge.
        There is deliberately a single <h1>: the mobile-only stat bar and the
        desktop-only floating stats are separate, but the heading itself is not
        duplicated (which would create a second, hidden H1 for crawlers).
      */}
      <div className="relative z-10 flex flex-1 w-full max-w-[1400px] mx-auto flex-col justify-between px-6 pt-16 pb-8 lg:justify-center lg:px-12 lg:py-40">
        {/* Eyebrow + headline + description (shared) */}
        <div className="w-full lg:max-w-[55%]">
          <Reveal y={14} duration={650}>
            <span className="inline-flex items-center gap-3 font-mono text-[11px] uppercase leading-relaxed tracking-[0.16em] text-white/60 lg:text-sm lg:normal-case lg:tracking-normal">
              <span className="h-px w-6 shrink-0 bg-white/30 lg:w-8" />
              <span>A global community turning problems into collective action</span>
            </span>
          </Reveal>

          <Reveal y={14} duration={650}>
            <p className="mt-2 text-left text-white/80 leading-relaxed text-[clamp(0.875rem,4vw,1.125rem)] lg:max-w-[55%] lg:mt-4 lg:text-[clamp(1rem,2.5vw,1.125rem)] break-words">
              We bring exceptional people together to solve meaningful problems — not just software, but health, energy, water, education, and climate challenges that matter to real communities.
            </p>
          </Reveal>

          <Reveal delay={90} y={24} duration={850}>
            <h1 className="mt-4 text-left font-display text-[clamp(1.75rem,8.5vw,2.5rem)] leading-[1.02] tracking-tight text-white lg:mt-4 lg:text-[clamp(2rem,6vw,7rem)] lg:leading-[0.92] break-words hyphens-auto">
              <span className="block">Become more capable,</span>
              <span className="block">
                never less{" "}
                <span className="relative inline-block">
                  <BlurWord word={words[wordIndex]} reducedMotion={reducedMotion} />
                </span>
              </span>
            </h1>
          </Reveal>

          {/* Desktop CTA buttons */}
          <Reveal delay={180} y={16} duration={600} className="hidden lg:block">
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <button
                onClick={() => window.location.href = "/membership"}
                className="w-full py-4 px-6 bg-white text-black font-medium text-sm rounded-lg transition-all hover:bg-white/90 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Apply to join
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => window.location.href = "/problems"}
                className="w-full py-4 px-6 border border-white/30 text-white font-medium text-sm rounded-lg transition-all hover:bg-white/5 hover:border-white/50 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Bring a problem
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </Reveal>

          {/* Mobile CTA buttons */}
          <Reveal delay={180} y={16} duration={600} className="block lg:hidden mt-6">
            <div className="flex flex-col gap-3 w-full sm:max-w-xs">
              <button
                onClick={() => window.location.href = "/membership"}
                className="w-full py-4 px-6 bg-white text-black font-medium text-sm rounded-lg transition-all hover:bg-white/90 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Apply to join
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => window.location.href = "/problems"}
                className="w-full py-4 px-6 border border-white/30 text-white font-medium text-sm rounded-lg transition-all hover:bg-white/5 hover:border-white/50 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Bring a problem
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </Reveal>
        </div>

        {/* Mobile-only bottom row: stat bar + scroll cue, anchored to the bottom
            of the hero by the parent's `justify-between`. */}
        <div className="lg:hidden mt-6">
          <Reveal delay={500} y={16}>
            <dl className="grid grid-cols-3 border-y border-white/10 divide-x divide-white/10 min-w-0">
              {heroStats.map((stat, i) => (
                <div
                  key={`${stat.label}-${i}`}
                  className="flex flex-col items-center gap-1 px-1 py-2.5 text-center min-w-0"
                >
                  <dt className="font-display text-lg sm:text-xl leading-none text-white truncate w-full">{stat.value}</dt>
                  <dd className="font-mono text-[8px] sm:text-[9px] leading-snug tracking-wide text-white/55 truncate w-full">
                    {stat.mobileLabel}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal delay={800} y={12}>
            <div className="mt-3 flex flex-col items-center gap-2 text-white/40">
              <ArrowDown className="h-4 w-4 animate-bounce-slow" />
              <span className="font-mono text-[9px] uppercase tracking-[0.3em]">Scroll</span>
            </div>
          </Reveal>
        </div>
      </div>

      {/* Desktop-only stats — 3 metrics pinned near the bottom. */}
      <Reveal
        delay={500}
        y={16}
        className="pointer-events-none absolute inset-x-0 bottom-20 z-10 hidden px-12 lg:block"
      >
        <div className="mx-auto flex min-h-[84px] max-w-[1400px] items-center justify-center gap-20">
          {heroStats.map((stat, i) => (
            <div
              key={`${stat.label}-${i}`}
              className="flex min-w-[140px] flex-col items-center gap-2 text-center"
            >
              <span className="font-display text-4xl whitespace-nowrap text-white">
                {stat.value}
              </span>
              <span className="text-xs leading-normal tracking-wide text-white/60">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </Reveal>

      {/* Desktop-only scroll indicator, centred on the bottom edge. */}
      <Reveal
        delay={800}
        y={16}
        className="pointer-events-none absolute inset-x-0 bottom-6 z-10 hidden justify-center lg:flex"
      >
        <div className="flex flex-col items-center gap-2 text-white/40 transition-colors duration-500 hover:text-white/60">
          <ArrowDown className="h-6 w-6 animate-bounce-slow" />
          <span className="font-mono text-xs uppercase tracking-widest">Scroll</span>
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
        @media (prefers-reduced-motion: reduce) {
          .animate-bounce-slow {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}
