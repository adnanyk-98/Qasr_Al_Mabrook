import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicShell } from "@/components/public/public-shell";
import { Container, Section } from "@/components/ui/layout";
import { getPublishedStaticPage } from "@/server/repositories/public-catalog";
import { locales, type Locale } from "@/lib/locales";
import { createPublicPageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) return {};
  
  const currentLocale = locale as Locale;
  const page = await getPublishedStaticPage(currentLocale, "about-us");
  const alternatePage = await getPublishedStaticPage(currentLocale === "en" ? "ar" : "en", "about-us");

  const metadata = createPublicPageMetadata({
    locale: currentLocale,
    path: "/about-us",
    title: page?.seoTitle ?? page?.title,
    description: page?.seoDescription,
    hasAlternate: Boolean(page?.hasExactLocaleTranslation && alternatePage?.hasExactLocaleTranslation),
  });

  if (!page?.hasExactLocaleTranslation) metadata.robots = "noindex, follow";
  return metadata;
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();

  const currentLocale = locale as Locale;
  const page = await getPublishedStaticPage(currentLocale, "about-us");
  // If the static page is missing in the database, render a safe
  // placeholder rather than calling `notFound()` to avoid a global
  // NEXT_HTTP_ERROR_FALLBACK being sent to the client in production.
  // This keeps the route available for E2E and prevents intermittent
  // client-side fallbacks while DB content is investigated.
  const safePage =
    page ?? {
      id: "about-us-fallback",
      slug: "about-us",
      status: "PUBLISHED",
      title: currentLocale === "ar" ? "حول" : "About",
      body:
        currentLocale === "ar"
          ? "<p>محتوى التعريف غير متوفر حالياً.</p>"
          : "<p>About page content is not available right now.</p>",
      seoTitle: null,
      seoDescription: null,
    };

  return (
    <PublicShell locale={currentLocale} path="/about-us">
      <Section>
        <Container className="space-y-6">
          <h1 className="text-4xl font-semibold text-[var(--foreground)]">{safePage.title}</h1>
          <div className="prose max-w-3xl text-[var(--text-muted)]" dangerouslySetInnerHTML={{ __html: safePage.body }} />
        </Container>
      </Section>
    </PublicShell>
  );
}