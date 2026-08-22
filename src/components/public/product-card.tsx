import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PublicImageSlot } from "@/components/public/public-image-slot";
import { localePath } from "@/lib/locales";
import { getTranslations } from "next-intl/server";

export type PublicProductCardProps = {
  locale: "en" | "ar";
  product: {
    id: string;
    slug: string;
    name: string;
    shortDescription?: string | null;
    primaryImageId?: string | null;
    primaryImageUrl?: string | null;
    primaryImageAlt?: string | null;
  };
  imageUrl?: string | null;
  categoryName?: string | null;
  showCategory?: boolean;
};

export async function ProductCard({ locale, product, imageUrl, categoryName, showCategory = false }: PublicProductCardProps) {
  const t = await getTranslations({ locale, namespace: "common" });
  const href = `/${locale}/products/${product.slug}`;
  const resolvedImageUrl = imageUrl ?? product.primaryImageUrl ?? null;

  return (
    <article className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--brand-border)] bg-white shadow-[var(--shadow-sm)]">
      <PublicImageSlot
        src={resolvedImageUrl}
        alt={product.primaryImageAlt ?? product.name}
        variant="product-card"
        sizes="(max-width: 768px) 100vw, 33vw"
      />

      <div className="space-y-4 p-5">
        {showCategory && categoryName ? (
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--brand-primary)]">{categoryName}</p>
        ) : null}

        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-[var(--foreground)]">{product.name}</h3>
          {product.shortDescription ? (
            <p className="line-clamp-3 text-sm leading-6 text-[var(--text-muted)]">{product.shortDescription}</p>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          <Link href={href} className="text-sm font-medium text-[var(--brand-primary)] hover:text-[var(--brand-primary-dark)]">
            {t("viewDetails")}
          </Link>
          <Link href={localePath(locale, `/request-quote?source=PRODUCT&product=${encodeURIComponent(product.slug)}`)}>
            <Button type="button" variant="primary" size="sm">{t("requestQuote")}</Button>
          </Link>
        </div>
      </div>
    </article>
  );
}
