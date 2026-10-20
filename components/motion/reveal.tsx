"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

/**
 * Observe an element and report the first time it enters the viewport.
 * Honours `prefers-reduced-motion` (and missing IntersectionObserver support)
 * by reporting visible immediately, so content is never stuck at opacity 0.
 *
 * @param threshold Fraction of the element that must be visible.
 * @param once      Stop observing after the first reveal (default). Set false
 *                  to keep reporting when the element leaves the viewport.
 */
export function useInView<T extends HTMLElement = HTMLElement>(
  threshold = 0.15,
  once = true,
) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function" ||
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, once]);

  return { ref, inView };
}

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

/** Fade + rise an element into view once, respecting reduced motion. */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  duration = 800,
  className = "",
  style,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  duration?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        transitionProperty: "opacity, transform",
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: EASE,
        transitionDelay: `${delay}ms`,
        opacity: inView ? 1 : 0,
        transform: inView ? "none" : `translate3d(0, ${y}px, 0)`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}

/**
 * Word-by-word blur reveal for headlines — the motion signature of the site.
 * `text` is plain text so it stays crawlable inside an <h1>/<h2>.
 */
export function RevealText({
  text,
  as: Tag = "span",
  className = "",
  delay = 0,
  stagger = 55,
  blur = 12,
  reducedStagger = 10,
}: {
  text: string;
  as?: "span" | "h1" | "h2" | "h3" | "p";
  className?: string;
  delay?: number;
  stagger?: number;
  blur?: number;
  reducedStagger?: number;
}) {
  const { ref, inView } = useInView<HTMLElement>();
  const words = text.split(" ");
  const isReducedMotion = useReducedMotion();
  const actualStagger = isReducedMotion ? reducedStagger : stagger;
  
  return (
    <Tag ref={ref as never} className={className} aria-label={text}>
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          aria-hidden="true"
          style={{
            display: "inline-block",
            transitionProperty: "opacity, filter, transform",
            transitionDuration: "750ms",
            transitionTimingFunction: EASE,
            transitionDelay: `${delay + i * actualStagger}ms`,
            opacity: inView ? 1 : 0,
            filter: inView ? "blur(0px)" : `blur(${blur}px)`,
            transform: inView ? "none" : "translate3d(0, 0.45em, 0)",
          }}
        >
          {word}
          {i < words.length - 1 ? "\u00A0" : ""}
        </span>
      ))}
    </Tag>
  );
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(media.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setReduced(e.matches);
    };
    
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);
  
  return reduced;
}
