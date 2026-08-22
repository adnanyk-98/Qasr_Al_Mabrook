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
  
  return createPublicPageMetadata({
    locale: currentLocale,
    path: "/about-us",
    title: page?.seoTitle ?? page?.title,
    description: page?.seoDescription,
  });
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();

  const currentLocale = locale as Locale;
  const page = await getPublishedStaticPage(currentLocale, "about-us");
  if (!page) notFound();

  return (
    <PublicShell locale={currentLocale} path="/about-us">
      <Section>
        <Container className="space-y-6">
          <h1 className="text-4xl font-semibold text-[var(--foreground)]">{page.title}</h1>
          <div className="prose max-w-3xl text-[var(--text-muted)]" dangerouslySetInnerHTML={{ __html: page.body }} />
        </Container>
      </Section>
    </PublicShell>
  );
}