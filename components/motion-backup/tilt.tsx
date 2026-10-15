"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties, ReactNode } from "react";

/**
 * Subtle pointer-driven 3D tilt. Disabled entirely for coarse pointers and for
 * anyone who asked for reduced motion, so it never fights accessibility.
 */
export function Tilt({
  children,
  className = "",
  intensity = 6,
  style,
}: {
  children: ReactNode;
  className?: string;
  /** Maximum rotation in degrees at the card edges. */
  intensity?: number;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;

    let frame = 0;
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };

    const render = () => {
      current.x += (target.x - current.x) * 0.12;
      current.y += (target.y - current.y) * 0.12;
      el.style.setProperty("--tilt-x", `${current.x.toFixed(3)}deg`);
      el.style.setProperty("--tilt-y", `${current.y.toFixed(3)}deg`);
      if (Math.abs(target.x - current.x) > 0.01 || Math.abs(target.y - current.y) > 0.01) {
        frame = requestAnimationFrame(render);
      } else {
        frame = 0;
      }
    };

    const kick = () => {
      if (!frame) frame = requestAnimationFrame(render);
    };

    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      target.x = (0.5 - py) * intensity * 2;
      target.y = (px - 0.5) * intensity * 2;
      el.style.setProperty("--halo-x", `${(px * 100).toFixed(1)}%`);
      el.style.setProperty("--halo-y", `${(py * 100).toFixed(1)}%`);
      kick();
    };

    const onLeave = () => {
      target.x = 0;
      target.y = 0;
      kick();
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [intensity]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        transform: "perspective(1100px) rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg))",
        transformStyle: "preserve-3d",
        transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {children}
    </div>
  );
}
