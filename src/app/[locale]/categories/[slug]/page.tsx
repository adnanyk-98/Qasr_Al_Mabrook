import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { Container, Section } from "@/components/ui/layout";
import { ProductCard } from "@/components/public/product-card";
import { PublicShell } from "@/components/public/public-shell";
import { getCategoryBySlug, listCategoryProducts } from "@/server/repositories/public-catalog";
import { localePath, locales, type Locale } from "@/lib/locales";
import { createCategoryMetadata } from "@/lib/seo";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!locales.includes(locale as Locale)) return {};
  
  const category = await getCategoryBySlug(locale as Locale, slug);
  if (!category) return {};
  
  const currentLocale = locale as Locale;
  const alternateCategory = await getCategoryBySlug(currentLocale === "en" ? "ar" : "en", slug);

  return createCategoryMetadata({
    locale: currentLocale,
    path: `/categories/${slug}`,
    categoryName: category.name,
    seoTitle: category.seoTitle,
    seoDescription: category.seoDescription,
    description: category.description,
    hasAlternate: Boolean(alternateCategory),
  });
}

export default async function CategoryDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const currentLocale = locale as Locale;
  const t = await getTranslations({ locale: currentLocale, namespace: "categories" });
  const category = await getCategoryBySlug(currentLocale, slug);

  if (!category) {
    notFound();
  }

  const products = await listCategoryProducts(currentLocale, category.id);

  return (
    <PublicShell locale={currentLocale} path={`/categories/${slug}`}>
      <Section>
        <Container className="space-y-8">
          <div className="space-y-3">
            <div className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">
              {t("detailEyebrow")}
            </div>
            <h1 className="text-4xl font-semibold text-[var(--foreground)]">{category.name}</h1>
            {category.description ? <p className="max-w-3xl text-base leading-7 text-[var(--text-muted)]">{category.description}</p> : null}
          </div>

          {products.length === 0 ? (
            <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--brand-border)] bg-white p-8 text-center text-[var(--text-muted)]">
              {t("empty")}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  locale={currentLocale}
                  product={product}
                  categoryName={category.name}
                  showCategory
                />
              ))}
            </div>
          )}
        </Container>
      </Section>
    </PublicShell>
  );
}
