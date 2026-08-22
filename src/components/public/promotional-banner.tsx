import Link from "next/link";

import { localePath, type Locale } from "@/lib/locales";
import { PublicImageSlot } from "@/components/public/public-image-slot";
import { getTranslations } from "next-intl/server";

export async function PromotionalBanner({
  locale,
  title,
  subtitle,
  imageUrl,
  imageAlt,
  ctaLabel,
  ctaHref,
}: {
  locale: Locale;
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
  imageAlt: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  const t = await getTranslations({ locale, namespace: "home" });
  return (
    <article className="grid gap-6 rounded-[var(--radius-lg)] border border-[var(--brand-border)] bg-white p-6 shadow-[var(--shadow-sm)] lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
      {imageUrl ? (
        <PublicImageSlot src={imageUrl} alt={imageAlt} variant="homepage-banner" sizes="(max-width: 1024px) 100vw, 40vw" />
      ) : null}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--brand-primary)]">{t("promotionalSection")}</p>
        <h2 className="text-2xl font-semibold text-[var(--foreground)]">{title}</h2>
        {subtitle ? <p className="max-w-2xl text-sm leading-6 text-[var(--text-muted)]">{subtitle}</p> : null}
        {ctaLabel && ctaHref ? (
          <Link href={ctaHref.startsWith("/") ? localePath(locale, ctaHref) : ctaHref} className="inline-flex text-sm font-medium text-[var(--brand-primary)] hover:text-[var(--brand-primary-dark)]">
            {ctaLabel}
          </Link>
        ) : null}
      </div>
    </article>
  );
}
