import type { ReactNode } from "react";

/**
 * Infinite CSS marquee. Content is duplicated so the `-50%` translate loops
 * seamlessly. Server-friendly (no hooks) and pausable on hover.
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
  return (
    <div
      className={`group relative flex w-full overflow-hidden ${fade ? "marquee-mask" : ""} ${className}`}
    >
      <div
        className={`flex w-max shrink-0 items-center ${animation} ${
          pauseOnHover ? "group-hover:[animation-play-state:paused]" : ""
        }`}
        style={{ animationDuration: `${duration}s` }}
        aria-hidden="true"
      >
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center">{children}</div>
      </div>
    </div>
  );
}
