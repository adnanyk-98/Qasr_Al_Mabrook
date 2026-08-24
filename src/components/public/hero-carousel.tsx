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
  const containerWidthRef = useRef<number>(0);
  const pointerIdRef = useRef<number | null>(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const dragXRef = useRef(0);
  const isDraggingRef = useRef(false);
  const suppressClickRef = useRef(false);
  const autoplayTimerRef = useRef<number | null>(null);

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
      // reset autoplay timer on manual navigation
      if (autoplay) {
        if (autoplayTimerRef.current) window.clearInterval(autoplayTimerRef.current);
        if (!reducedMotion && banners.length > 1) {
          autoplayTimerRef.current = window.setInterval(() => setActive((c) => (c + 1) % banners.length), autoplayInterval);
        }
      }
    },
    [autoplay, autoplayInterval, banners.length, reducedMotion],
  );

  const prev = useCallback(() => goTo(active - 1), [active, goTo]);
  const next = useCallback(() => goTo(active + 1), [active, goTo]);

  useEffect(() => {
    // centralised autoplay management
    if (!autoplay || reducedMotion || banners.length <= 1) return;
    if (autoplayTimerRef.current) window.clearInterval(autoplayTimerRef.current);
    autoplayTimerRef.current = window.setInterval(() => {
      setActive((current) => (current + 1) % banners.length);
    }, autoplayInterval);
    return () => {
      if (autoplayTimerRef.current) window.clearInterval(autoplayTimerRef.current);
      autoplayTimerRef.current = null;
    };
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

  // measure container width for pixel-based translate during drag
  useEffect(() => {
    const setWidth = () => {
      if (!rootRef.current) return;
      const el = rootRef.current.querySelector('.relative.w-full.overflow-hidden') as HTMLElement | null;
      const rect = el ? el.getBoundingClientRect() : rootRef.current.getBoundingClientRect();
      containerWidthRef.current = Math.max(0, rect.width || 0);
    };
    setWidth();
    window.addEventListener('resize', setWidth);
    return () => window.removeEventListener('resize', setWidth);
  }, []);

  // Pointer / touch handlers for swipe gestures
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const container = root.querySelector('.relative.w-full.overflow-hidden') as HTMLElement | null;
    const slider = container?.querySelector('.w-full.flex') as HTMLElement | null;
    if (!container || !slider) return;

    const THRESHOLD = 60; // px
    const START_MIN = 8; // px before beginning drag
    // Ensure vertical page scrolling remains natural while allowing horizontal swipes
    // Use pan-y so vertical scrolling is preserved
    container.style.touchAction = container.style.touchAction || 'pan-y';

    // track the element that has pointer capture so we can release it reliably
    let capturedElement: HTMLElement | null = null;

    const onPointerDown = (e: PointerEvent) => {
      // only left button / touch
      if ((e as any).button && (e as any).button !== 0) return;
      pointerIdRef.current = e.pointerId;
      startXRef.current = e.clientX;
      startYRef.current = e.clientY;
      dragXRef.current = 0;
      isDraggingRef.current = false;
      suppressClickRef.current = false;
      // set pointer capture on the element we attached listener to (container)
      try {
        (container as HTMLElement).setPointerCapture?.(e.pointerId);
        capturedElement = container;
      } catch {
        capturedElement = (e.target as HTMLElement) ?? null;
        try { capturedElement?.setPointerCapture?.(e.pointerId); } catch {}
      }
      window.addEventListener('pointermove', onPointerMove, { passive: false });
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerCancel);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (pointerIdRef.current !== e.pointerId) return;
      const dx = e.clientX - startXRef.current;
      const dy = e.clientY - startYRef.current;

      // if not yet dragging, determine whether to start
      if (!isDraggingRef.current) {
        if (Math.abs(dx) > START_MIN && Math.abs(dx) > Math.abs(dy)) {
          isDraggingRef.current = true;
          // prevent page scroll once we have decided this is a horizontal drag
          e.preventDefault();
          if (autoplayTimerRef.current) window.clearInterval(autoplayTimerRef.current);
        } else if (Math.abs(dy) > START_MIN && Math.abs(dy) > Math.abs(dx)) {
          // vertical scroll — cancel gesture handling
          pointerIdRef.current = null;
          window.removeEventListener('pointermove', onPointerMove);
          window.removeEventListener('pointerup', onPointerUp);
          return;
        } else {
          return;
        }
      }

      // dragging
      dragXRef.current = dx;
      suppressClickRef.current = Math.abs(dx) > START_MIN;
      // apply pixel transform while dragging
      const width = containerWidthRef.current || container.getBoundingClientRect().width;
      const base = -active * width;
      slider.style.transition = 'none';
      slider.style.transform = `translateX(${base + dragXRef.current}px)`;
    };

    const onPointerUp = (e: PointerEvent) => {
      if (pointerIdRef.current !== e.pointerId) return;
      try { capturedElement?.releasePointerCapture?.(e.pointerId); } catch {}
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      window.removeEventListener('pointercancel', onPointerCancel);

      if (!isDraggingRef.current) {
        pointerIdRef.current = null;
        return;
      }

      const dx = dragXRef.current;
      const width = containerWidthRef.current || container.getBoundingClientRect().width;
      slider.style.transition = '';
      // decide change
      if (Math.abs(dx) > THRESHOLD) {
        if (dx < 0) {
          setActive((c) => Math.min(c + 1, banners.length - 1));
        } else {
          setActive((c) => Math.max(c - 1, 0));
        }
      } else {
        // snap back
        slider.style.transform = `translateX(${-active * width}px)`;
      }

      // small delay to allow transition to run then clear dragging state
      setTimeout(() => {
        dragXRef.current = 0;
        isDraggingRef.current = false;
        pointerIdRef.current = null;
        capturedElement = null;
      }, 50);

      // restart autoplay timer
      if (autoplay && !reducedMotion && banners.length > 1) {
        if (autoplayTimerRef.current) window.clearInterval(autoplayTimerRef.current);
        autoplayTimerRef.current = window.setInterval(() => setActive((c) => (c + 1) % banners.length), autoplayInterval);
      }
    };

    const onPointerCancel = (e: PointerEvent) => {
      if (pointerIdRef.current !== e.pointerId) return;
      try { capturedElement?.releasePointerCapture?.(e.pointerId); } catch {}
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
      dragXRef.current = 0;
      isDraggingRef.current = false;
      pointerIdRef.current = null;
      capturedElement = null;
      // snap back
      const width = containerWidthRef.current || container.getBoundingClientRect().width;
      slider.style.transition = '';
      slider.style.transform = `translateX(${-active * width}px)`;
    };

    container.addEventListener('pointerdown', onPointerDown);
    return () => {
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [active, autoplay, autoplayInterval, banners.length, reducedMotion]);

  // sync slider transform when active changes (non-dragging)
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const container = root.querySelector('.relative.w-full.overflow-hidden') as HTMLElement | null;
    const slider = container?.querySelector('.w-full.flex') as HTMLElement | null;
    if (!container || !slider) return;
    const width = containerWidthRef.current || container.getBoundingClientRect().width;
    slider.style.transition = '';
    slider.style.transform = `translateX(${-active * width}px)`;
  }, [active]);

  if (!banners.length) {
    return null;
  }

  return (
    <div
      ref={rootRef}
      id={id}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className="relative overflow-hidden border border-[var(--brand-border)] bg-[var(--brand-surface-alt)] shadow-[var(--shadow-md)]"
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
                  <Link
                    href={banner.ctaHref}
                    aria-label={banner.title ?? banner.imageAlt ?? `Hero banner ${index + 1}`}
                    className="block w-full h-full"
                    onClick={(e) => {
                      if (suppressClickRef.current) {
                        e.preventDefault();
                        e.stopPropagation();
                        suppressClickRef.current = false;
                      }
                    }}
                  >
                    {/* Responsive picture: mobile source first, desktop as fallback */}
                    <div className="relative w-full aspect-[9/10] md:aspect-[8/3] overflow-hidden">
                      <picture>
                        {banner.mobileImageUrl ? <source media="(max-width: 767px)" srcSet={banner.mobileImageUrl} /> : null}
                        <img src={banner.desktopImageUrl ?? banner.imageUrl ?? ''} alt={banner.imageAlt ?? banner.title ?? `Hero banner ${index + 1}`} className="w-full h-full object-contain object-center" />
                      </picture>
                    </div>
                  </Link>
                ) : (
                  <div className="block w-full h-full">
                    <div className="relative w-full aspect-[9/10] md:aspect-[8/3] overflow-hidden">
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
    // keep slider synced to active when not dragging
    // update transform in JS to pixel values for smooth transition
  );
}
