import type { ReactNode } from "react";

/**
 * Infinite CSS marquee. Content is duplicated so the `-50%` translate loops
 * seamlessly. Server-friendly (no hooks), pauses on hover/focus, and the
 * global `prefers-reduced-motion` rule pins it in place for those users.
 */
export function Marquee({
  children,
  reverse = false,
  duration = 34,
  pauseOnHover = true,
  className = "",
  fade = true,
}: {
  children: ReactNode;
  reverse?: boolean;
  /** Seconds for one full pass. */
  duration?: number;
  pauseOnHover?: boolean;
  className?: string;
  /** Soft dissolve at both edges. */
  fade?: boolean;
}) {
  const animation = reverse ? "marquee-reverse" : "marquee";
  const pause = pauseOnHover
    ? "group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]"
    : "";
  return (
    <div
      className={`group relative flex w-full overflow-hidden ${fade ? "marquee-mask" : ""} ${className}`}
    >
      <div
        className={`flex w-max shrink-0 items-center will-change-transform motion-reduce:animate-none ${animation} ${pause}`}
        style={{ animationDuration: `${duration}s` }}
      >
        {/* The first copy carries the accessible text; the duplicate that makes
            the loop seamless is hidden so it isn't announced twice. */}
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
