"use client";

import { useEffect, useState, useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

const asciiPattern = Array.from({ length: 60 }, () =>
  Array.from({ length: 100 }, (_, index) => (index % 7 === 0 || index % 13 === 0 ? '"' : ' ')).join("")
).join("\n");

const testimonials = [
  {
    quote: "Capability without character is not enough.",
    author: "Build For Good",
    role: "Values",
    company: "Character",
    metric: { value: "Character", label: "is the gate" },
  },
  {
    quote: "We would rather stay small and excellent than grow fast and become ordinary.",
    author: "Build For Good",
    role: "Values",
    company: "Quality",
    metric: { value: "Quality", label: "over quantity" },
  },
  {
    quote: "Become more capable without becoming less human.",
    author: "Build For Good",
    role: "Values",
    company: "Humanity",
    metric: { value: "Human", label: "before everything else" },
  },
  {
    quote: "Don't just point at the problem. Be part of the solution.",
    author: "Build For Good",
    role: "Values",
    company: "Action",
    metric: { value: "Build", label: "not just talk" },
  },
];

export function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [isMounted, setIsMounted] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setDirection("right");
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const goTo = (index: number) => {
    setDirection(index > activeIndex ? "right" : "left");
    setActiveIndex(index);
  };

  const goPrev = () => {
    setDirection("left");
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goNext = () => {
    setDirection("right");
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const activeTestimonial = testimonials[activeIndex];

  return (
    <section ref={sectionRef} className="relative py-20 lg:py-40 bg-foreground text-background overflow-hidden">
      {/* ASCII background pattern */}
      <div className="absolute inset-0 font-mono text-xs text-background/[0.02] leading-tight overflow-hidden whitespace-pre select-none" aria-hidden="true">
        {isMounted ? asciiPattern : null}
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto pl-[calc(1.5rem+env(safe-area-inset-left))] pr-[calc(1.5rem+env(safe-area-inset-right))] lg:pl-12 lg:pr-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-12 lg:mb-20">
          <div>
            <span className="inline-flex items-center gap-3 text-sm font-mono text-background/40 mb-4">
              <span className="w-12 h-px bg-background/20" />
              Our philosophy
            </span>
            <h2 className={`text-4xl lg:text-5xl font-display transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}>
              Words we live by
              <span className="text-background/40"> — and mean.</span>
            </h2>
          </div>
          
          {/* Navigation arrows */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={goPrev}
              className="p-4 border border-background/20 hover:bg-background/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goNext}
              className="p-4 border border-background/20 hover:bg-background/10 transition-colors"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main content - Split layout */}
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20">
          {/* Quote side */}
          <div className="lg:col-span-7 relative">
            {/* Large quote mark */}
            <span className="absolute -left-4 -top-8 text-[200px] font-display text-background/5 leading-none select-none">
              &ldquo;
            </span>
            
            <div className="relative">
              <blockquote 
                key={activeIndex}
                className="text-3xl lg:text-4xl xl:text-5xl font-display leading-[1.2] tracking-tight animate-fadeSlideIn"
              >
                {activeTestimonial.quote}
              </blockquote>

              {/* Author */}
              <div className="mt-12 flex items-center gap-6">
                <div className="w-14 h-14 rounded-full bg-background/10 flex items-center justify-center">
                  <span className="font-display text-xl">
                    {activeTestimonial.author.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-lg font-medium">{activeTestimonial.author}</p>
                  <p className="text-background/60">
                    {activeTestimonial.role}, {activeTestimonial.company}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Metric cards side */}
          <div className="lg:col-span-5 flex flex-col justify-center gap-6">
            {/* Active metric - Large */}
            <div 
              key={`metric-${activeIndex}`}
              className="p-6 sm:p-10 border border-background/20 bg-background/5 animate-fadeSlideIn"
            >
              <span className="text-5xl sm:text-7xl lg:text-8xl font-display block mb-4">
                {activeTestimonial.metric.value}
              </span>
              <span className="text-lg text-background/60">
                {activeTestimonial.metric.label}
              </span>
            </div>

            {/* Progress indicators */}
            <div className="flex gap-2">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goTo(idx)}
                  aria-label={`Show principle ${idx + 1} of ${testimonials.length}`}
                  aria-current={idx === activeIndex}
                  className="flex-1 min-h-11 flex items-center bg-transparent group"
                >
                  <span className="block w-full h-1 bg-background/20 overflow-hidden">
                    <span
                      className={`block h-full bg-background transition-all duration-300 ${
                        idx === activeIndex ? "w-full" : idx < activeIndex ? "w-full opacity-50" : "w-0"
                      }`}
                      style={idx === activeIndex ? { animation: "progress 8s linear forwards" } : {}}
                    />
                  </span>
                </button>
              ))}
            </div>

            {/* Company list */}
            <div className="mt-4 pt-6 border-t border-background/10">
              <span className="text-xs font-mono text-background/30 uppercase tracking-widest block mb-4">
                Living principles
              </span>
              <div className="flex flex-wrap gap-3">
                {testimonials.map((t, idx) => (
                  <button
                    key={t.company}
                    onClick={() => goTo(idx)}
                    aria-pressed={idx === activeIndex}
                    className={`inline-flex items-center min-h-11 px-4 py-2 text-sm border transition-all ${
                      idx === activeIndex 
                        ? "border-background/40 text-background" 
                        : "border-background/10 text-background/40 hover:border-background/30"
                    }`}
                  >
                    {t.company}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-fadeSlideIn {
          animation: fadeSlideIn 0.5s ease-out forwards;
        }
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </section>
  );
}
