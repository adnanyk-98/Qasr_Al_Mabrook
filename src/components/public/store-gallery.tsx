"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type StorePhoto = { src: string; alt: string };

export function StoreGallery({ photos, label, closeLabel, previousLabel, nextLabel }: { photos: StorePhoto[]; label: string; closeLabel: string; previousLabel: string; nextLabel: string }) {
  const [selected, setSelected] = useState<number | null>(null);
  const swipeStartX = useRef<number | null>(null);

  useEffect(() => {
    if (selected === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
      if (event.key === "ArrowLeft") setSelected((current) => current === null ? current : (current + photos.length - 1) % photos.length);
      if (event.key === "ArrowRight") setSelected((current) => current === null ? current : (current + 1) % photos.length);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [photos.length, selected]);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4" aria-label={label}>
        {photos.map((photo, index) => (
          <button
            key={photo.src}
            type="button"
            aria-label={photo.alt}
            onClick={() => setSelected(index)}
            className={`group relative overflow-hidden rounded-[var(--radius-md)] border border-[var(--brand-border)] bg-[var(--brand-surface-alt)] text-left shadow-[var(--shadow-sm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-4 ${index === 0 || index === 5 ? "col-span-2 aspect-[16/9] lg:col-span-2 lg:aspect-[16/9]" : "aspect-[4/5]"}`}
          >
            <Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
          </button>
        ))}
      </div>

      {selected !== null ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 sm:p-8" role="dialog" aria-modal="true" aria-label={photos[selected].alt} onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
          <div
            className="relative flex max-h-full w-full max-w-6xl items-center justify-center"
            onPointerDown={(event) => { swipeStartX.current = event.clientX; }}
            onPointerUp={(event) => {
              if (swipeStartX.current === null) return;
              const delta = event.clientX - swipeStartX.current;
              swipeStartX.current = null;
              if (Math.abs(delta) < 50) return;
              setSelected((current) => current === null ? current : delta < 0 ? (current + 1) % photos.length : (current + photos.length - 1) % photos.length);
            }}
            onPointerCancel={() => { swipeStartX.current = null; }}
          >
            <Image src={photos[selected].src} alt={photos[selected].alt} width={1600} height={1200} className="max-h-[85vh] w-auto max-w-full object-contain" priority />
            <button type="button" aria-label={closeLabel} onClick={() => setSelected(null)} className="absolute right-2 top-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl text-[var(--foreground)] shadow-[var(--shadow-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">×</button>
            <button type="button" aria-label={previousLabel} onClick={() => setSelected((selected + photos.length - 1) % photos.length)} className="absolute left-2 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-2xl text-[var(--foreground)] shadow-[var(--shadow-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">‹</button>
            <button type="button" aria-label={nextLabel} onClick={() => setSelected((selected + 1) % photos.length)} className="absolute right-2 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-2xl text-[var(--foreground)] shadow-[var(--shadow-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">›</button>
          </div>
        </div>
      ) : null}
    </>
  );
}