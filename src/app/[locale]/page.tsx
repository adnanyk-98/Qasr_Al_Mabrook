import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { CatalogueCarousel } from "@/components/public/catalogue-carousel";
import { CategoryMarquee } from "@/components/public/category-marquee";
import { Container, Section } from "@/components/ui/layout";
import { ProductCard } from "@/components/public/product-card";
import { PromotionalBanner } from "@/components/public/promotional-banner";
import { PublicImageSlot } from "@/components/public/public-image-slot";
import { HeroCarousel } from "@/components/public/hero-carousel";
import { PublicShell } from "@/components/public/public-shell";
import { listPublishedCategories, listPublishedHomepageSections, listPublishedProducts } from "@/server/repositories/public-catalog";
import { localePath, locales, type Locale } from "@/lib/locales";
import { readLocalizedConfigString } from "@/lib/homepage-content";
import { getTranslations } from "next-intl/server";

function HighlightIcon({ type }: { type: "experience" | "products" | "clients" | "retention" }) {
  const common = { viewBox: "0 0 48 48", fill: "none", "aria-hidden": true, className: "h-[42px] w-[42px] text-[var(--brand-primary)]" } as const;

  if (type === "experience") {
    return <svg {...common}><circle cx="24" cy="24" r="17" stroke="currentColor" strokeWidth="1.7" /><path d="m24 13 3.3 6.7 7.4 1.1-5.3 5.2 1.3 7.4-6.7-3.5-6.7 3.5 1.3-7.4-5.3-5.2 7.4-1.1L24 13Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>;
  }

  if (type === "products") {
    return <svg {...common}><path d="m11 17 13-6 13 6-13 6-13-6Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><path d="M11 17v14l13 6 13-6V17M24 23v14" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg>;
  }

  if (type === "clients") {
    return <svg {...common}><circle cx="24" cy="17" r="5" stroke="currentColor" strokeWidth="1.7" /><circle cx="14" cy="21" r="4" stroke="currentColor" strokeWidth="1.7" /><circle cx="34" cy="21" r="4" stroke="currentColor" strokeWidth="1.7" /><path d="M14 35c0-5 4.5-8 10-8s10 3 10 8M6 35c0-3.5 3-6 7-6M42 35c0-3.5-3-6-7-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>;
  }

  return <svg {...common}><path d="m10 24 5-5a4 4 0 0 1 5.7 0l3.3 3.3 3.3-3.3a4 4 0 0 1 5.7 0l5 5-5 5a4 4 0 0 1-5.7 0L24 25.7 20.7 29a4 4 0 0 1-5.7 0l-5-5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><path d="m19 24 3 3a3 3 0 0 0 4 0l3-3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>;
}

