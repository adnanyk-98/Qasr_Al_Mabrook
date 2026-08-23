import Link from "next/link";

import { localePath, type Locale } from "@/lib/locales";
import { PublicImageSlot } from "@/components/public/public-image-slot";
import { getTranslations } from "next-intl/server";

export async function CategoryCard({
  locale,
  slug,
  name,
  description,
  imageUrl,
  imageAlt,
}: {
  locale: Locale;
  slug: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
}) {
  const t = await getTranslations({ locale, namespace: "common" });
  return (
    <Link href={localePath(locale, `/categories/${slug}`)} className="group flex h-full flex-col rounded-[var(--radius-lg)] border border-[var(--brand-border)] bg-white p-3 shadow-[var(--shadow-sm)] transition-colors hover:border-[var(--brand-primary)]">
      <div className="px-1 pb-0 pt-1">
        <PublicImageSlot
          src={imageUrl}
          alt={imageAlt ?? name}
          variant="category-card"
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 25vw"
          fallbackLabel={t("categoryImage")}
        />
      </div>
      <div className="mt-4 flex flex-1 flex-col">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--brand-primary)]">{slug}</p>
        <h2 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">{name}</h2>
        {description ? <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{description}</p> : null}
      </div>
    </Link>
  );
}
