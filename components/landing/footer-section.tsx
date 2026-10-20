"use client";

import { useEffect, useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useFormSubmit } from "@/components/site/use-form-submit";
import type { FieldErrors } from "@/components/site/form-ui";
import { isEmail } from "@/components/site/form-validation";

const footerLinks = {
  Community: [
    { name: "What we do", href: "/#features" },
    { name: "Projects", href: "/projects" },
    { name: "Activities", href: "/activities" },
    { name: "Problem Commons", href: "/problems" },
  ],
  Belong: [
    { name: "Manifesto", href: "/manifesto" },
    { name: "Values", href: "/values" },
    { name: "Membership", href: "/membership" },
    { name: "Founders", href: "/founders" },
  ],
  Build: [
    { name: "Problem Commons", href: "/problems" },
    { name: "The Labs", href: "/projects" },
    { name: "Impact", href: "/activities" },
    { name: "About", href: "/about" },
  ],
  Connect: [
    { name: "Apply to join", href: "/membership", badge: "Open" },
    { name: "Bring a problem", href: "/problems" },
    { name: "Contact & feedback", href: "/contact" },
    { name: "GitHub", href: "https://github.com/webuildforgood" },
  ],
};

const socialLinks = [
  {
    name: "GitHub",
    href: "https://github.com/webuildforgood",
    label: "View the Build For Good GitHub organization",
  },
  // NOTE: GitHub is the only public social profile today. The community itself
  // is application-based and members-only, so there is deliberately no public
  // Discord invite here — publishing one would bypass membership review.
  // See /membership for how to join.
];

function AnimatedWaveCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    const animate = () => {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      ctx.clearRect(0, 0, width, height);

      ctx.strokeStyle = "rgba(100, 200, 150, 0.3)";
      ctx.lineWidth = 1;

      for (let wave = 0; wave < 3; wave++) {
        ctx.beginPath();
        for (let x = 0; x <= width; x += 5) {
          const y =
            height * 0.5 +
            Math.sin(x * 0.01 + time + wave * 0.5) * 30 +
            Math.sin(x * 0.02 + time * 1.5 + wave) * 20;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      time += 0.02;
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}

/** Compact, functional subscribe form for the footer. Wires the same
 *  `/api/subscribe` endpoint and validation as the full SubscriptionSection but
 *  renders inline so it stays visually light in the footer. */
function FooterSubscribe() {
  const { values, errors, status, pending, formRef, set, submit, reset } = useFormSubmit({
    endpoint: "/api/subscribe",
    initial: { email: "" },
    validate: (v): FieldErrors =>
      isEmail(v.email.trim().toLowerCase()) ? {} : { email: "Enter a valid email." },
    success: () => ({
      message: "You're subscribed!",
      detail: "Watch your inbox for weekly updates from Build For Good.",
    }),
  });

  if (status.type === "ok") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-lg border border-[#eca8d6]/35 bg-[#eca8d6]/[0.08] p-4"
      >
        <p className="text-sm font-medium text-[#eca8d6]">✓ {status.message}</p>
        {status.detail && <p className="mt-1 text-xs text-white/50">{status.detail}</p>}
        <button
          type="button"
          onClick={reset}
          className="mt-3 text-xs text-white/40 underline underline-offset-2 transition-colors hover:text-white"
        >
          Subscribe another email
        </button>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="space-y-2">
      <label htmlFor="footer-subscribe-email" className="sr-only">
        Email address
      </label>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          id="footer-subscribe-email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          disabled={pending}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "footer-subscribe-error" : undefined}
          onChange={set("email")}
          value={values.email}
          className="flex-1 min-w-0 min-h-11 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30"
        />
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 px-4 py-2 text-sm font-medium rounded-md bg-white text-black transition-colors hover:bg-white/90 disabled:opacity-60 whitespace-nowrap"
        >
          {pending ? "Subscribing…" : "Subscribe"}
        </button>
      </div>
      {errors.email && (
        <p id="footer-subscribe-error" className="text-xs text-red-400">
          {errors.email}
        </p>
      )}
      {status.type === "error" && !errors.email && (
        <p role="alert" className="text-xs text-red-400">
          {status.message}
        </p>
      )}
    </form>
  );
}

export function FooterSection() {
  return (
    <footer className="relative bg-black">
      {/* Panoramic banner image */}
      <div className="relative w-full h-[220px] sm:h-[340px] md:h-[420px] overflow-hidden">
        <img
          src="/images/footer-banner.webp"
          alt=""
          aria-hidden="true"
          width={1920}
          height={572}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover object-center"
        />
        {/* Gradient fade to black at bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black" />
        {/* Subtle dark vignette on sides */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
      </div>

      {/* Footer content — black background, white text */}
      <div className="relative z-10 max-w-[1400px] mx-auto pl-[calc(1.5rem+env(safe-area-inset-left))] pr-[calc(1.5rem+env(safe-area-inset-right))] lg:pl-12 lg:pr-12">
        {/* Main Footer */}
        <div className="py-12 lg:py-20">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-x-6 gap-y-10">
            {/* Brand Column */}
            <div className="col-span-2">
              <Link href="/" className="inline-flex items-center gap-2 mb-6 min-h-11">
                <span className="text-2xl font-display text-white">Build For Good</span>
                <span className="text-xs text-white/40 font-mono">TM</span>
              </Link>

              <p className="text-white/50 leading-relaxed mb-8 max-w-full sm:max-w-xs text-sm">
                A global community for turning meaningful problems into collective action. Build. Grow. Evolve. Together.
              </p>

              {/* Social Links */}
              <nav aria-label="Social links" className="flex flex-wrap gap-x-6 gap-y-2">
                {socialLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={link.label}
                    className="text-sm text-white/40 hover:text-white transition-colors inline-flex items-center gap-1 group min-h-11 min-w-11"
                  >
                    <span aria-hidden="true">{link.name}</span>
                    <ArrowUpRight
                      aria-hidden="true"
                      className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
                    />
                  </a>
                ))}
              </nav>

              {/* Subscription form — the full SubscriptionSection already
                  renders on the homepage, so the footer keeps this compact
                  variant instead of duplicating the large card. */}
              <div className="mt-8">
                <h3 className="text-sm font-medium text-white mb-1">Stay in the loop</h3>
                <p className="text-xs text-white/40 mb-3">
                  Weekly updates from Build For Good.
                </p>
                <FooterSubscribe />
              </div>
            </div>

            {/* Link Columns */}
            {Object.entries(footerLinks).map(([title, links]) => (
              <nav key={title} aria-label={title} className="min-w-0">
                <h3 className="text-sm font-medium text-white mb-4">{title}</h3>
                <ul className="space-y-1">
                  {links.map((link) => {
                    const isExternal = !link.href.startsWith("/");
                    const content = (
                      <>
                        <span className="truncate">{link.name}</span>
                        {"badge" in link && link.badge && (
                          <span className="text-xs px-2 py-0.5 bg-white text-black rounded-full flex-shrink-0">
                            {link.badge}
                          </span>
                        )}
                        {isExternal && <span className="sr-only">(opens in a new tab)</span>}
                      </>
                    );
                    const className =
                      "text-sm text-white/40 hover:text-white transition-colors inline-flex items-center gap-2 min-h-11 min-w-11 w-full overflow-hidden";
                    return (
                      <li key={link.name}>
                        {!isExternal ? (
                          <Link href={link.href} className={className}>
                            {content}
                          </Link>
                        ) : (
                          <a
                            href={link.href}
                            target="_blank"
                            rel="noreferrer noopener"
                            className={className}
                          >
                            {content}
                          </a>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <p className="text-sm text-white/30">
            &copy; 2026 Build For Good. All rights reserved.
          </p>

          <div className="flex items-center gap-4 text-sm text-white/30">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#eca8d6]" />
              Built together. Better every week.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