export default async function LocaleHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const currentLocale = locale as Locale;
  const t = await getTranslations({ locale: currentLocale, namespace: "home" });
  const highlights = await getTranslations({ locale: currentLocale, namespace: "highlights" });
  const [sections, categories, featuredProducts] = await Promise.all([
    listPublishedHomepageSections(),
    listPublishedCategories(currentLocale),
    listPublishedProducts(currentLocale, { limit: 6 }),
  ]);
  const heroSections = sections.filter((section) => section.sectionType.toUpperCase() === "HERO");
  const promotionalSections = sections.filter((section) => !heroSections.includes(section));
  const heroBanners = heroSections.map((section) => ({
    desktopImageUrl: readLocalizedConfigString(section.configurationJson, "desktopImageUrl", currentLocale) ?? readLocalizedConfigString(section.configurationJson, "imageUrl", currentLocale) ?? null,
    mobileImageUrl: readLocalizedConfigString(section.configurationJson, "mobileImageUrl", currentLocale) ?? null,
    imageUrl: readLocalizedConfigString(section.configurationJson, "imageUrl", currentLocale) ?? readLocalizedConfigString(section.configurationJson, "image", currentLocale) ?? null,
    imageAlt: readLocalizedConfigString(section.configurationJson, "imageAlt", currentLocale) ?? t("heroAlt"),
    title: readLocalizedConfigString(section.configurationJson, "title", currentLocale) ?? undefined,
    subtitle: readLocalizedConfigString(section.configurationJson, "subtitle", currentLocale) ?? undefined,
    ctaLabel: readLocalizedConfigString(section.configurationJson, "ctaLabel", currentLocale) ?? undefined,
    ctaHref: readLocalizedConfigString(section.configurationJson, "ctaHref", currentLocale) ?? undefined,
  }));

  return (
    <PublicShell locale={currentLocale} path="/">
      <main>
        <Section className="bg-[var(--brand-surface)] !py-0">
          {heroSections.length > 0 ? (
            // Full-bleed hero: render outside the standard centered Container
            <div className="w-full">
              <HeroCarousel
                id="homepage-hero"
                locale={currentLocale}
                autoplay
                banners={heroBanners}
              />
            </div>
          ) : (
              <div className="space-y-6 rounded-[var(--radius-xl)] border border-[var(--brand-border)] bg-white p-6 shadow-[var(--shadow-sm)] sm:p-8">
                <div className="space-y-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">
                    {t("eyebrow")}
                  </p>
                  <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-[var(--foreground)] sm:text-5xl">
                    {t("title")}
                  </h1>
                  <p className="max-w-xl text-base leading-7 text-[var(--text-muted)]">
                    {t("description")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Link href={localePath(currentLocale, "/products")}>
                    <Button variant="primary" size="lg">
                      {t("browse")}
                    </Button>
                  </Link>
                </div>
              </div>
            )}
        </Section>

        <section className="bg-[var(--brand-surface)] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">
            <div className="mb-6 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">{highlights("eyebrow")}</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)] sm:text-3xl">{highlights("title")}</h2>
            </div>
            <div className="mx-auto grid max-w-[1080px] grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
              {[
                { value: "15+", label: highlights("experience"), mark: "experience" },
                { value: "1000+", label: highlights("products"), mark: "products" },
                { value: "90K+", label: highlights("clients"), mark: "clients" },
                { value: "95%", label: highlights("retention"), mark: "retention" },
              ].map((highlight) => (
                <article key={highlight.mark} className="qam-highlight-card flex flex-col items-center rounded-[var(--radius-md)] border border-[var(--brand-border)] bg-white px-3 py-4 text-center shadow-[var(--shadow-sm)] sm:px-5 sm:py-5">
                  <span className="mb-3 flex h-[42px] w-[42px] shrink-0 items-center justify-center"><HighlightIcon type={highlight.mark as "experience" | "products" | "clients" | "retention"} /></span>
                  <strong className="block text-3xl font-semibold text-[var(--brand-primary)] sm:text-[2.125rem]">{highlight.value}</strong>
                  <span className="mt-1 block text-xs leading-5 text-[var(--text-muted)] sm:text-sm">{highlight.label}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

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

        <Section className="!pt-8 !pb-8 sm:!pt-10 sm:!pb-12">
          <Container className="space-y-6">
            <div className="space-y-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">{t("categoriesEyebrow")}</p>
                  <h2 className="mt-1 text-3xl font-semibold text-[var(--foreground)]">{t("categoriesTitle")}</h2>
                </div>
              </div>
              <CategoryMarquee locale={currentLocale} categories={categories.map(({ id, slug, name }) => ({ id, slug, name }))} />
            </div>
          </Container>
        </Section>

        <Section className="!pt-4 !pb-12 sm:!pt-2 sm:!pb-16">
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
              itemClassName="w-[84%] sm:w-[calc((100%_-_1.25rem)_/_2)] xl:w-[calc((100%_-_3rem)_/_3)]"
              items={featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  locale={currentLocale}
                  product={product}
                  compact
                />
              ))}
            />
          </Container>
        </Section>
      </main>
    </PublicShell>
  );
}
