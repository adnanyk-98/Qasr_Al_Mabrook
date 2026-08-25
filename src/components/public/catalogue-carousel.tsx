"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

export function CatalogueCarousel({
  id,
  locale,
  title,
  viewAllLink,
  items,
  itemClassName,
  prevLabel,
  nextLabel,
  emptyState,
}: {
  id: string;
  locale: "en" | "ar";
  title: ReactNode;
  viewAllLink?: ReactNode;
  items: ReactNode[];
  itemClassName?: string;
  prevLabel: string;
  nextLabel: string;
  emptyState?: ReactNode;
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const updateBoundaryState = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }

    const maxScrollLeft = Math.max(scroller.scrollWidth - scroller.clientWidth, 0);
    setAtStart(scroller.scrollLeft <= 1);
    setAtEnd(scroller.scrollLeft >= maxScrollLeft - 1);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncReducedMotion = () => setReducedMotion(mediaQuery.matches);

    syncReducedMotion();
    mediaQuery.addEventListener("change", syncReducedMotion);

    return () => mediaQuery.removeEventListener("change", syncReducedMotion);
  }, []);

  useEffect(() => {
    updateBoundaryState();

    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }

    scroller.addEventListener("scroll", updateBoundaryState, { passive: true });
    window.addEventListener("resize", updateBoundaryState);

    return () => {
      scroller.removeEventListener("scroll", updateBoundaryState);
      window.removeEventListener("resize", updateBoundaryState);
    };
  }, [items, updateBoundaryState]);

  const scrollByCards = useCallback(
    (direction: 1 | -1) => {
      const scroller = scrollerRef.current;
      if (!scroller) {
        return;
      }

      const firstCard = scroller.querySelector("[data-carousel-card]") as HTMLElement | null;
      const gap = 16;
      const step = firstCard ? firstCard.getBoundingClientRect().width + gap : scroller.clientWidth * 0.8;

      scroller.scrollBy({
        left: step * direction,
        behavior: reducedMotion ? "auto" : "smooth",
      });
    },
    [reducedMotion],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (!(event.key === "ArrowRight" || event.key === "ArrowLeft" || event.key === "Home" || event.key === "End")) {
        return;
      }

      event.preventDefault();

      if (event.key === "Home") {
        scrollerRef.current?.scrollTo({ left: 0, behavior: reducedMotion ? "auto" : "smooth" });
        return;
      }

      if (event.key === "End") {
        scrollerRef.current?.scrollTo({ left: scrollerRef.current.scrollWidth, behavior: reducedMotion ? "auto" : "smooth" });
        return;
      }

      const isForward = locale === "ar" ? event.key === "ArrowLeft" : event.key === "ArrowRight";
      scrollByCards(isForward ? 1 : -1);
    },
    [locale, reducedMotion, scrollByCards],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        {title}

        <div className="flex items-center gap-3 sm:gap-4">
          {viewAllLink ? <div className="hidden sm:block">{viewAllLink}</div> : null}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label={prevLabel}
              disabled={atStart}
              className="h-9 w-9 rounded-full border-[var(--brand-border)] px-0 disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => scrollByCards(-1)}
            >
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4">
                <path
                  d={locale === "ar" ? "M12.5 5.5 7.5 10l5 4.5" : "M7.5 5.5 12.5 10l-5 4.5"}
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label={nextLabel}
              disabled={atEnd}
              className="h-9 w-9 rounded-full border-[var(--brand-border)] px-0 disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => scrollByCards(1)}
            >
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4">
                <path
                  d={locale === "ar" ? "M7.5 5.5 12.5 10l-5 4.5" : "M12.5 5.5 7.5 10l5 4.5"}
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Button>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6 text-sm text-[var(--text-muted)]">
          {emptyState ?? "No items available."}
        </div>
      ) : (
        <div
          id={id}
          ref={scrollerRef}
          dir={locale === "ar" ? "rtl" : "ltr"}
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
          aria-label={id}
          onKeyDown={handleKeyDown}
          className="overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="flex w-full items-stretch gap-4 md:gap-5 lg:gap-6">
            {items.map((item, index) => (
              <div
                key={index}
                data-carousel-card
                className={[
                  "flex shrink-0 snap-start",
                  itemClassName ?? "min-w-[85%] sm:min-w-[calc(50%-0.625rem)] xl:min-w-[calc(33.333%-1rem)]",
                ].join(" ")}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
