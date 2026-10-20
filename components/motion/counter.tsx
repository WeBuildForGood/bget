"use client";

import { useEffect, useRef, useState } from "react";

/** Count up to `value` when scrolled into view. */
export function Counter({
  value,
  duration = 1400,
  prefix = "",
  suffix = "",
  className = "",
}: {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState(0);
  const frame = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Reduced motion, or no IntersectionObserver support: jump straight to the
    // final value so the number can never be left showing zero.
    if (reduced || typeof IntersectionObserver === "undefined") {
      setDisplay(value);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          setDisplay(Math.round(eased * value));
          if (t < 1) frame.current = requestAnimationFrame(tick);
        };
        frame.current = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [value, duration]);

  return (
    <span ref={ref} className={`relative inline-block tabular-nums ${className}`}>
      {/* Invisible copy reserves the width of the final value, so swapping
          digits during the count-up never reflows the layout around it. */}
      <span className="invisible" aria-hidden="true">
        {prefix}
        {value.toLocaleString("en-US")}
        {suffix}
      </span>
      <span className="absolute inset-0">
        {prefix}
        {display.toLocaleString("en-US")}
        {suffix}
      </span>
    </span>
  );
}
