"use client";

import Script from "next/script";

import { CLARITY_PROJECT_ID, CLARITY_SCRIPT_ID } from "@/lib/analytics-consent";

const clarityBootstrap = `(() => {
  const w = window;
  if (w.__qamClarityLoaded) return;
  w.__qamClarityLoaded = true;
  w.clarity = w.clarity || function() {
    (w.clarity.q = w.clarity.q || []).push(arguments);
  };
  w.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' });
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.clarity.ms/tag/${CLARITY_PROJECT_ID}';
  script.dataset.qamClarity = 'true';
  document.head.appendChild(script);
})();`;

export function ClarityAnalytics() {
  return (
    <Script id={CLARITY_SCRIPT_ID} strategy="afterInteractive">
      {clarityBootstrap}
    </Script>
  );
}
