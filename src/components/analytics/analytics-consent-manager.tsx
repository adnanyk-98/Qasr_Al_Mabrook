"use client";

import { useRef, useState } from "react";

import { ClarityAnalytics } from "@/components/analytics/clarity-analytics";
import {
  getAnalyticsScriptPlan,
  applyAnalyticsConsent,
  saveAnalyticsConsent,
  type AnalyticsConsent,
} from "@/lib/analytics-consent";
import type { Locale } from "@/lib/locales";

type ConsentCopy = {
  title: string;
  description: string;
  accept: string;
  reject: string;
  manage: string;
};

declare global {
  interface Window {
    clarity?: (...args: unknown[]) => void;
  }
}

export function AnalyticsConsentManager({
  initialConsent,
  canonicalProductionHost,
  locale,
  copy,
}: {
  initialConsent: AnalyticsConsent;
  canonicalProductionHost: boolean;
  locale: Locale;
  copy: ConsentCopy;
}) {
  const [consent, setConsent] = useState(initialConsent);
  const [isOpen, setIsOpen] = useState(initialConsent === null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const manageRef = useRef<HTMLButtonElement>(null);
  const plan = getAnalyticsScriptPlan(consent, canonicalProductionHost);

  function chooseConsent(nextConsent: Exclude<AnalyticsConsent, null>) {
    saveAnalyticsConsent(nextConsent);
    applyAnalyticsConsent(nextConsent);
    setConsent(nextConsent);
    setIsOpen(false);
    requestAnimationFrame(() => manageRef.current?.focus());
  }

  function openPreferences() {
    setIsOpen(true);
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  return (
    <>
      {plan.clarity && <ClarityAnalytics />}
      {isOpen ? (
        <section
          aria-labelledby="analytics-consent-title"
          className="fixed inset-x-0 bottom-0 z-[100] border-t border-[var(--brand-border)] bg-white p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] sm:p-6"
          dir={locale === "ar" ? "rtl" : "ltr"}
          lang={locale}
          role="region"
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <h2
                id="analytics-consent-title"
                className="text-base font-semibold text-neutral-950"
                ref={headingRef}
                tabIndex={-1}
              >
                {copy.title}
              </h2>
              <p className="mt-1 text-sm leading-6 text-neutral-700">
                {copy.description}
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              <button
                className="min-h-11 rounded-md border border-[#7f1518] px-4 py-2 text-sm font-semibold text-[#7f1518] hover:bg-[#f8eeee] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7f1518]"
                onClick={() => chooseConsent("accepted")}
                type="button"
              >
                {copy.accept}
              </button>
              <button
                className="min-h-11 rounded-md border border-neutral-500 px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-700"
                onClick={() => chooseConsent("rejected")}
                type="button"
              >
                {copy.reject}
              </button>
            </div>
          </div>
        </section>
      ) : (
        <button
          className="fixed bottom-4 end-4 z-[100] min-h-11 rounded-md border border-neutral-400 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 shadow-md hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7f1518]"
          onClick={openPreferences}
          ref={manageRef}
          type="button"
        >
          {copy.manage}
        </button>
      )}
    </>
  );
}
