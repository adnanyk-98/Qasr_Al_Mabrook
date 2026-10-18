import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { EnquiryForm } from "@/components/public/enquiry-form";
import { PublicShell } from "@/components/public/public-shell";
import { Container, Section } from "@/components/ui/layout";
import { getPublicContactSettings } from "@/server/repositories/enquiries";
import { locales, type Locale } from "@/lib/locales";
import { buildTelephoneHref, formatPublicPhoneNumber } from "@/lib/phone-display";
import { getTranslations } from "next-intl/server";
import { createPublicPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) return {};

  const [metadataT, enquiryT] = await Promise.all([
    getTranslations({ locale: locale as Locale, namespace: "metadata" }),
    getTranslations({ locale: locale as Locale, namespace: "enquiry" }),
  ]);
  const currentLocale = locale as Locale;

  const metadata = createPublicPageMetadata({
    locale: currentLocale,
    path: "/contact-us",
    title: metadataT("contactTitle"),
    description: enquiryT("contactDescription"),
  });
  const query = await searchParams;
  if (query.success || query.error) metadata.robots = "noindex, follow";
  return metadata;
}

export default async function ContactPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  if (!locales.includes(locale as Locale)) notFound();

  const currentLocale = locale as Locale;
  const t = await getTranslations({ locale: currentLocale, namespace: "enquiry" });
  const settings = await getPublicContactSettings();
  const phoneHref = settings.business_phone
    ? buildTelephoneHref(settings.business_phone)
    : null;
  const displayedPhoneNumber = settings.business_phone
    ? formatPublicPhoneNumber(settings.business_phone)
    : null;

  return (
    <PublicShell locale={currentLocale} path="/contact-us">
      <Section>
        <Container className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-5">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">
              {t("contactEyebrow")}
            </p>
            <h1 className="text-4xl font-semibold text-[var(--foreground)]">
              {t("contactTitle")}
            </h1>
            <p className="text-base leading-7 text-[var(--text-muted)]">
              {t("contactDescription")}
            </p>
            <div className="space-y-2 text-sm text-[var(--text-muted)]">
              {displayedPhoneNumber ? (
                <p>
                  {t("phoneContact")}:{" "}
                  {phoneHref ? (
                    <a
                      dir="ltr"
                      href={phoneHref}
                      className="inline-block text-[var(--text-muted)] hover:text-[var(--brand-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2"
                    >
                      <bdi dir="ltr">{displayedPhoneNumber}</bdi>
                    </a>
                  ) : (
                    <bdi dir="ltr">{displayedPhoneNumber}</bdi>
                  )}
                </p>
              ) : null}
              {settings.business_email ? (
                <p>
                  {t("emailContact")}: {settings.business_email}
                </p>
              ) : null}
            </div>
          </div>
          <div className="rounded-[var(--radius-lg)] border border-[var(--brand-border)] bg-white p-6 shadow-[var(--shadow-sm)]">
            {query.success ? (
              <div className="space-y-4" role="status">
                <h2 className="text-2xl font-semibold text-[var(--foreground)]">
                  {t("messageSubmitted")}
                </h2>
                <p className="text-sm leading-6 text-[var(--text-muted)]">
                  {t("reference")}: {query.success}
                </p>
              </div>
            ) : (
              <EnquiryForm
                locale={currentLocale}
                source="CONTACT"
                error={query.error}
              />
            )}
          </div>
        </Container>
      </Section>
    </PublicShell>
  );
}
