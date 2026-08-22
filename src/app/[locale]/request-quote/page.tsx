import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { EnquiryForm } from "@/components/public/enquiry-form";
import { PublicShell } from "@/components/public/public-shell";
import { Container, Section } from "@/components/ui/layout";
import { getProductBySlug, listVariantCombinationsForProduct } from "@/server/repositories/public-catalog";
import { localePath, locales, type Locale } from "@/lib/locales";
import { getTranslations } from "next-intl/server";
import { createPublicPageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) return {};
  
  const t = await getTranslations({ locale: locale as Locale, namespace: "metadata" });
  const currentLocale = locale as Locale;
  
  return createPublicPageMetadata({
    locale: currentLocale,
    path: "/request-quote",
    title: t("requestQuoteTitle"),
  });
}

export default async function RequestQuotePage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ source?: string; product?: string; variant?: string; success?: string; error?: string }> }) {
  const { locale } = await params;
  const query = await searchParams;

  if (!locales.includes(locale as Locale)) notFound();

  const currentLocale = locale as Locale;
  const t = await getTranslations({ locale: currentLocale, namespace: "enquiry" });
  const common = await getTranslations({ locale: currentLocale, namespace: "common" });
  const source = query.source === "PRODUCT" ? "PRODUCT" : "CONTACT";
  const product = query.product ? await getProductBySlug(currentLocale, query.product) : null;
  const variants = product ? await listVariantCombinationsForProduct(product.id) : [];
  const selectedVariant = variants.find((variant) => variant.id === query.variant) ?? null;

  return (
    <PublicShell locale={currentLocale} path={`/request-quote${Object.keys(query).length ? `?${new URLSearchParams(Object.entries(query).filter((entry): entry is [string, string] => typeof entry[1] === "string")).toString()}` : ""}`}>
      <Section>
        <Container className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-5">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">{t("getInTouch")}</p>
            <h1 className="text-4xl font-semibold text-[var(--foreground)]">{t("requestTitle")}</h1>
            <p className="text-base leading-7 text-[var(--text-muted)]">{t("requestDescription")}</p>
            <Link href={localePath(currentLocale, "/products")} className="text-sm font-medium text-[var(--brand-primary)]">{common("backToCatalogue")}</Link>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-[var(--brand-border)] bg-white p-6 shadow-[var(--shadow-sm)]">
            {query.success ? (
              <div className="space-y-4" role="status">
                <h2 className="text-2xl font-semibold text-[var(--foreground)]">{t("submitted")}</h2>
                <p className="text-sm leading-6 text-[var(--text-muted)]">{t("reference")}: {query.success}</p>
                <Link href={localePath(currentLocale, "/products")} className="text-sm font-medium text-[var(--brand-primary)]">{t("continueBrowsing")}</Link>
              </div>
            ) : product || source === "CONTACT" ? (
              <EnquiryForm
                locale={currentLocale}
                source={source}
                productSlug={product?.slug}
                productName={product?.name}
                variantId={selectedVariant?.id}
                variantSku={selectedVariant?.sku ?? product?.defaultSku}
                error={query.error}
              />
            ) : (
              <p className="text-sm text-[var(--text-muted)]">{t("productUnavailable")}</p>
            )}
          </div>
        </Container>
      </Section>
    </PublicShell>
  );
}
