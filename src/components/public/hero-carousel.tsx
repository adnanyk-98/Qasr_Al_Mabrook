"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PublicImageSlot } from "@/components/public/public-image-slot";

export function HeroCarousel({
  id,
  locale,
  banners,
  overlay,
  autoplay = true,
  autoplayInterval = 6000,
}: {
  id: string;
  locale: "en" | "ar";
  banners: Array<{
    imageUrl?: string | null;
    desktopImageUrl?: string | null;
    mobileImageUrl?: string | null;
    imageAlt?: string;
    title?: string;
    subtitle?: string;
    ctaLabel?: string;
    ctaHref?: string;
  }>;
  overlay?: ReactNode;
  autoplay?: boolean;
  autoplayInterval?: number;
}) {
  const [active, setActive] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mediaQuery.matches);
    sync();
    mediaQuery.addEventListener("change", sync);
    return () => mediaQuery.removeEventListener("change", sync);
  }, []);

  const goTo = useCallback(
    (index: number) => {
      setActive(Math.max(0, Math.min(index, banners.length - 1)));
    },
    [banners.length],
  );

  const prev = useCallback(() => goTo(active - 1), [active, goTo]);
  const next = useCallback(() => goTo(active + 1), [active, goTo]);

  useEffect(() => {
    if (!autoplay || reducedMotion || banners.length <= 1) return;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % banners.length);
    }, autoplayInterval);
    return () => window.clearInterval(timer);
  }, [autoplay, autoplayInterval, banners.length, reducedMotion]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!rootRef.current || !rootRef.current.contains(document.activeElement)) return;
      if (event.key === "ArrowRight" || event.key === "PageDown") {
        event.preventDefault();
        next();
      }
      if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        prev();
      }
      if (event.key === "Home") {
        event.preventDefault();
        goTo(0);
      }
      if (event.key === "End") {
        event.preventDefault();
        goTo(banners.length - 1);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [banners.length, goTo, next, prev]);

  if (!banners.length) {
    return null;
  }

  return (
    <div
      ref={rootRef}
      id={id}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className="relative isolate overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--brand-border)] bg-[var(--brand-surface-alt)] shadow-[var(--shadow-md)]"
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label={id}
      aria-live="polite"
    >
      <div className="relative w-full overflow-hidden">
        <div
          className="w-full flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${active * 100}%)` }}
        >
          {banners.map((banner, index) => (
            <div key={`${id}-${index}`} className="min-w-full w-full shrink-0 relative">
              {(banner.desktopImageUrl || banner.imageUrl) ? (
                banner.ctaHref ? (
                  <Link href={banner.ctaHref} aria-label={banner.title ?? banner.imageAlt ?? `Hero banner ${index + 1}`} className="block w-full h-full">
                    {/* Responsive picture: mobile source first, desktop as fallback */}
                    <div className="relative w-full aspect-[9/10] md:aspect-[8/3] overflow-hidden rounded-[var(--radius-2xl)]">
                      <picture>
                        {banner.mobileImageUrl ? <source media="(max-width: 767px)" srcSet={banner.mobileImageUrl} /> : null}
                        <img src={banner.desktopImageUrl ?? banner.imageUrl ?? ''} alt={banner.imageAlt ?? banner.title ?? `Hero banner ${index + 1}`} className="w-full h-full object-contain object-center" />
                      </picture>
                    </div>
                  </Link>
                ) : (
                  <div className="block w-full h-full">
                    <div className="relative w-full aspect-[9/10] md:aspect-[8/3] overflow-hidden rounded-[var(--radius-2xl)]">
                      <picture>
                        {banner.mobileImageUrl ? <source media="(max-width: 767px)" srcSet={banner.mobileImageUrl} /> : null}
                        <img src={banner.desktopImageUrl ?? banner.imageUrl ?? ''} alt={banner.imageAlt ?? banner.title ?? `Hero banner ${index + 1}`} className="w-full h-full object-contain object-center" />
                      </picture>
                    </div>
                  </div>
                )
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="absolute left-3 top-1/2 z-30 -translate-y-1/2 sm:left-5 lg:left-7">
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={locale === "ar" ? "الشريحة السابقة" : "Previous slide"}
          onClick={prev}
          disabled={active === 0}
          className="h-10 w-10 rounded-full border-white/60 bg-white/15 text-white backdrop-blur-sm hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {locale === "ar" ? "‹" : "‹"}
        </Button>
      </div>

      <div className="absolute right-3 top-1/2 z-30 -translate-y-1/2 sm:right-5 lg:right-7">
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={locale === "ar" ? "الشريحة التالية" : "Next slide"}
          onClick={next}
          disabled={active === banners.length - 1}
          className="h-10 w-10 rounded-full border-white/60 bg-white/15 text-white backdrop-blur-sm hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {locale === "ar" ? "›" : "›"}
        </Button>
      </div>

      <div className="absolute inset-x-0 bottom-4 z-30 flex items-center justify-center gap-2 sm:bottom-5">
        {banners.map((banner, index) => (
          <button
            key={`${id}-dot-${index}`}
            type="button"
            aria-label={locale === "ar" ? `الانتقال إلى الشريحة ${index + 1}` : `Go to slide ${index + 1}`}
            onClick={() => goTo(index)}
            className={`h-2.5 rounded-full transition-[width,background-color] ${index === active ? "w-9 bg-white" : "w-2.5 bg-white/50 hover:bg-white/80"}`}
          />
        ))}
      </div>
    </div>
  );
}
