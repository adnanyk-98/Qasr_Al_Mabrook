"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { PublicImageSlot } from "@/components/public/public-image-slot";

export function HeroCarousel({
  id,
  locale,
  banners,
  autoplay = false,
  autoplayInterval = 6000,
}: {
  id: string;
  locale: "en" | "ar";
  banners: Array<{ imageUrl?: string | null; imageAlt?: string; title?: string; subtitle?: string; ctaLabel?: string; ctaHref?: string }>;
  autoplay?: boolean;
  autoplayInterval?: number;
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mediaQuery.matches);
    sync();
    mediaQuery.addEventListener("change", sync);
    return () => mediaQuery.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const onScroll = () => {
      const idx = Math.round(el.scrollLeft / el.clientWidth);
      setActive(Math.max(0, Math.min(banners.length - 1, idx)));
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [banners.length]);

  useEffect(() => {
    if (!autoplay || reducedMotion || banners.length <= 1) return;
    const idt = setInterval(() => {
      const next = (active + 1) % banners.length;
      scrollToIndex(next);
    }, autoplayInterval);
    return () => clearInterval(idt);
  }, [active, autoplay, autoplayInterval, reducedMotion, banners.length]);

  const scrollToIndex = useCallback(
    (index: number) => {
      const el = scrollerRef.current;
      if (!el) return;
      el.scrollTo({ left: el.clientWidth * index, behavior: reducedMotion ? "auto" : "smooth" });
      setActive(index);
    },
    [reducedMotion],
  );

  const prev = useCallback(() => scrollToIndex(Math.max(0, active - 1)), [active, scrollToIndex]);
  const next = useCallback(() => scrollToIndex(Math.min(banners.length - 1, active + 1)), [active, banners.length, scrollToIndex]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <div
          id={id}
          ref={scrollerRef}
          dir={locale === "ar" ? "rtl" : "ltr"}
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
          aria-label={id}
          className="overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          style={{ scrollSnapType: "x mandatory" }}
        >
          <div className="flex w-full">
            {banners.map((b, i) => (
              <div key={i} className="shrink-0 w-full snap-start">
                {b.imageUrl ? (
                  <PublicImageSlot src={b.imageUrl} alt={b.imageAlt ?? b.title ?? `banner-${i}`} variant="homepage-hero" sizes="100vw" />
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          <Button variant="outline" size="sm" aria-label="Previous banner" onClick={prev} disabled={active === 0}>
            ‹
          </Button>
        </div>
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Button variant="outline" size="sm" aria-label="Next banner" onClick={next} disabled={active === banners.length - 1}>
            ›
          </Button>
        </div>

        <div className="absolute left-1/2 top-auto bottom-3 -translate-x-1/2 flex gap-2">
          {banners.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => scrollToIndex(i)}
              className={`h-2 w-8 rounded-full ${i === active ? "bg-[var(--brand-primary)]" : "bg-[var(--brand-border)]"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
