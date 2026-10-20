"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties, ReactNode } from "react";

/**
 * Gentle scroll parallax. Moves the wrapped content vertically as the element
 * travels through the viewport. No-op for reduced-motion users and on small /
 * coarse-pointer viewports, where the extra compositing isn't worth it.
 */
export function Parallax({
  children,
  speed = 0.12,
  className = "",
  style,
}: {
  children: ReactNode;
  /** Positive moves slower than scroll (recedes); negative leads. */
  speed?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Skip the transform work on phone-class viewports (small or coarse
    // pointer): it costs more in compositing than the subtle effect is worth.
    if (window.matchMedia("(max-width: 767px), (pointer: coarse)").matches) return;

    const mover = el.firstElementChild as HTMLElement | null;
    if (!mover) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const viewport = window.innerHeight || 1;
      // Progress from -1 (below fold) to 1 (above fold)
      const progress = (rect.top + rect.height / 2 - viewport / 2) / viewport;
      const offset = progress * speed * 100;
      mover.style.setProperty("--parallax", `${offset.toFixed(2)}px`);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    mover.style.willChange = "transform";
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      mover.style.willChange = "";
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [speed]);

  return (
    <div ref={ref} className={className} style={style}>
      <div style={{ transform: "translate3d(0, var(--parallax, 0px), 0)" }}>
        {children}
      </div>
    </div>
  );
}
