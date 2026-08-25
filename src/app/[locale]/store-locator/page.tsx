import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HeroCarousel } from "@/components/public/hero-carousel";
import { StoreGallery } from "@/components/public/store-gallery";
import { Container, Section } from "@/components/ui/layout";
import { listPublishedHomepageSections } from "@/server/repositories/public-catalog";
import { createPublicPageMetadata } from "@/lib/seo";
import { localePath, locales, type Locale } from "@/lib/locales";
import { readLocalizedConfigString } from "@/lib/homepage-content";
import { getTranslations } from "next-intl/server";
import { PublicShell } from "@/components/public/public-shell";
import { siteConfig } from "@/config/site";

const storePhotos = Array.from({ length: 8 }, (_, index) => ({
  src: `/store-locator/In-Store-Images-${String(index + 1).padStart(2, "0")}.jpg`,
}));

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) return {};
  const currentLocale = locale as Locale;
  const t = await getTranslations({ locale: currentLocale, namespace: "storeLocator" });
  return createPublicPageMetadata({ locale: currentLocale, path: "/store-locator", title: t("title"), description: t("description") });
}

export default async function StoreLocatorPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  const currentLocale = locale as Locale;
  const t = await getTranslations({ locale: currentLocale, namespace: "storeLocator" });
  const sections = await listPublishedHomepageSections();
  const heroSection = sections.find((section) => section.sectionType.toUpperCase() === "HERO");
  const hero = heroSection ? [{
    desktopImageUrl: readLocalizedConfigString(heroSection.configurationJson, "desktopImageUrl", currentLocale) ?? readLocalizedConfigString(heroSection.configurationJson, "imageUrl", currentLocale) ?? null,
    mobileImageUrl: readLocalizedConfigString(heroSection.configurationJson, "mobileImageUrl", currentLocale) ?? null,
    imageAlt: readLocalizedConfigString(heroSection.configurationJson, "imageAlt", currentLocale) ?? t("title"),
  }] : [];
  const photos = storePhotos.map((photo) => ({ ...photo, alt: t("imageAlt") }));

  return (
    <PublicShell locale={currentLocale} path="/store-locator">
      {hero.length ? <HeroCarousel id="store-locator-hero" locale={currentLocale} autoplay={false} banners={hero} /> : null}
      <Section>
        <Container className="space-y-10">
          <div className="max-w-2xl space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">{t("eyebrow")}</p>
            <h1 className="text-4xl font-semibold text-[var(--foreground)] sm:text-5xl">{t("title")}</h1>
            <p className="max-w-xl text-base leading-7 text-[var(--text-muted)]">{t("description")}</p>
          </div>

          <address className="not-italic overflow-hidden rounded-[var(--radius-lg)] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5 shadow-[var(--shadow-sm)] sm:p-6">
            <div className="grid gap-5 md:grid-cols-[1.45fr_1fr_auto] md:items-center">
              <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--brand-border)] bg-white/60 p-4 md:min-h-[150px]">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary-light)] text-[var(--brand-primary)]">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
                    <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="9.5" r="2.5" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">{t("visitUs")}</span>
                  <span className="mt-2 block text-base font-semibold text-[var(--foreground)]">{t("address")}</span>
                  <span className="mt-1 block max-w-[32rem] leading-6 text-sm text-[var(--text-muted)]">{siteConfig.contact.address}</span>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--brand-border)] bg-white/60 p-4 md:min-h-[150px] md:border-l md:border-[var(--brand-border)] md:bg-transparent md:pl-6">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary-light)] text-[var(--brand-primary)]">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
                    <path d="M5 4.75A2.75 2.75 0 0 1 7.75 2h.5A2.75 2.75 0 0 1 11 4.75V5a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-.25Zm-2.5 2.5A2.5 2.5 0 0 1 5 4.75v.25a3.5 3.5 0 0 0 3.5 3.5h2A3.5 3.5 0 0 0 14 5v-.25A2.5 2.5 0 0 1 16.5 7.25v10.5A2.5 2.5 0 0 1 14 20.25h-4A2.5 2.5 0 0 1 7.5 17.75V7.25Zm7 7.75h5.25a2.75 2.75 0 0 1 2.75 2.75v.5a.75.75 0 0 1-.75.75H19.5a2.5 2.5 0 0 1-2.5-2.5v-1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">{t("callUs")}</span>
                  <span className="mt-2 block text-base font-semibold text-[var(--foreground)]">{t("phone")}</span>
                  <a href={`tel:${siteConfig.contact.phone}`} className="mt-1 block text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--brand-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2">
                    {siteConfig.contact.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-center justify-start md:justify-end">
                <a href={siteConfig.contact.mapsUrl} target="_blank" rel="noopener noreferrer" aria-label={t("mapsAriaLabel")} className="inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--brand-primary)] bg-[var(--brand-primary)] px-4 py-3 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--brand-primary-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2 md:w-auto">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
                    <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="9.5" r="2.5" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                  <span>{t("viewOnMaps")}</span>
                </a>
              </div>
            </div>
          </address>

          <StoreGallery photos={photos} label={t("galleryLabel")} closeLabel={t("close")} previousLabel={t("previous")} nextLabel={t("next")} />
        </Container>
      </Section>
    </PublicShell>
  );
}