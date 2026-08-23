import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { CatalogueCarousel } from "@/components/public/catalogue-carousel";
import { CategoryCard } from "@/components/public/category-card";
import { Container, Section } from "@/components/ui/layout";
import { ProductCard } from "@/components/public/product-card";
import { PromotionalBanner } from "@/components/public/promotional-banner";
import { PublicImageSlot } from "@/components/public/public-image-slot";
import { HeroCarousel } from "@/components/public/hero-carousel";
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
  const heroSections = sections.filter((section) => section.sectionType.toUpperCase() === "HERO");
  const promotionalSections = sections.filter((section) => !heroSections.includes(section));

  return (
    <PublicShell locale={currentLocale} path="/">
      <main>
        <Section className="bg-[var(--brand-surface)] py-10 sm:py-14">
          <Container className={heroSections.length > 0 ? "grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center" : "space-y-6"}>
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

            {heroSections.length > 0 ? (
              <HeroCarousel
                id="homepage-hero"
                locale={currentLocale}
                banners={heroSections.map((section) => ({
                  imageUrl: readLocalizedConfigString(section.configurationJson, "imageUrl", currentLocale) ?? readLocalizedConfigString(section.configurationJson, "image", currentLocale) ?? null,
                  imageAlt: readLocalizedConfigString(section.configurationJson, "imageAlt", currentLocale) ?? t("heroAlt"),
                  title: readLocalizedConfigString(section.configurationJson, "title", currentLocale) ?? undefined,
                  subtitle: readLocalizedConfigString(section.configurationJson, "subtitle", currentLocale) ?? undefined,
                  ctaLabel: readLocalizedConfigString(section.configurationJson, "ctaLabel", currentLocale) ?? undefined,
                  ctaHref: readLocalizedConfigString(section.configurationJson, "ctaHref", currentLocale) ?? undefined,
                }))}
              />
            ) : null}
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
            <CatalogueCarousel
              id="homepage-categories-carousel"
              locale={currentLocale}
              title={
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">
                    {t("categoriesEyebrow")}
                  </p>
                  <h2 className="mt-1 text-3xl font-semibold text-[var(--foreground)]">
                    {t("categoriesTitle")}
                  </h2>
                </div>
              }
              viewAllLink={
                <Link href={localePath(currentLocale, "/categories")} className="text-sm font-medium text-[var(--brand-primary)] hover:text-[var(--brand-primary-dark)]">
                  {t("viewAll")}
                </Link>
              }
              prevLabel={currentLocale === "ar" ? "السابق" : "Previous categories"}
              nextLabel={currentLocale === "ar" ? "التالي" : "Next categories"}
              itemClassName="min-w-[72%] sm:min-w-[calc(50%-0.625rem)] xl:min-w-[calc(25%-0.75rem)]"
              items={categories.map((category) => (
                <CategoryCard
                  key={category.id}
                  locale={currentLocale}
                  slug={category.slug}
                  name={category.name}
                  description={category.description}
                />
              ))}
            />
          </Container>
        </Section>

        <Section className="pt-0">
          <Container className="space-y-6">
            <CatalogueCarousel
              id="homepage-featured-products-carousel"
              locale={currentLocale}
              title={
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">
                    {t("featuredEyebrow")}
                  </p>
                  <h2 className="mt-1 text-3xl font-semibold text-[var(--foreground)]">
                    {t("featuredTitle")}
                  </h2>
                </div>
              }
              viewAllLink={
                <Link href={localePath(currentLocale, "/products")} className="text-sm font-medium text-[var(--brand-primary)] hover:text-[var(--brand-primary-dark)]">
                  {t("viewAll")}
                </Link>
              }
              prevLabel={currentLocale === "ar" ? "السابق" : "Previous products"}
              nextLabel={currentLocale === "ar" ? "التالي" : "Next products"}
              itemClassName="min-w-[84%] sm:min-w-[calc(50%-0.625rem)] xl:min-w-[calc(33.333%-1rem)]"
              items={featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  locale={currentLocale}
                  product={product}
                />
              ))}
            />
          </Container>
        </Section>
      </main>
    </PublicShell>
  );
}
