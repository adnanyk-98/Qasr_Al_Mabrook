import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies, headers } from "next/headers";

import { locales, type Locale } from "@/lib/locales";
import { AnalyticsConsentManager } from "@/components/analytics/analytics-consent-manager";
import {
  createOrganizationStructuredData,
  createPublicPageMetadata,
  createWebSiteStructuredData,
} from "@/lib/seo";
import { NextIntlClientProvider } from "next-intl";
import arMessages from "@/i18n/messages/ar.json";
import enMessages from "@/i18n/messages/en.json";
import {
  ANALYTICS_CONSENT_COOKIE,
  isCanonicalProductionHost,
  parseAnalyticsConsent,
} from "@/lib/analytics-consent";

const messages = { en: enMessages, ar: arMessages } as const;

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
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
      template: "%s",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const currentLocale = locale as Locale;
  const [requestHeaders, requestCookies] = await Promise.all([headers(), cookies()]);
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const initialConsent = parseAnalyticsConsent(
    requestCookies.get(ANALYTICS_CONSENT_COOKIE)?.value
      ? `${ANALYTICS_CONSENT_COOKIE}=${requestCookies.get(ANALYTICS_CONSENT_COOKIE)?.value}`
      : null,
  );

  return (
    <div>
      <NextIntlClientProvider
        key={currentLocale}
        locale={currentLocale}
        messages={messages[currentLocale]}
      >
        <AnalyticsConsentManager
          canonicalProductionHost={isCanonicalProductionHost(host)}
          copy={messages[currentLocale].analyticsConsent}
          initialConsent={initialConsent}
          locale={currentLocale}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: createOrganizationStructuredData() }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: createWebSiteStructuredData() }}
        />
        {children}
      </NextIntlClientProvider>
    </div>
  );
}
