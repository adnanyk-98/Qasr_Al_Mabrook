"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";

import { buildLoopedCategorySequence } from "@/lib/homepage-content";
import { localePath } from "@/lib/locales";

type CategoryMarqueeItem = {
  id: string;
  slug: string;
  name: string;
};


export function CategoryMarquee({ locale, categories }: { locale: "en" | "ar"; categories: CategoryMarqueeItem[] }) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ pointerId: number; startX: number; baseX: number } | null>(null);
  const suppressClickRef = useRef(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [slotWidth, setSlotWidth] = useState(0);
  const [orbSize, setOrbSize] = useState(0);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mediaQuery.matches);
    sync();
    mediaQuery.addEventListener("change", sync);
    return () => mediaQuery.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const resize = () => {
      const width = viewport.clientWidth;
      const viewportWidth = window.innerWidth;
      const visible = viewportWidth >= 1280 ? 4 : viewportWidth >= 768 ? 3 : 2;
      const targetMin = viewportWidth >= 1280 ? 150 : viewportWidth >= 768 ? 135 : 115;
      const targetMax = viewportWidth >= 1280 ? 165 : viewportWidth >= 768 ? 150 : 130;
      setSlotWidth(width / visible);
      setOrbSize(Math.min(targetMax, Math.max(targetMin, viewportWidth >= 1280 ? 160 : viewportWidth >= 768 ? 145 : 125)));
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  if (!categories.length) return null;

  const copies = Math.max(2, Math.ceil(12 / Math.max(categories.length, 1)));
  const loopItems = Array.from({ length: copies }, (_, copy) => categories.map((category) => ({ category, copy }))).flat();

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const track = trackRef.current;
    if (!track) return;
    const transform = getComputedStyle(track).transform;
    const matrixValues = transform.match(/matrix\(([^)]+)\)/)?.[1].split(",");
    const matrix = transform === "none" ? 0 : Number(matrixValues?.[4] ?? 0);
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, baseX: matrix };
    suppressClickRef.current = false;
    track.style.animationPlayState = "paused";
    track.style.transform = `translate3d(${matrix}px, 0, 0)`;
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    const track = trackRef.current;
    if (!drag || !track || drag.pointerId !== event.pointerId) return;
    if (Math.abs(event.clientX - drag.startX) > 8) {
      suppressClickRef.current = true;
      viewportRef.current?.setPointerCapture(event.pointerId);
    }
    track.style.transform = `translate3d(${drag.baseX + event.clientX - drag.startX}px, 0, 0)`;
  }

  function handlePointerEnd(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    const track = trackRef.current;
    if (!drag || !track || drag.pointerId !== event.pointerId) return;
    if (viewportRef.current?.hasPointerCapture(event.pointerId)) {
      viewportRef.current.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
    track.style.transform = "";
    track.style.animationPlayState = reducedMotion ? "paused" : "running";
  }

  return (
    <div
      ref={viewportRef}
      className="qam-category-viewport relative min-w-0 overflow-hidden py-3 touch-pan-y"
      role="region"
      aria-roledescription="carousel"
      aria-label={locale === "ar" ? "تصفح الفئات" : "Browse categories"}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
    >
      <div ref={trackRef} dir={locale === "ar" ? "rtl" : "ltr"} className={`qam-category-track flex w-max ${reducedMotion ? "[animation-play-state:paused]" : ""}`}>
        {loopItems.map(({ category, copy }, index) => (
          <Link
            key={`${category.id}-${copy}-${index}`}
            data-category-marquee-item
            href={localePath(locale, `/categories/${category.slug}`)}
            aria-label={category.name}
            aria-hidden={copy >= copies}
            tabIndex={copy >= copies ? -1 : undefined}
            style={{
              width: slotWidth || undefined,
              ["--category-float-delay" as string]: `${(index % Math.max(categories.length, 1)) * -0.7}s`,
            } as CSSProperties}
            className="group flex shrink-0 cursor-pointer flex-col items-center text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-4"
            onClick={(event) => {
              if (suppressClickRef.current) {
                event.preventDefault();
                event.stopPropagation();
              }
              suppressClickRef.current = false;
            }}
          >
            <span style={{ width: orbSize || undefined, height: orbSize || undefined }} className="qam-category-orb mx-auto flex shrink-0 cursor-pointer items-center justify-center rounded-full border border-[var(--brand-border)] bg-[radial-gradient(circle_at_35%_25%,#fff_0%,var(--brand-surface-alt)_62%,#eadfd9_100%)] px-4 text-center text-sm font-semibold text-[var(--foreground)] shadow-[0_10px_24px_rgba(91,15,19,0.1)] transition-[transform,box-shadow,border-color] duration-300 group-hover:-translate-y-1 group-hover:border-[var(--brand-primary)] group-hover:shadow-[0_14px_28px_rgba(91,15,19,0.16)] sm:px-6 sm:text-base">
              <span className="flex max-w-full flex-col items-center gap-3 break-words">
                <span className="max-w-full break-words">{category.name}</span>
                <span aria-hidden="true" className="h-px w-8 bg-[var(--brand-primary)] opacity-70" />
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}