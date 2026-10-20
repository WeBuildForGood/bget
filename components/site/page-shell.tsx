import { Reveal, RevealText } from "@/components/motion/reveal";
import { Parallax } from "@/components/motion/parallax";
import { Navigation } from "@/components/landing/navigation";
import { FooterSection } from "@/components/landing/footer-section";
import { DecorativeBackdrop, OrbitMark, AccentRule } from "@/components/site/decorative-backdrop";
import { cn } from "@/lib/utils";

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-3 font-mono text-xs tracking-[0.2em] uppercase text-muted-foreground">
      <span className="w-12 h-px bg-foreground/20" />
      {children}
    </span>
  );
}

type PageShellProps = {
  eyebrow: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  /** Optional hero artwork shown on large screens. */
  image?: { src: string; alt?: string };
  /** Small factual chips rendered under the lead. */
  meta?: string[];
  children: React.ReactNode;
};

export function PageShell({ eyebrow, title, lead, image, meta, children }: PageShellProps) {
  return (
    <main id="main" className="relative min-h-screen overflow-x-hidden">
      <Navigation />
      <header className="relative pt-40 pb-20 lg:pt-52 lg:pb-28 border-b border-foreground/10 overflow-hidden">
        <DecorativeBackdrop variant="aurora" />
        <div className="grid-fade pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
        <OrbitMark className="pointer-events-none absolute -right-24 -top-24 hidden h-[460px] w-[460px] text-foreground opacity-[0.55] lg:block" />

        <div className="relative max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className={cn("grid gap-12", image ? "lg:grid-cols-12 lg:items-center" : "")}>
            <div className={cn(image ? "lg:col-span-8" : "max-w-5xl")}>
              <Reveal y={14} duration={650}>
                <Eyebrow>{eyebrow}</Eyebrow>
              </Reveal>
              <Reveal delay={90} y={24} duration={850}>
                <h1 className="mt-8 text-5xl md:text-7xl lg:text-[104px] font-display tracking-tight leading-[0.92] max-w-5xl text-balance">
                  {title}
                </h1>
              </Reveal>
              {lead ? (
                <Reveal delay={190} y={24}>
                  <p className="mt-10 text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-3xl text-pretty">
                    {lead}
                  </p>
                </Reveal>
              ) : null}
              {meta?.length ? (
                <Reveal delay={280} y={16}>
                  <ul className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-3 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    {meta.map((item) => (
                      <li
                        key={item}
                        className="card-glow inline-flex items-center rounded-full border border-foreground/12 bg-foreground/[0.02] px-4 py-2"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </Reveal>
              ) : null}
            </div>

            {image ? (
              <Reveal delay={240} y={30} className="lg:col-span-4">
                <Parallax speed={0.08}>
                  <div className="card-glow relative overflow-hidden rounded-3xl border border-foreground/10 bg-foreground/[0.02] p-3">
                    <img
                      src={image.src}
                      alt={image.alt ?? ""}
                      aria-hidden={image.alt ? undefined : "true"}
                      className="h-auto w-full rounded-2xl object-cover"
                    />
                  </div>
                </Parallax>
              </Reveal>
            ) : null}
          </div>
        </div>

        <AccentRule className="absolute bottom-0 left-0 opacity-70" />
      </header>
      {children}
      <FooterSection />
    </main>
  );
}

export function Section({
  id,
  eyebrow,
  title,
  intro,
  aside,
  index,
  muted = false,
  className,
  children,
}: {
  id?: string;
  eyebrow?: string;
  title?: React.ReactNode;
  intro?: React.ReactNode;
  /** Right-aligned slot rendered beside the section title. */
  aside?: React.ReactNode;
  /** Optional section number shown next to the eyebrow. */
  index?: string;
  muted?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const hasHeader = Boolean(eyebrow || title || intro);
  return (
    <section
      id={id}
      className={cn(
        "relative scroll-mt-24 border-b border-foreground/10",
        muted && "bg-foreground/[0.02]",
        className,
      )}
    >
      <div className="relative max-w-[1400px] mx-auto px-6 lg:px-12 py-20 lg:py-28">
        {hasHeader ? (
          <div className="mb-14">
            <div className="flex flex-wrap items-end justify-between gap-8">
              <div className="max-w-3xl">
                {eyebrow ? (
                  <Reveal y={12} duration={600}>
                    <span className="inline-flex items-center gap-4">
                      {index ? (
                        <span className="font-mono text-xs tracking-[0.2em] text-muted-foreground/60">
                          {index}
                        </span>
                      ) : null}
                      <Eyebrow>{eyebrow}</Eyebrow>
                    </span>
                  </Reveal>
                ) : null}
                {typeof title === "string" ? (
                  <RevealText
                    as="h2"
                    text={title}
                    delay={60}
                    className="mt-6 text-4xl md:text-5xl lg:text-6xl font-display tracking-tight leading-[0.98] max-w-3xl text-balance"
                  />
                ) : title ? (
                  <Reveal delay={60} y={20}>
                    <h2 className="mt-6 text-4xl md:text-5xl lg:text-6xl font-display tracking-tight leading-[0.98] max-w-3xl text-balance">
                      {title}
                    </h2>
                  </Reveal>
                ) : null}
              </div>
              {aside ? (
                <Reveal delay={140} y={16} className="shrink-0">
                  {aside}
                </Reveal>
              ) : null}
            </div>
            {intro ? (
              <Reveal delay={130} y={20}>
                <p className="mt-8 text-lg text-muted-foreground leading-relaxed max-w-2xl text-pretty">
                  {intro}
                </p>
              </Reveal>
            ) : null}
          </div>
        ) : null}
        {children ? (
          <Reveal delay={80} y={26}>
            {children}
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
