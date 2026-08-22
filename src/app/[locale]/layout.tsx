import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { locales, type Locale } from "@/lib/locales";
import { createPublicPageMetadata } from "@/lib/seo";
import { NextIntlClientProvider } from "next-intl";

import arMessages from "@/i18n/messages/ar.json";
import enMessages from "@/i18n/messages/en.json";

const messages = { en: enMessages, ar: arMessages } as const;

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const currentLocale = locales.includes(locale as Locale) ? (locale as Locale) : "en";
  const metadataMessages = messages[currentLocale].metadata;

  return {
    ...createPublicPageMetadata({
      locale: currentLocale,
      path: "/",
      title: metadataMessages.siteTitle,
      description: metadataMessages.siteDescription,
    }),
    title: {
      default: metadataMessages.siteTitle,
      template: `%s | ${metadataMessages.siteTitle}`,
    },
  };
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const currentLocale = locale as Locale;

  return (
    <div>
      <NextIntlClientProvider locale={currentLocale} messages={messages[currentLocale]}>
        {children}
      </NextIntlClientProvider>
    </div>
  );
}
