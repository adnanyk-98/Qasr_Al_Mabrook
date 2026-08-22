import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { CategoryCard } from "@/components/public/category-card";
import { Container, Section } from "@/components/ui/layout";
import { ProductCard } from "@/components/public/product-card";
import { PromotionalBanner } from "@/components/public/promotional-banner";
import { PublicImageSlot } from "@/components/public/public-image-slot";
import { PublicShell } from "@/components/public/public-shell";
import { listPublishedCategories, listPublishedHomepageSections, listPublishedProducts } from "@/server/repositories/public-catalog";
import { localePath, locales, type Locale } from "@/lib/locales";
import { readLocalizedConfigString } from "@/lib/localized-config";
import { getTranslations } from "next-intl/server";

export default async function LocaleHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const currentLocale = locale as Locale;
  const t = await getTranslations({ locale: currentLocale, namespace: "home" });
  const [sections, categories, featuredProducts] = await Promise.all([
    listPublishedHomepageSections(),
    listPublishedCategories(currentLocale),
    listPublishedProducts(currentLocale, { limit: 6 }),
  ]);
  const heroSection = sections.find((section) => section.sectionType.toUpperCase() === "HERO");
  const heroImageUrl = readLocalizedConfigString(heroSection?.configurationJson, "imageUrl", currentLocale) ?? readLocalizedConfigString(heroSection?.configurationJson, "image", currentLocale);
  const heroImageAlt = readLocalizedConfigString(heroSection?.configurationJson, "imageAlt", currentLocale) ?? t("heroAlt");
  const promotionalSections = sections.filter((section) => section !== heroSection);

  return (
    <PublicShell locale={currentLocale} path="/">
      <main>
        <Section className="bg-[var(--brand-surface)] py-10 sm:py-14">
          <Container className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="space-y-6">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">
                {t("eyebrow")}
              </p>
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-[var(--foreground)] sm:text-5xl">
                {t("title")}
              </h1>
              <p className="max-w-xl text-base leading-7 text-[var(--text-muted)]">
                {t("description")}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link href={localePath(currentLocale, "/products")}>
                  <Button variant="primary" size="lg">
                    {t("browse")}
                  </Button>
                </Link>
                <Link href={localePath(currentLocale, "/categories")}>
                  <Button variant="outline" size="lg">
                    {t("explore")}
                  </Button>
                </Link>
              </div>
            </div>

            {heroImageUrl ? (
              <div className="rounded-[var(--radius-xl)] border border-[var(--brand-border)] bg-white p-3 shadow-[var(--shadow-sm)]">
                <PublicImageSlot src={heroImageUrl} alt={heroImageAlt} variant="homepage-hero" sizes="(max-width: 1024px) 100vw, 40vw" priority />
              </div>
            ) : (
              <div className="rounded-[var(--radius-xl)] border border-[var(--brand-border)] bg-white p-6 shadow-[var(--shadow-sm)]">
                <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                  {[
                    { value: "150+", label: t("productsStat") },
                    { value: "24/7", label: t("supportStat") },
                    { value: "AR / EN", label: t("localesStat") },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-[var(--radius-md)] bg-[var(--brand-surface-alt)] p-4">
                      <div className="text-2xl font-semibold text-[var(--brand-primary)]">{stat.value}</div>
                      <div className="mt-1 text-sm text-[var(--text-muted)]">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Container>
        </Section>

        {promotionalSections.length > 0 ? (
          <Section className="py-0">
            <Container className="space-y-6">
              {promotionalSections.map((section) => {
                const title = readLocalizedConfigString(section.configurationJson, "title", currentLocale) ?? t("featuredCollection");
                const subtitle = readLocalizedConfigString(section.configurationJson, "subtitle", currentLocale);
                const imageUrl = readLocalizedConfigString(section.configurationJson, "imageUrl", currentLocale) ?? readLocalizedConfigString(section.configurationJson, "image", currentLocale);
                const imageAlt = readLocalizedConfigString(section.configurationJson, "imageAlt", currentLocale) ?? title;
                const ctaLabel = readLocalizedConfigString(section.configurationJson, "ctaLabel", currentLocale);
                const ctaHref = readLocalizedConfigString(section.configurationJson, "ctaHref", currentLocale);

                return <PromotionalBanner key={section.id} locale={currentLocale} title={title} subtitle={subtitle} imageUrl={imageUrl} imageAlt={imageAlt} ctaLabel={ctaLabel} ctaHref={ctaHref} />;
              })}
            </Container>
          </Section>
        ) : null}

        <Section>
          <Container className="space-y-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">
                  {t("categoriesEyebrow")}
                </p>
                <h2 className="mt-1 text-3xl font-semibold text-[var(--foreground)]">
                  {t("categoriesTitle")}
                </h2>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {categories.map((category) => <CategoryCard key={category.id} locale={currentLocale} slug={category.slug} name={category.name} description={category.description} />)}
            </div>
          </Container>
        </Section>

        <Section className="pt-0">
          <Container className="space-y-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">
                  {t("featuredEyebrow")}
                </p>
                <h2 className="mt-1 text-3xl font-semibold text-[var(--foreground)]">
                  {t("featuredTitle")}
                </h2>
              </div>
              <Link href={localePath(currentLocale, "/products")} className="text-sm font-medium text-[var(--brand-primary)] hover:text-[var(--brand-primary-dark)]">
                {t("viewAll")}
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  locale={currentLocale}
                  product={product}
                />
              ))}
            </div>
          </Container>
        </Section>
      </main>
    </PublicShell>
  );
}
