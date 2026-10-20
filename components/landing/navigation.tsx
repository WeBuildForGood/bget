"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown } from "lucide-react";

const primaryLinks = [
  { name: "What we do",      href: "/#features"     },
  { name: "Projects",        href: "/projects"      },
  { name: "Problem Commons", href: "/problems"      },
  { name: "Activities",      href: "/activities"    },
  { name: "Membership",      href: "/membership"    },
  { name: "Updates",         href: "/#updates"      },
];

const moreLinks = [
  { name: "Manifesto", href: "/manifesto" },
  { name: "Values",    href: "/values"    },
  { name: "Founders",  href: "/founders"  },
  { name: "About",     href: "/about"     },
  { name: "Contact",   href: "/contact"   },
];

const mobileLinks = [...primaryLinks, ...moreLinks];

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Mobile drawer: lock body scroll, move focus in on open, restore on close,
  // close on Escape, and keep Tab focus inside the drawer (a simple focus trap).
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const panel = menuPanelRef.current;
    const focusables = panel
      ? Array.from(
          panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'),
        ).filter((el) => el.offsetParent !== null || el === document.activeElement)
      : [];
    const focusTimer = window.setTimeout(() => focusables[0]?.focus(), 60);

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const list = [
        ...(menuToggleRef.current ? [menuToggleRef.current] : []),
        ...focusables,
      ];
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (event.shiftKey && (active === first || !active || !list.includes(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(focusTimer);
      document.body.style.overflow = originalOverflow;
      previouslyFocused?.focus?.();
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isMoreOpen) return;
    const onClick = (event: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMoreOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [isMoreOpen]);

  const linkClass = isScrolled
    ? "text-foreground/70 hover:text-foreground"
    : "text-white/70 hover:text-white";
  const underlineClass = isScrolled ? "bg-foreground" : "bg-white";

  return (
    <header
      className={`fixed z-50 transition-all duration-500 pt-[env(safe-area-inset-top)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] ${
        isScrolled ? "top-4 left-4 right-4" : "top-0 left-0 right-0"
      }`}
    >
      <nav
        className={`relative z-50 mx-auto transition-all duration-500 ${
          isScrolled || isMobileMenuOpen
            ? "bg-background/80 backdrop-blur-xl border border-foreground/10 rounded-2xl shadow-lg max-w-[1200px]"
            : "bg-transparent max-w-[1400px]"
        }`}
      >
        <div
          className={`flex items-center justify-between transition-all duration-500 px-6 lg:px-8 ${
            isScrolled ? "h-14" : "h-20"
          }`}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0 min-h-11">
            <span
              className={`font-display tracking-tight transition-all duration-500 ${
                isScrolled ? "text-lg text-foreground" : "text-xl text-white"
              }`}
            >
              Build For Good
            </span>
            <span
              className={`font-mono transition-all duration-500 ${
                isScrolled ? "text-xs mt-0.5 text-muted-foreground" : "text-xs mt-1 text-white/60"
              }`}
            >
              TM
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-7">
            {primaryLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm transition-colors duration-300 relative group whitespace-nowrap ${linkClass}`}
              >
                {link.name}
                <span
                  className={`absolute -bottom-1 left-0 w-0 h-px transition-all duration-300 group-hover:w-full ${underlineClass}`}
                />
              </Link>
            ))}

            {/* More dropdown */}
            <div className="relative" ref={moreRef}>
              <button
                type="button"
                onClick={() => setIsMoreOpen((open) => !open)}
                aria-expanded={isMoreOpen}
                aria-haspopup="menu"
                className={`text-sm transition-colors duration-300 relative group inline-flex items-center gap-1 whitespace-nowrap ${linkClass}`}
              >
                More
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-300 ${
                    isMoreOpen ? "rotate-180" : ""
                  }`}
                />
                <span
                  className={`absolute -bottom-1 left-0 h-px transition-all duration-300 ${
                    isMoreOpen ? "w-full" : "w-0 group-hover:w-full"
                  } ${underlineClass}`}
                />
              </button>
              <div
                role="menu"
                className={`absolute right-0 top-full mt-3 w-48 rounded-xl border border-foreground/10 bg-background/95 p-1.5 backdrop-blur-xl shadow-xl transition-all duration-200 origin-top-right ${
                  isMoreOpen
                    ? "opacity-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 -translate-y-1 pointer-events-none"
                }`}
              >
                {moreLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    role="menuitem"
                    onClick={() => setIsMoreOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4 shrink-0">
            <Button
              asChild
              size="sm"
              className={`rounded-full transition-all duration-500 ${
                isScrolled
                  ? "bg-foreground hover:bg-foreground/90 text-background px-4 h-8 text-xs"
                  : "bg-white hover:bg-white/90 text-black px-6"
              }`}
            >
              <Link href="/membership">Join us</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            ref={menuToggleRef}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`md:hidden inline-flex items-center justify-center p-2 min-h-11 min-w-11 -mr-2 transition-colors duration-500 ${
              isScrolled || isMobileMenuOpen ? "text-foreground" : "text-white"
            }`}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu - Full Screen Overlay */}
      <div
        id="mobile-menu"
        aria-hidden={!isMobileMenuOpen}
        inert={!isMobileMenuOpen}
        className={`md:hidden fixed inset-0 bg-background z-40 transition-all duration-500 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] ${
          isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{ top: 0 }}
      >
        <div
          ref={menuPanelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className="flex flex-col h-full px-6 sm:px-8 pt-24 pb-8 overflow-y-auto"
          onClick={(event) => {
            if (event.target === event.currentTarget) setIsMobileMenuOpen(false);
          }}
        >
          {/* Navigation Links */}
          <div className="flex-1 flex flex-col justify-start gap-1 py-4">
            {mobileLinks.map((link, i) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`inline-flex items-center min-h-11 text-3xl min-[380px]:text-4xl font-display text-foreground hover:text-muted-foreground transition-all duration-500 ${
                  isMobileMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: isMobileMenuOpen ? `${i * 50}ms` : "0ms" }}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Bottom CTAs */}
          <div
            className={`flex gap-4 pt-8 border-t border-foreground/10 transition-all duration-500 ${
              isMobileMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{ transitionDelay: isMobileMenuOpen ? "300ms" : "0ms" }}
          >
            <Button asChild variant="outline" className="flex-1 rounded-full h-14 text-base">
              <Link href="/manifesto" onClick={() => setIsMobileMenuOpen(false)}>
                Manifesto
              </Link>
            </Button>
            <Button asChild className="flex-1 bg-foreground text-background rounded-full h-14 text-base">
              <Link href="/membership" onClick={() => setIsMobileMenuOpen(false)}>
                Join us
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
