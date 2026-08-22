import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { Container, Section } from "@/components/ui/layout";
import { ProductCard } from "@/components/public/product-card";
import { PublicShell } from "@/components/public/public-shell";
import { EmptyState } from "@/components/public/state-card";
import { localePath, locales, type Locale } from "@/lib/locales";
import { listFilterableAttributes, listPublishedProductsPage } from "@/server/repositories/public-catalog";
import { getTranslations } from "next-intl/server";
import { createPublicPageMetadata, shouldNoindexFilteredView } from "@/lib/seo";

export async function generateMetadata({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string; page?: string; category?: string; [key: string]: string | string[] | undefined }> }): Promise<Metadata> {
  const { locale } = await params;
  const query = await searchParams;
  
  if (!locales.includes(locale as Locale)) return {};
  
  const t = await getTranslations({ locale: locale as Locale, namespace: "metadata" });
  const currentLocale = locale as Locale;
  
  // Check if this is a filtered view (search, filters, etc.)
  const isFiltered = shouldNoindexFilteredView(query);
  
  const metadata = createPublicPageMetadata({
    locale: currentLocale,
    path: "/products",
    title: t("productsTitle"),
    description: t("productsDescription"),
  });
  
  // Add noindex for filtered views to prevent index bloat
  if (isFiltered) {
    metadata.robots = "noindex, follow";
  }
  
  return metadata;
}

export default async function ProductListingPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string; page?: string; category?: string; [key: string]: string | string[] | undefined }> }) {
  const { locale } = await params;
  const query = await searchParams;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const currentLocale = locale as Locale;
  const t = await getTranslations({ locale: currentLocale, namespace: "products" });
  const common = await getTranslations({ locale: currentLocale, namespace: "common" });
  const filterableAttributes = await listFilterableAttributes(currentLocale);
  const page = Number(query.page ?? "1");
  const filters = Object.fromEntries(
    Object.entries(query).filter(([key]) => key !== "q" && key !== "page" && key !== "category" && key !== "locale"),
  );

  const result = await listPublishedProductsPage(currentLocale, {
    search: typeof query.q === "string" ? query.q : undefined,
    categoryId: typeof query.category === "string" ? query.category : undefined,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    filters: Object.fromEntries(Object.entries(filters).map(([key, value]) => [key, Array.isArray(value) ? value : [value]].filter((item) => item.length > 0))),
  });

  return (
    <PublicShell locale={currentLocale} path={`/products${Object.keys(query).length ? `?${new URLSearchParams(Object.entries(query).flatMap(([key, value]) => Array.isArray(value) ? value.map((item) => [key, item] as [string, string]) : typeof value === "string" ? [[key, value] as [string, string]] : [])).toString()}` : ""}`}>
      <Section>
        <Container className="space-y-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">
                {t("eyebrow")}
              </p>
              <h1 className="mt-1 text-4xl font-semibold text-[var(--foreground)]">
                {t("title")}
              </h1>
            </div>
            <div className="text-sm text-[var(--text-muted)]">
              {result.total} {common("results")}
            </div>
          </div>

          {filterableAttributes.length > 0 ? (
            <div className="grid gap-4 rounded-[var(--radius-lg)] border border-[var(--brand-border)] bg-white p-5 shadow-[var(--shadow-sm)] md:grid-cols-2 xl:grid-cols-3">
              {filterableAttributes.map((attribute) => (
                <div key={attribute.attributeId} className="space-y-2">
                  <p className="text-sm font-medium text-[var(--foreground)]">{attribute.attributeName}</p>
                  <div className="flex flex-wrap gap-2">
                    {attribute.options.map((option) => {
                      const nextParams = new URLSearchParams(
                        Object.entries(query).reduce<Record<string, string>>((acc, [key, value]) => {
                          if (typeof value === "string") acc[key] = value;
                          if (Array.isArray(value)) acc[key] = value.join(",");
                          return acc;
                        }, {}),
                      );

                      nextParams.set(attribute.attributeId, option.valueId);

                      return (
                        <Link
                          key={option.valueId}
                          href={localePath(currentLocale, `/products?${nextParams.toString()}`)}
                          className="rounded-full border border-[var(--brand-border)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] transition hover:border-[var(--brand-primary)]"
                        >
                          {option.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {result.total === 0 ? (
            <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {result.products.map((product) => (
                  <ProductCard
                    key={product.id}
                    locale={currentLocale}
                    product={product}
                  />
                ))}
              </div>

              {result.totalPages > 1 ? (
                <div className="flex items-center justify-center gap-3 pt-4">
                  {result.page > 1 ? (
                    <Link href={localePath(currentLocale, `/products?page=${result.page - 1}`)} className="rounded-full border border-[var(--brand-border)] px-4 py-2 text-sm font-medium text-[var(--foreground)]">
                      {common("previous")}
                    </Link>
                  ) : null}
                  <span className="text-sm text-[var(--text-muted)]">
                    {result.page} / {result.totalPages}
                  </span>
                  {result.page < result.totalPages ? (
                    <Link href={localePath(currentLocale, `/products?page=${result.page + 1}`)} className="rounded-full border border-[var(--brand-border)] px-4 py-2 text-sm font-medium text-[var(--foreground)]">
                      {common("next")}
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </>
          )}
        </Container>
      </Section>
    </PublicShell>
  );
}
