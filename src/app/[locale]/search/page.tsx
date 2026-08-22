import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { Container, Section } from "@/components/ui/layout";
import { ProductCard } from "@/components/public/product-card";
import { PublicShell } from "@/components/public/public-shell";
import { EmptyState } from "@/components/public/state-card";
import { SearchForm } from "@/components/public/search-form";
import { searchPublishedProducts } from "@/server/repositories/public-catalog";
import { locales, type Locale } from "@/lib/locales";
import { getTranslations } from "next-intl/server";
import { createPublicPageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string }> }): Promise<Metadata> {
  const { locale } = await params;
  
  if (!locales.includes(locale as Locale)) return {};
  
  const t = await getTranslations({ locale: locale as Locale, namespace: "metadata" });
  const currentLocale = locale as Locale;
  
  const metadata = createPublicPageMetadata({
    locale: currentLocale,
    path: "/search",
    title: t("searchTitle"),
    description: t("searchDescription"),
  });
  
  // Search results are noindexed to prevent index bloat
  // Each unique search query would create a duplicate page
  metadata.robots = "noindex, follow";
  
  return metadata;
}

export default async function SearchPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string }> }) {
  const { locale } = await params;
  const query = await searchParams;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const currentLocale = locale as Locale;
  const t = await getTranslations({ locale: currentLocale, namespace: "search" });
  const searchTerm = typeof query.q === "string" ? query.q.trim() : "";
  const results = await searchPublishedProducts(currentLocale, searchTerm);

  return (
    <PublicShell locale={currentLocale} path={`/search${searchTerm ? `?q=${encodeURIComponent(searchTerm)}` : ""}`}>
      <Section>
        <Container className="space-y-8">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">
              {t("eyebrow")}
            </p>
            <h1 className="mt-1 text-4xl font-semibold text-[var(--foreground)]">
              {searchTerm ? searchTerm : t("title")}
            </h1>
            <div className="max-w-xl">
              <SearchForm locale={currentLocale} defaultValue={searchTerm} />
            </div>
          </div>

          {searchTerm === "" ? (
            <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
          ) : results.length === 0 ? (
            <EmptyState title={t("noResultsTitle")} description={t("noResultsDescription")} />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {results.map((product) => (
                <ProductCard
                  key={product.id}
                  locale={currentLocale}
                  product={product}
                />
              ))}
            </div>
          )}
        </Container>
      </Section>
    </PublicShell>
  );
}
