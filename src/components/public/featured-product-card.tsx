"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { PublicImageSlot } from "@/components/public/public-image-slot";
import { localePath } from "@/lib/locales";

export function FeaturedProductCard({
  locale,
  product,
  viewDetailsLabel,
  requestQuoteLabel,
}: {
  locale: "en" | "ar";
  product: {
    slug: string;
    name: string;
    shortDescription?: string | null;
    primaryImageUrl?: string | null;
    primaryImageAlt?: string | null;
  };
  viewDetailsLabel: string;
  requestQuoteLabel: string;
}) {
  const titleRef = useRef<HTMLButtonElement | null>(null);
  const descriptionRef = useRef<HTMLButtonElement | null>(null);
  const [titleTruncated, setTitleTruncated] = useState(false);
  const [descriptionTruncated, setDescriptionTruncated] = useState(false);
  const [expandedField, setExpandedField] = useState<"title" | "description" | null>(null);
  const description = product.shortDescription ?? "";

  useEffect(() => {
    const measure = () => {
      const title = titleRef.current;
      const descriptionElement = descriptionRef.current;
      setTitleTruncated(Boolean(title && title.scrollHeight > title.clientHeight + 1));
      setDescriptionTruncated(Boolean(descriptionElement && descriptionElement.scrollHeight > descriptionElement.clientHeight + 1));
    };

    measure();
    const observer = new ResizeObserver(measure);
    if (titleRef.current) observer.observe(titleRef.current);
    if (descriptionRef.current) observer.observe(descriptionRef.current);
    return () => observer.disconnect();
  }, [product.name, description]);

  const expandedText = expandedField === "title" ? product.name : description;
  const expandedLabel = expandedField === "title" ? product.name : description;

  return (
    <>
      <article className="flex h-[424px] w-full min-w-0 flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--brand-border)] bg-white shadow-[var(--shadow-sm)] sm:h-[410px] xl:h-[430px]">
        <div className="flex h-[190px] min-h-0 shrink-0 items-center justify-center px-2 pt-2 sm:h-[210px] xl:h-[220px]">
          <PublicImageSlot
            src={product.primaryImageUrl ?? null}
            alt={product.primaryImageAlt ?? product.name}
            variant="product-card"
            sizes="(max-width: 768px) 84vw, (max-width: 1280px) 50vw, 33vw"
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col p-5 pt-4">
          <div className="flex h-4 shrink-0 items-center" aria-hidden="true" />
          <div className="flex min-h-0 flex-1 flex-col">
            <button
              ref={titleRef}
              type="button"
              className="line-clamp-2 h-[3.5rem] shrink-0 min-w-0 overflow-hidden text-start text-xl font-semibold text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
              onClick={() => titleTruncated && setExpandedField("title")}
              aria-label={titleTruncated ? `${product.name}: show full title` : product.name}
            >
              {product.name}
            </button>
            <button
              ref={descriptionRef}
              type="button"
              className="mt-2 line-clamp-3 h-[4.5rem] min-w-0 overflow-hidden text-start text-sm leading-6 text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
              onClick={() => descriptionTruncated && setExpandedField("description")}
              aria-label={descriptionTruncated ? `${product.name}: show full description` : description || "No description"}
            >
              {description || "\u00a0"}
            </button>
            {titleTruncated || descriptionTruncated ? (
              <span className="sr-only">More product information is available.</span>
            ) : null}
          </div>

          <div className="flex h-10 shrink-0 items-center justify-between gap-3 pt-2">
            <Link href={`/${locale}/products/${product.slug}`} className="min-w-0 text-sm font-medium text-[var(--brand-primary)] hover:text-[var(--brand-primary-dark)]">
              {viewDetailsLabel}
            </Link>
            <Link href={localePath(locale, `/request-quote?source=PRODUCT&product=${encodeURIComponent(product.slug)}`)}>
              <Button type="button" variant="primary" size="sm">{requestQuoteLabel}</Button>
            </Link>
          </div>
        </div>
      </article>

      {expandedField ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation" onClick={() => setExpandedField(null)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-label={expandedLabel}
            className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-[var(--radius-lg)] bg-white p-5 shadow-[var(--shadow-lg)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">{expandedField === "title" ? "Full title" : "Full description"}</h2>
              <button type="button" className="shrink-0 rounded-full px-2 py-1 text-xl leading-none text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]" onClick={() => setExpandedField(null)} aria-label="Close">&times;</button>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[var(--text-muted)]">{expandedText}</p>
          </section>
        </div>
      ) : null}
    </>
  );
}
