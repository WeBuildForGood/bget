"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Navigation } from "@/components/landing/navigation";
import { FooterSection } from "@/components/landing/footer-section";
import {
  DecorativeBackdrop,
  OrbitMark,
  AccentRule,
} from "@/components/site/decorative-backdrop";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Route-level error boundary. Static export has no server to catch throws, so
 * this client boundary is what turns an unexpected render/runtime error into a
 * recoverable, on-brand screen instead of a blank page.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the failure for client-side diagnostics/observability.
    console.error(error);
  }, [error]);

  return (
    <main id="main" className="relative flex min-h-screen flex-col overflow-x-hidden">
      <Navigation />

      <section
        role="alert"
        className="relative flex flex-1 items-center overflow-hidden border-b border-foreground/10 pt-40 pb-24 lg:pt-52 lg:pb-32"
      >
        <DecorativeBackdrop variant="grid" />
        <OrbitMark className="pointer-events-none absolute -bottom-24 -left-24 hidden h-[420px] w-[420px] text-foreground opacity-[0.5] lg:block" />

        <div className="relative mx-auto w-full max-w-[1400px] px-6 lg:px-12">
          <span className="inline-flex items-center gap-3 font-mono text-[11px] tracking-[0.2em] uppercase text-muted-foreground">
            <span className="w-12 h-px bg-foreground/20" />
            Something broke
          </span>

          <h1 className="mt-8 text-4xl md:text-6xl lg:text-[72px] font-display tracking-tight leading-[0.95] max-w-4xl text-balance">
            A part of this page failed to render.
          </h1>

          <p className="mt-8 text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-2xl text-pretty">
            The rest of the site is fine. Try again — if it keeps happening, tell us and we will
            fix it.
          </p>

          {error.digest ? (
            <p className="mt-6 font-mono text-xs text-muted-foreground/70">
              Reference: {error.digest}
            </p>
          ) : null}

          <div className="mt-12 flex flex-wrap items-center gap-4">
            <Button type="button" size="lg" onClick={() => reset()}>
              Try again
            </Button>
            <Link
              href="/"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              Back home
            </Link>
            <Link
              href="/contact"
              className={cn(buttonVariants({ variant: "ghost", size: "lg" }))}
            >
              Report it
            </Link>
          </div>
        </div>

        <AccentRule className="absolute bottom-0 left-0 opacity-70" />
      </section>

      <FooterSection />
    </main>
  );
}
