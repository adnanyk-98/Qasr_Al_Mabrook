import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicShell } from "@/components/public/public-shell";
import { Container, Section } from "@/components/ui/layout";
import { getPublishedStaticPage } from "@/server/repositories/public-catalog";
import {
  createAboutUsMetadata,
  getAboutUsDirection,
  resolveAboutUsContent,
} from "@/lib/about-us-content";
import { locales, type Locale } from "@/lib/locales";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) return {};

  const currentLocale = locale as Locale;
  const [page, alternatePage] = await Promise.all([
    getPublishedStaticPage(currentLocale, "about-us"),
    getPublishedStaticPage(currentLocale === "en" ? "ar" : "en", "about-us"),
  ]);
  return createAboutUsMetadata(currentLocale, page, alternatePage);
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();

  const currentLocale = locale as Locale;
  const page = await getPublishedStaticPage(currentLocale, "about-us");
  const content = resolveAboutUsContent(currentLocale, page);

  return (
    <PublicShell locale={currentLocale} path="/about-us">
      <Section>
        <Container className="space-y-6">
          <div dir={getAboutUsDirection(currentLocale)} className="space-y-6">
            <h1 className="text-4xl font-semibold text-[var(--foreground)]">
              {content.title}
            </h1>
            <div className="prose max-w-3xl text-[var(--text-muted)]">
              {content.bodyParagraphs.map((paragraph, index) => (
                <p key={`${index}-${paragraph}`}>
                  {content.fromPublishedPage ? (
                    paragraph
                  ) : index === content.bodyParagraphs.length - 1 ? (
                    <>
                      <strong>{content.closingLabel}</strong> {content.closingText}
                    </>
                  ) : (
                    paragraph
                  )}
                </p>
              ))}
            </div>
          </div>
        </Container>
      </Section>
    </PublicShell>
  );
}
