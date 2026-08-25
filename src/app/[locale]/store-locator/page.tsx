import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { StoreGallery } from "@/components/public/store-gallery";
import { Container, Section } from "@/components/ui/layout";
import { listPublishedHomepageSections } from "@/server/repositories/public-catalog";
import { createPublicPageMetadata } from "@/lib/seo";
import { localePath, locales, type Locale } from "@/lib/locales";
import { readLocalizedConfigString } from "@/lib/homepage-content";
import { getTranslations } from "next-intl/server";
import { PublicShell } from "@/components/public/public-shell";
import { siteConfig } from "@/config/site";
import { GoogleMapEmbed } from "@/components/public/google-map-embed";

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
  const heroSections = sections.filter((section) => section.sectionType.toUpperCase() === "HERO");
  const superMarketSection = heroSections.find((section) => {
    const ctaHref = readLocalizedConfigString(section.configurationJson, "ctaHref", currentLocale);
    const title = readLocalizedConfigString(section.configurationJson, "title", currentLocale);
    return ctaHref?.replace(/\/$/, "").endsWith("/store-locator") || title?.toLowerCase() === "super market";
  }) ?? heroSections[0];
  const superMarketImage = superMarketSection ? {
    desktop: readLocalizedConfigString(superMarketSection.configurationJson, "desktopImageUrl", currentLocale) ?? readLocalizedConfigString(superMarketSection.configurationJson, "imageUrl", currentLocale) ?? null,
    mobile: readLocalizedConfigString(superMarketSection.configurationJson, "mobileImageUrl", currentLocale) ?? null,
    alt: readLocalizedConfigString(superMarketSection.configurationJson, "imageAlt", currentLocale) ?? t("title"),
  } : null;
  const photos = storePhotos.map((photo) => ({ ...photo, alt: t("imageAlt") }));

  return (
    <PublicShell locale={currentLocale} path="/store-locator">
      {superMarketImage?.desktop ? (
        <div className="w-full">
          <picture>
            {superMarketImage.mobile ? <source media="(max-width: 1024px)" srcSet={superMarketImage.mobile} /> : null}
            <img src={superMarketImage.desktop} alt={superMarketImage.alt} className="block h-auto w-full" draggable={false} />
          </picture>
        </div>
      ) : null}
      <Section>
        <Container className="space-y-10">
          <div className="max-w-2xl space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">{t("eyebrow")}</p>
            <h1 className="text-4xl font-semibold text-[var(--foreground)] sm:text-5xl">{t("title")}</h1>
            <p className="max-w-xl text-base leading-7 text-[var(--text-muted)]">{t("description")}</p>
          </div>

          <div className="rounded-[var(--radius-xl)] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-4 shadow-[var(--shadow-sm)] sm:p-5 lg:p-7">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(400px,1.1fr)] lg:items-stretch lg:gap-6">
          <div className="flex flex-col gap-6 lg:justify-center">
              <address className="not-italic flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--brand-border)] bg-white p-5 shadow-[var(--shadow-sm)]">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary-light)] text-[var(--brand-primary)]">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
                    <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="9.5" r="2.5" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">{t("visitUs")}</span>
                  <span className="mt-2 block text-base font-semibold text-[var(--foreground)]">{t("address")}</span>
                  <a href={siteConfig.contact.mapsUrl} target="_blank" rel="noopener noreferrer" aria-label={t("mapsAriaLabel")} className="mt-1 block max-w-[11rem] cursor-pointer leading-6 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--brand-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2">
                    {siteConfig.contact.address}
                  </a>
                </div>
              </address>

              <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--brand-border)] bg-white p-5 shadow-[var(--shadow-sm)] lg:border-l lg:border-[var(--brand-border)] lg:pl-6">
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

          </div>
          <div className="h-[280px] sm:h-[320px] lg:h-[400px]">
            <GoogleMapEmbed locale={currentLocale} variant="store" className="h-full" />
          </div>
          </div>
          </div>

          <section aria-labelledby="store-gallery-title" className="space-y-6 pt-4">
            <div className="max-w-3xl space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">{t("galleryEyebrow")}</p>
              <h2 id="store-gallery-title" className="text-3xl font-semibold text-[var(--foreground)] sm:text-4xl">{t("galleryTitle")}</h2>
              <p className="max-w-2xl text-base leading-7 text-[var(--text-muted)]">{t("galleryDescription")}</p>
            </div>
            <StoreGallery photos={photos} label={t("galleryLabel")} closeLabel={t("close")} previousLabel={t("previous")} nextLabel={t("next")} />
          </section>
        </Container>
      </Section>
    </PublicShell>
  );
}