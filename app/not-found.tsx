import Link from "next/link";
import { Navigation } from "@/components/landing/navigation";
import { FooterSection } from "@/components/landing/footer-section";
import {
  DecorativeBackdrop,
  OrbitMark,
  AccentRule,
} from "@/components/site/decorative-backdrop";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** The three doors we most want a lost visitor to find. */
const destinations = [
  { href: "/", label: "Home", hint: "Start at the beginning." },
  { href: "/problems", label: "Problem Commons", hint: "Bring a problem worth solving." },
  { href: "/membership", label: "Membership", hint: "Join the people who solve them." },
];

export default function NotFound() {
  return (
    <main id="main" className="relative flex min-h-screen flex-col overflow-x-hidden">
      <Navigation />

      <section className="relative flex flex-1 items-center overflow-hidden border-b border-foreground/10 pt-40 pb-24 lg:pt-52 lg:pb-32">
        <DecorativeBackdrop variant="aurora" />
        <div
          className="grid-fade pointer-events-none absolute inset-0 opacity-60"
          aria-hidden="true"
        />
        <OrbitMark className="pointer-events-none absolute -right-24 -top-24 hidden h-[420px] w-[420px] text-foreground opacity-[0.5] lg:block" />

        <div className="relative mx-auto w-full max-w-[1400px] px-6 lg:px-12">
          <span className="inline-flex items-center gap-3 font-mono text-[11px] tracking-[0.2em] uppercase text-muted-foreground">
            <span className="w-12 h-px bg-foreground/20" />
            Error 404
          </span>

          <h1 className="mt-8 text-4xl md:text-6xl lg:text-[72px] font-display tracking-tight leading-[0.95] max-w-4xl text-balance">
            This page went looking for a problem to solve.
          </h1>

          <p className="mt-8 text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-2xl text-pretty">
            It never found one — or it moved. No dead ends here: pick a door and keep building.
          </p>

          <div className="mt-12 flex flex-wrap items-center gap-4">
            <Link href="/" className={cn(buttonVariants({ size: "lg" }))}>
              Back home
            </Link>
            <Link
              href="/problems"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              Browse problems
            </Link>
          </div>

          <ul className="mt-16 grid gap-px border border-foreground/10 bg-foreground/10 sm:grid-cols-3">
            {destinations.map((destination) => (
              <li key={destination.href} className="bg-background">
                <Link
                  href={destination.href}
                  className="card-glow block h-full p-6 transition-colors hover:bg-foreground/[0.03]"
                >
                  <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    {destination.href}
                  </span>
                  <span className="mt-3 block text-xl font-display">{destination.label}</span>
                  <span className="mt-2 block text-sm text-muted-foreground leading-relaxed">
                    {destination.hint}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <AccentRule className="absolute bottom-0 left-0 opacity-70" />
      </section>

      <FooterSection />
    </main>
  );
}
