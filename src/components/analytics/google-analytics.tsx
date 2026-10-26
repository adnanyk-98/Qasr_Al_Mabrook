"use client";

import Script from "next/script";

import {
  GOOGLE_ANALYTICS_SCRIPT_ID,
  GOOGLE_ANALYTICS_SOURCE_SCRIPT_ID,
} from "@/lib/analytics-consent";

const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function GoogleAnalytics() {
  if (!measurementId) return null;

  return (
    <>
      <Script
        id={GOOGLE_ANALYTICS_SOURCE_SCRIPT_ID}
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id={GOOGLE_ANALYTICS_SCRIPT_ID} strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || []; function gtag(){window.dataLayer.push(arguments);} window.gtag = gtag; gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied' }); gtag('js', new Date()); gtag('config', '${measurementId}', { anonymize_ip: true });`}
      </Script>
    </>
  );
}
