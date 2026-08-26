import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { CategoryCard } from "@/components/public/category-card";
import { Container, Section } from "@/components/ui/layout";
import { PublicShell } from "@/components/public/public-shell";
import { listPublishedCategories } from "@/server/repositories/public-catalog";
import { locales, type Locale } from "@/lib/locales";
import { getTranslations } from "next-intl/server";
import { createPublicPageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) return {};
  
  const t = await getTranslations({ locale: locale as Locale, namespace: "metadata" });
  const currentLocale = locale as Locale;
  
  return createPublicPageMetadata({
    locale: currentLocale,
    path: "/categories",
    title: t("categoriesTitle"),
    description: t("categoriesDescription"),
  });
}

export default async function CategoriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const currentLocale = locale as Locale;
  const t = await getTranslations({ locale: currentLocale, namespace: "categories" });
  const categories = await listPublishedCategories(currentLocale);

  return (
    <PublicShell locale={currentLocale} path="/categories">
      <Section>
        <Container className="space-y-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">
              {t("eyebrow")}
            </p>
            <h1 className="mt-1 text-4xl font-semibold text-[var(--foreground)]">
              {t("title")}
            </h1>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {categories.map((category) => <CategoryCard key={category.id} locale={currentLocale} categoryId={category.id} slug={category.slug} name={category.name} description={category.description} imageUrl={category.imagePublicUrl} />)}
          </div>
        </Container>
      </Section>
    </PublicShell>
  );
}
