"use client";

import { useEffect, useRef } from "react";

/**
 * Thin progress bar pinned to the very top of the viewport.
 * Writes transform directly to the DOM inside a rAF-throttled, passive scroll
 * listener, so scrolling never triggers a React re-render.
 */
export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    // The bar follows the user's own scrolling rather than animating on its
    // own, so reduced motion only needs to drop the easing transition — the
    // position stays accurate.
    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    bar.style.transition = reduced ? "none" : "transform 120ms linear";

    let frame = 0;
    // Layout is read only inside the rAF callback, never in the scroll handler.
    const update = () => {
      frame = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, doc.scrollTop / max)) : 0;
      bar.style.transform = `scaleX(${progress})`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="fixed inset-x-0 top-0 z-[60] h-px bg-transparent" aria-hidden="true">
      <div
        ref={barRef}
        className="h-full origin-left"
        style={{ backgroundColor: "#eca8d6", transform: "scaleX(0)" }}
      />
    </div>
  );
}
