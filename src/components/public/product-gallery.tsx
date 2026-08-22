"use client";

import Image from "next/image";
import { useState } from "react";

type ImageItem = {
  id: string;
  publicUrl: string;
  width?: number | null;
  height?: number | null;
  altTextEn?: string | null;
  altTextAr?: string | null;
  sortOrder?: number | null;
  isPrimary?: boolean;
};

export default function ProductGallery({
  images,
  locale = "en",
  productName,
}: {
  images: ImageItem[];
  locale?: "en" | "ar";
  productName?: string;
}) {
  // Keep only R2/http image URLs and dedupe by publicUrl (prefer first isPrimary)
  const filtered = (() => {
    const httpOnly = (images ?? []).filter((i) => typeof i.publicUrl === 'string' && /^https?:\/\//i.test(i.publicUrl));
    const map = new Map<string, ImageItem>();
    // prefer isPrimary when deduping
    httpOnly
      .sort((a, b) => (b.isPrimary === true ? 1 : 0) - (a.isPrimary === true ? 1 : 0))
      .forEach((img) => {
        if (!map.has(img.publicUrl)) map.set(img.publicUrl, img);
      });
    return Array.from(map.values()).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  })();

  const first = filtered[0] ?? null;

  const [selectedId, setSelectedId] = useState<string | null>(() => first?.id ?? null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const displayed = (hoveredId ? filtered.find((i) => i.id === hoveredId) : null) ?? filtered.find((i) => i.id === selectedId) ?? first;

  return (
    <div>
      <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--brand-border)] bg-white p-3 shadow-[var(--shadow-sm)]">
        {displayed ? (
          <div className="relative h-[440px] overflow-hidden rounded-[var(--radius-lg)] bg-[var(--brand-surface-alt)]">
            <Image
              src={displayed.publicUrl}
              alt={locale === "ar" ? displayed.altTextAr ?? displayed.altTextEn ?? productName ?? "" : displayed.altTextEn ?? displayed.altTextAr ?? productName ?? ""}
              fill
              sizes="(max-width: 768px) 100vw, 60vw"
              unoptimized
              className="object-contain object-center"
            />
          </div>
        ) : (
          <div className="flex h-[440px] items-center justify-center rounded-[var(--radius-lg)] bg-[var(--brand-surface-alt)] text-[var(--text-muted)]">No image</div>
        )}
      </div>

      {filtered.length > 1 ? (
        <div className="grid grid-cols-4 gap-3 mt-3">
          {filtered.map((image) => {
            const isSelected = image.id === selectedId;
            return (
              <button
                key={image.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => {
                  setSelectedId(image.id);
                  setHoveredId(null);
                }}
                onMouseEnter={() => setHoveredId(image.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`overflow-hidden rounded-[var(--radius-md)] border p-1 text-left transition ${isSelected ? 'border-[var(--brand-primary)]' : 'border-[var(--brand-border)]'}`}
              >
                <div className="relative h-20 overflow-hidden rounded-[var(--radius-sm)] bg-[var(--brand-surface-alt)]">
                  <Image src={image.publicUrl} alt={locale === "ar" ? image.altTextAr ?? image.altTextEn ?? productName ?? "" : image.altTextEn ?? image.altTextAr ?? productName ?? ""} fill sizes="(max-width: 768px) 25vw, 10vw" unoptimized className="object-contain object-center" />
                </div>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
