import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PublicShell } from "@/components/public/public-shell";
import { Container, Section } from "@/components/ui/layout";
import {
  getPublishedStaticPage,
  listIndexableCategories,
  listIndexableProducts,
} from "@/server/repositories/public-catalog";
import { localePath, locales, type Locale } from "@/lib/locales";
import { createPublicPageMetadata } from "@/lib/seo";
import { getTranslations } from "next-intl/server";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) return {};

  const currentLocale = locale as Locale;
  const t = await getTranslations({ locale: currentLocale, namespace: "sitemap" });
  return createPublicPageMetadata({
    locale: currentLocale,
    path: "/sitemap",
    title: t("title"),
    description: t("description"),
  });
}

export default async function HtmlSitemapPage({ params }: PageProps) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();

  const currentLocale = locale as Locale;
  const [common, sitemapT, categories, products, aboutPage] = await Promise.all([
    getTranslations({ locale: currentLocale, namespace: "common" }),
    getTranslations({ locale: currentLocale, namespace: "sitemap" }),
    listIndexableCategories(currentLocale),
    listIndexableProducts(currentLocale),
    getPublishedStaticPage(currentLocale, "about-us"),
  ]);

  const staticPages = [
    { label: common("home"), path: "/" },
    { label: common("categories"), path: "/categories" },
    { label: common("products"), path: "/products" },
    ...(aboutPage?.hasExactLocaleTranslation
      ? [{ label: common("aboutUs"), path: "/about-us" }]
      : []),
    { label: common("contact"), path: "/contact-us" },
    { label: common("storeLocator"), path: "/store-locator" },
  ];

  return (
    <PublicShell locale={currentLocale} path="/sitemap">
      <Section>
        <Container className="space-y-10">
          <header className="max-w-3xl space-y-3">
            <h1 className="text-4xl font-semibold text-[var(--foreground)]">
              {sitemapT("title")}
            </h1>
            <p className="text-base leading-7 text-[var(--text-muted)]">
              {sitemapT("description")}
            </p>
          </header>

          <section aria-labelledby="sitemap-pages-heading" className="space-y-3">
            <h2
              id="sitemap-pages-heading"
              className="text-2xl font-semibold text-[var(--foreground)]"
            >
              {sitemapT("pagesHeading")}
            </h2>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {staticPages.map((page) => (
                <li key={page.path}>
                  <Link
                    className="text-[var(--brand-primary)] underline-offset-4 hover:underline"
                    href={localePath(currentLocale, page.path)}
                  >
                    {page.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {categories.length > 0 ? (
            <section aria-labelledby="sitemap-categories-heading" className="space-y-3">
              <h2
                id="sitemap-categories-heading"
                className="text-2xl font-semibold text-[var(--foreground)]"
              >
                {common("categories")}
              </h2>
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                  <li key={category.slug}>
                    <Link
                      className="text-[var(--brand-primary)] underline-offset-4 hover:underline"
                      href={localePath(currentLocale, `/categories/${category.slug}`)}
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {products.length > 0 ? (
            <section aria-labelledby="sitemap-products-heading" className="space-y-3">
              <h2
                id="sitemap-products-heading"
                className="text-2xl font-semibold text-[var(--foreground)]"
              >
                {common("products")}
              </h2>
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                  <li key={product.slug}>
                    <Link
                      className="text-[var(--brand-primary)] underline-offset-4 hover:underline"
                      href={localePath(currentLocale, `/products/${product.slug}`)}
                    >
                      {product.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </Container>
      </Section>
    </PublicShell>
  );
}
