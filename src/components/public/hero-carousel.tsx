"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PublicImageSlot } from "@/components/public/public-image-slot";
import { localizedHref } from "@/lib/locales";

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
  const [active, setActive] = useState(1); // Start at 1 (first real slide in infinite track)
  const [reducedMotion, setReducedMotion] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const isRepositioningRef = useRef(false); // Prevent state resets during silent repositioning
  const preventNativeDrag = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };
  const containerWidthRef = useRef<number>(0);
  const pointerIdRef = useRef<number | null>(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const dragXRef = useRef(0);
  const isDraggingRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const suppressClickRef = useRef(false);
  const autoplayTimerRef = useRef<number | null>(null);
  const direction = locale === "ar" ? 1 : -1;
  
  const bannerSignature = useMemo(
    () => banners.map((banner) => [banner.desktopImageUrl, banner.mobileImageUrl, banner.imageUrl, banner.title, banner.subtitle, banner.ctaLabel, banner.ctaHref].join("\u0001")).join("\u0002"),
    [banners],
  );

  // Create infinite track with cloned slides: [clone last, ...real slides, clone first]
  const infiniteTrack = useMemo(() => {
    if (!banners.length) return [];
    return [
      banners[banners.length - 1], // clone of last slide
      ...banners,
      banners[0], // clone of first slide
    ];
  }, [banners]);

  // Map internal index to real slide index for indicators
  const getRealSlideIndex = useCallback((internalIndex: number) => {
    if (banners.length === 0) return 0;
    const realIndex = ((internalIndex - 1) % banners.length + banners.length) % banners.length;
    return realIndex;
  }, [banners.length]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mediaQuery.matches);
    sync();
    mediaQuery.addEventListener("change", sync);
    return () => mediaQuery.removeEventListener("change", sync);
  }, []);

  const goTo = useCallback(
    (index: number) => {
      setActive(index);
      // reset autoplay timer on manual navigation
      if (autoplay) {
        if (autoplayTimerRef.current) window.clearInterval(autoplayTimerRef.current);
        if (!reducedMotion && banners.length > 1) {
          autoplayTimerRef.current = window.setInterval(() => {
            setActive((c) => c + 1);
          }, autoplayInterval);
        }
      }
    },
    [autoplay, autoplayInterval, banners.length, reducedMotion],
  );

  const prev = useCallback(() => goTo(active - 1), [active, goTo]);
  const next = useCallback(() => goTo(active + 1), [active, goTo]);

  useEffect(() => {
    setActive(1); // Reset to first real slide
    dragXRef.current = 0;
    isDraggingRef.current = false;
    hasDraggedRef.current = false;
    suppressClickRef.current = false;
    isRepositioningRef.current = false;
  }, [locale, bannerSignature]);

  useEffect(() => {
    // centralised autoplay management with infinite looping
    if (!autoplay || reducedMotion || banners.length <= 1) return;
    if (autoplayTimerRef.current) window.clearInterval(autoplayTimerRef.current);
    autoplayTimerRef.current = window.setInterval(() => {
      setActive((current) => current + 1);
    }, autoplayInterval);
    return () => {
      if (autoplayTimerRef.current) window.clearInterval(autoplayTimerRef.current);
      autoplayTimerRef.current = null;
    };
  }, [autoplay, autoplayInterval, banners.length, reducedMotion]);

  // Handle infinite loop repositioning
  // Handle infinite loop repositioning when transition completes
  useEffect(() => {
    if (!rootRef.current || banners.length === 0) return;
    const container = rootRef.current.querySelector('.relative.w-full.overflow-hidden') as HTMLElement | null;
    const slider = container?.querySelector('.w-full.flex') as HTMLElement | null;
    if (!container || !slider) return;
    const handleTransitionEnd = () => {
      if (active === 0) {
        isRepositioningRef.current = true;
        slider.style.transition = 'none';
        slider.style.transform = `translateX(${direction * banners.length * 100}%)`;
        setActive(banners.length);
        requestAnimationFrame(() => { isRepositioningRef.current = false; });
      } else if (active === infiniteTrack.length - 1) {
        isRepositioningRef.current = true;
        slider.style.transition = 'none';
        slider.style.transform = `translateX(${direction * 100}%)`;
        setActive(1);
        requestAnimationFrame(() => { isRepositioningRef.current = false; });
      }
    };
    slider.addEventListener('transitionend', handleTransitionEnd);
    return () => slider.removeEventListener('transitionend', handleTransitionEnd);
  }, [active, banners.length, direction, infiniteTrack.length]);

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
      if (event.key === "Home") { event.preventDefault(); goTo(1); }
      if (event.key === "End") { event.preventDefault(); goTo(banners.length); }
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
      hasDraggedRef.current = false;
      suppressClickRef.current = false;
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
        if (Math.abs(dx) > THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
          isDraggingRef.current = true;
          hasDraggedRef.current = true;
          try {
            container.setPointerCapture(e.pointerId);
            capturedElement = container;
          } catch {
            capturedElement = (e.target as HTMLElement) ?? null;
            try { capturedElement?.setPointerCapture?.(e.pointerId); } catch {}
          }
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
      suppressClickRef.current = Math.abs(dx) > THRESHOLD;
      // apply pixel transform while dragging
      const width = containerWidthRef.current || container.getBoundingClientRect().width;
      const base = direction * active * width;
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
        hasDraggedRef.current = false;
        suppressClickRef.current = false;
        // Manually trigger click on active link only for very small movements (< 10px)
        const dx = dragXRef.current;
        if (Math.abs(dx) < 10) {
          setTimeout(() => {
            const slides = container?.querySelectorAll('.min-w-full') as NodeListOf<HTMLElement>;
            if (slides && slides[active]) {
              const link = slides[active].querySelector('a[href]') as HTMLAnchorElement;
              if (link) {
                link.click();
              }
            }
          }, 0);
        }
        return;
      }

      const dx = dragXRef.current;
      const width = containerWidthRef.current || container.getBoundingClientRect().width;
      slider.style.transition = '';
      // decide change with infinite looping
      if (Math.abs(dx) > THRESHOLD) {
        if (dx < 0) {
          setActive((c) => c + 1);
        } else {
          setActive((c) => c - 1);
        }
      } else {
        // snap back
        slider.style.transform = `translateX(${direction * active * width}px)`;
      }

      // small delay to allow transition to run then clear dragging state
      setTimeout(() => {
        dragXRef.current = 0;
        isDraggingRef.current = false;
        pointerIdRef.current = null;
        capturedElement = null;
        hasDraggedRef.current = false;
      }, 50);

      // restart autoplay timer with infinite looping
      if (autoplay && !reducedMotion && banners.length > 1) {
        if (autoplayTimerRef.current) window.clearInterval(autoplayTimerRef.current);
        autoplayTimerRef.current = window.setInterval(() => setActive((c) => c + 1), autoplayInterval);
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
      hasDraggedRef.current = false;
      suppressClickRef.current = false;
      // snap back
      const width = containerWidthRef.current || container.getBoundingClientRect().width;
      slider.style.transition = '';
      slider.style.transform = `translateX(${direction * active * width}px)`;
    };

    const onContainerClick = (e: MouseEvent) => {
      // If this click happened after a drag, prevent it; otherwise allow it to bubble to the link
      if (hasDraggedRef.current) {
        e.preventDefault();
        e.stopPropagation();
        hasDraggedRef.current = false;
      }
    };

    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('click', onContainerClick, true);
    return () => {
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('click', onContainerClick, true);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [active, autoplay, autoplayInterval, banners.length, direction, reducedMotion]);

  // sync slider transform when active changes (non-dragging)

  // sync slider transform when active changes (non-dragging)
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const container = root.querySelector('.relative.w-full.overflow-hidden') as HTMLElement | null;
    const slider = container?.querySelector('.w-full.flex') as HTMLElement | null;
    if (!container || !slider) return;
    
    const width = containerWidthRef.current || container.getBoundingClientRect().width;
    
    if (isRepositioningRef.current) {
      // During repositioning, ensure transition is disabled
      slider.style.transition = 'none';
      slider.style.transform = `translateX(${direction * active * width}px)`;
    } else {
      // After repositioning, re-enable the transition from CSS class
      slider.style.transition = '';
      slider.style.transform = `translateX(${direction * active * width}px)`;
    }
  }, [active, direction]);
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
          style={{ transform: `translateX(${direction * active * 100}%)` }}
        >
          {infiniteTrack.map((banner, index) => {
            const isClone = index === 0 || index === infiniteTrack.length - 1;
            return (
              <div 
                key={`${id}-${index}`} 
                className="min-w-full w-full shrink-0 relative"
                aria-hidden={isClone ? "true" : undefined}
              >
                {(banner.desktopImageUrl || banner.imageUrl) ? (
                  banner.ctaHref ? (
                    <Link
                      href={localizedHref(locale, banner.ctaHref)}
                      aria-label={banner.title ?? banner.imageAlt ?? `Hero banner ${getRealSlideIndex(index) + 1}`}
                      className="block w-full h-full"
                      draggable={false}
                      onDragStart={preventNativeDrag}
                      onDragStartCapture={preventNativeDrag}
                      onClick={(e) => {
                        if (suppressClickRef.current || hasDraggedRef.current) {
                          e.preventDefault();
                          e.stopPropagation();
                          suppressClickRef.current = false;
                          hasDraggedRef.current = false;
                        }
                      }}
                    >
                      {/* Responsive picture: mobile source first, desktop as fallback */}
                      <div className="relative w-full aspect-[9/10] md:aspect-[8/3] overflow-hidden">
                        <picture>
                          {banner.mobileImageUrl ? <source media="(max-width: 767px)" srcSet={banner.mobileImageUrl} /> : null}
                          <img
                            src={banner.desktopImageUrl ?? banner.imageUrl ?? ''}
                            alt={banner.imageAlt ?? banner.title ?? `Hero banner ${getRealSlideIndex(index) + 1}`}
                            draggable={false}
                            onDragStart={(event) => event.preventDefault()}
                            className="w-full h-full object-contain object-center"
                          />
                        </picture>
                      </div>
                    </Link>
                  ) : (
                    <div className="block w-full h-full">
                      <div className="relative w-full aspect-[9/10] md:aspect-[8/3] overflow-hidden">
                        <picture>
                          {banner.mobileImageUrl ? <source media="(max-width: 767px)" srcSet={banner.mobileImageUrl} /> : null}
                          <img
                            src={banner.desktopImageUrl ?? banner.imageUrl ?? ''}
                            alt={banner.imageAlt ?? banner.title ?? `Hero banner ${getRealSlideIndex(index) + 1}`}
                            draggable={false}
                            onDragStart={(event) => event.preventDefault()}
                            className="w-full h-full object-contain object-center"
                          />
                        </picture>
                      </div>
                    </div>
                  )
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-4 z-30 flex items-center justify-center gap-2 sm:bottom-5">
        {banners.map((banner, index) => (
          <button
            key={`${id}-dot-${index}`}
            type="button"
            aria-label={locale === "ar" ? `الانتقال إلى الشريحة ${index + 1}` : `Go to slide ${index + 1}`}
            onClick={() => goTo(index + 1)} // +1 because internal track starts at 1
            className={`h-2.5 rounded-full transition-[width,background-color] ${getRealSlideIndex(active) === index ? "w-9 bg-white" : "w-2.5 bg-white/50 hover:bg-white/80"}`}
          />
        ))}
      </div>
    </div>
  );
}
