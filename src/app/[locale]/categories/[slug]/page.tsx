import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";

import { Container, Section } from "@/components/ui/layout";
import { ProductCard } from "@/components/public/product-card";
import { PublicShell } from "@/components/public/public-shell";
import {
  getCategoryBySlug,
  listCategoryProducts,
} from "@/server/repositories/public-catalog";
import { localePath, locales, type Locale } from "@/lib/locales";
import { createBreadcrumbStructuredData, createCategoryMetadata } from "@/lib/seo";
import { getTranslations } from "next-intl/server";
import { AnalyticsTracker } from "@/components/analytics/analytics-tracker";
import { getCategoryLandingContent } from "@/lib/catalogue-landing-content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!locales.includes(locale as Locale)) return {};

  const category = await getCategoryBySlug(locale as Locale, slug);
  if (!category) return {};

  const currentLocale = locale as Locale;
  const alternateCategory = await getCategoryBySlug(
    currentLocale === "en" ? "ar" : "en",
    slug,
  );
  const landingContent = getCategoryLandingContent(currentLocale, slug);

  const metadata = createCategoryMetadata({
    locale: currentLocale,
    path: `/categories/${slug}`,
    categoryName: landingContent?.heading ?? category.name,
    seoTitle: landingContent ? null : category.seoTitle,
    seoDescription: landingContent?.seoDescription ?? category.seoDescription,
    description: category.description,
    ogImage: category.imagePublicUrl,
    ogImageAlt: category.name,
    hasAlternate: Boolean(
      category.hasExactLocaleTranslation &&
      alternateCategory?.hasExactLocaleTranslation,
    ),
  });

  if (!category.hasExactLocaleTranslation) metadata.robots = "noindex, follow";
  return metadata;
}

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
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
  const landingContent = getCategoryLandingContent(currentLocale, slug);

  return (
    <PublicShell locale={currentLocale} path={`/categories/${slug}`}>
      <Section>
        <Container className="space-y-8">
          <AnalyticsTracker
            event="category_view"
            params={{
              category_id: category.id,
              category_name: category.name,
              locale: currentLocale,
            }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: createBreadcrumbStructuredData(currentLocale, [
                { name: t("title"), path: "/categories" },
                {
                  name: landingContent?.heading ?? category.name,
                  path: `/categories/${slug}`,
                },
              ]),
            }}
          />
          <div className="space-y-3">
            <div className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">
              {t("detailEyebrow")}
            </div>
            <h1 className="text-4xl font-semibold text-[var(--foreground)]">
              {landingContent?.heading ?? category.name}
            </h1>
            {landingContent ? (
              <>
                <p className="max-w-3xl text-base leading-7 text-[var(--text-muted)]">
                  {landingContent.intro}
                </p>
                <div className="space-y-2">
                  <h2 className="text-sm font-semibold text-[var(--foreground)]">
                    {landingContent.linkHeading}
                  </h2>
                  <ul className="flex flex-wrap gap-x-5 gap-y-2">
                    {landingContent.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={localePath(currentLocale, link.href)}
                          className="text-sm font-medium text-[var(--brand-primary)] underline underline-offset-4 hover:text-[var(--brand-primary-dark)]"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : category.description ? (
              <p className="max-w-3xl text-base leading-7 text-[var(--text-muted)]">
                {category.description}
              </p>
            ) : null}
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
