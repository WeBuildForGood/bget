"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

/**
 * Observe an element and report the first time it enters the viewport.
 * Honours `prefers-reduced-motion` by reporting visible immediately.
 */
export function useInView<T extends HTMLElement = HTMLElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

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
}: {
  text: string;
  as?: "span" | "h1" | "h2" | "h3" | "p";
  className?: string;
  delay?: number;
  stagger?: number;
  blur?: number;
}) {
  const { ref, inView } = useInView<HTMLElement>();
  const words = text.split(" ");
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
            transitionDelay: `${delay + i * stagger}ms`,
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
