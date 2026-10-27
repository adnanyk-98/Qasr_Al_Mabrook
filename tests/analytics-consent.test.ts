import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AnalyticsConsentManager } from "@/components/analytics/analytics-consent-manager";
import arMessages from "@/i18n/messages/ar.json";
import enMessages from "@/i18n/messages/en.json";
import {
  ANALYTICS_CONSENT_COOKIE,
  CLARITY_PROJECT_ID,
  CLARITY_SCRIPT_ID,
  applyAnalyticsConsent,
  getAnalyticsScriptPlan,
  isCanonicalProductionHost,
  parseAnalyticsConsent,
  saveAnalyticsConsent,
} from "@/lib/analytics-consent";
import { trackEvent } from "@/lib/analytics";

function getSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? getSourceFiles(path) : [path];
  });
}

test("the consent prompt is localized in English and Arabic", () => {
  const english = renderToStaticMarkup(
    createElement(AnalyticsConsentManager, {
      initialConsent: null,
      canonicalProductionHost: true,
      locale: "en",
      copy: enMessages.analyticsConsent,
    }),
  );
  const arabic = renderToStaticMarkup(
    createElement(AnalyticsConsentManager, {
      initialConsent: null,
      canonicalProductionHost: true,
      locale: "ar",
      copy: arMessages.analyticsConsent,
    }),
  );

  assert.match(english, /Accept optional analytics/);
  assert.match(english, /Reject optional analytics/);
  assert.match(arabic, /الموافقة على التحليلات الاختيارية/);
  assert.match(arabic, /رفض التحليلات الاختيارية/);
  assert.match(arabic, /lang="ar"/);
  assert.match(arabic, /dir="rtl"/);
});

test("application source has no Google Analytics or Tag Manager integration", () => {
  const googleAnalyticsCode =
    /GOOGLE_ANALYTICS|GoogleAnalytics|NEXT_PUBLIC_GA_MEASUREMENT_ID|googletagmanager\.com|google-analytics\.com|gtag\s*\(/iu;
  for (const file of getSourceFiles("src")) {
    assert.doesNotMatch(readFileSync(file, "utf8"), googleAnalyticsCode, file);
  }
});

test("a missing or rejected preference does not load Clarity", () => {
  assert.equal(parseAnalyticsConsent(null), null);
  assert.equal(parseAnalyticsConsent("other=value"), null);
  assert.deepEqual(getAnalyticsScriptPlan(null, true), { clarity: false });
  assert.deepEqual(getAnalyticsScriptPlan("rejected", true), { clarity: false });
});

test("only accepted consent on the canonical production host loads Clarity", () => {
  assert.deepEqual(getAnalyticsScriptPlan("accepted", true), { clarity: true });

  for (const host of [
    "localhost:3000",
    "127.0.0.1",
    "qasr-al-mabrook.vercel.app",
    "preview.example.com",
    "www.qasralmabrook.com.evil.test",
  ]) {
    assert.equal(isCanonicalProductionHost(host), false, host);
    assert.deepEqual(
      getAnalyticsScriptPlan("accepted", isCanonicalProductionHost(host)),
      { clarity: false },
    );
  }
  assert.equal(isCanonicalProductionHost("www.qasralmabrook.com"), true);
  assert.equal(isCanonicalProductionHost("www.qasralmabrook.com:443"), true);
  assert.equal(isCanonicalProductionHost("WWW.QASRALMABROOK.COM"), true);
});

test("Clarity project and script identifiers are fixed", () => {
  assert.equal(CLARITY_PROJECT_ID, "z3oo92tnyo");
  assert.equal(CLARITY_SCRIPT_ID, "qam-clarity-loader");
});

test("acceptance and rejection persist as a first-party preference", () => {
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  let cookie = "";
  globalThis.window = { location: { protocol: "https:" } } as Window &
    typeof globalThis;
  globalThis.document = {
    get cookie() {
      return cookie;
    },
    set cookie(value: string) {
      cookie = value;
    },
  } as Document;

  try {
    saveAnalyticsConsent("accepted");
    assert.match(cookie, /^qam-analytics-consent=accepted;/);
    assert.match(cookie, /Path=\/; Max-Age=\d+; SameSite=Lax; Secure$/);

    saveAnalyticsConsent("rejected");
    assert.match(cookie, /^qam-analytics-consent=rejected;/);
    assert.equal(parseAnalyticsConsent(cookie), "rejected");
  } finally {
    globalThis.window = previousWindow;
    globalThis.document = previousDocument;
  }
});

test("Clarity Consent API V2 grants analytics only after acceptance and erases cookies on revocation", () => {
  const calls: unknown[][] = [];
  const runtime = {
    clarity: (...args: unknown[]) => calls.push(args),
  };

  applyAnalyticsConsent("accepted", runtime);
  assert.deepEqual(calls, [
    ["consentv2", { ad_Storage: "denied", analytics_Storage: "granted" }],
  ]);

  calls.length = 0;
  applyAnalyticsConsent("rejected", runtime);
  assert.deepEqual(calls, [
    ["consentv2", { ad_Storage: "denied", analytics_Storage: "denied" }],
    ["consent", false],
  ]);
});

test("application analytics events reach Clarity only with accepted consent", () => {
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  const clarityCalls: unknown[][] = [];
  const dispatchedEvents: unknown[] = [];
  globalThis.window = {
    clarity: (...args: unknown[]) => clarityCalls.push(args),
    dispatchEvent: (event: CustomEvent) => {
      dispatchedEvents.push(event.detail);
      return true;
    },
  } as unknown as Window & typeof globalThis;
  let cookie = "";
  globalThis.document = {
    get cookie() {
      return cookie;
    },
  } as Document;

  try {
    trackEvent("product_view", { product_slug: "example" });
    assert.deepEqual(clarityCalls, []);
    assert.deepEqual(dispatchedEvents, []);

    cookie = `${ANALYTICS_CONSENT_COOKIE}=accepted`;
    trackEvent("product_view", { product_slug: "example", product_id: undefined });
    assert.deepEqual(clarityCalls, [["event", "product_view"]]);
    assert.deepEqual(dispatchedEvents, [
      { name: "product_view", params: { product_slug: "example" } },
    ]);

    cookie = `${ANALYTICS_CONSENT_COOKIE}=rejected`;
    trackEvent("product_view", { product_slug: "example" });
    assert.equal(clarityCalls.length, 1);
    assert.equal(dispatchedEvents.length, 1);
  } finally {
    globalThis.window = previousWindow;
    globalThis.document = previousDocument;
  }
});
