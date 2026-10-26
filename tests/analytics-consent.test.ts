import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AnalyticsConsentManager } from "@/components/analytics/analytics-consent-manager";
import enMessages from "@/i18n/messages/en.json";
import arMessages from "@/i18n/messages/ar.json";
import {
  ANALYTICS_CONSENT_COOKIE,
  CLARITY_PROJECT_ID,
  CLARITY_SCRIPT_ID,
  GOOGLE_ANALYTICS_SCRIPT_ID,
  GOOGLE_ANALYTICS_SOURCE_SCRIPT_ID,
  applyAnalyticsConsent,
  getAnalyticsScriptPlan,
  isCanonicalProductionHost,
  parseAnalyticsConsent,
  saveAnalyticsConsent,
} from "@/lib/analytics-consent";
import { trackEvent } from "@/lib/analytics";

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
  assert.doesNotMatch(english, /googletagmanager|clarity\.ms/);
  assert.match(arabic, /الموافقة على التحليلات الاختيارية/);
  assert.match(arabic, /رفض التحليلات الاختيارية/);
  assert.match(arabic, /lang="ar"/);
  assert.match(arabic, /dir="rtl"/);
});

test("no preference and rejection keep both analytics systems disabled", () => {
  assert.equal(parseAnalyticsConsent(null), null);
  assert.equal(parseAnalyticsConsent("other=value"), null);
  assert.equal(getAnalyticsScriptPlan(null, true, true).googleAnalytics, false);
  assert.equal(getAnalyticsScriptPlan(null, true, true).clarity, false);
  assert.deepEqual(getAnalyticsScriptPlan("rejected", true, true), {
    googleAnalytics: false,
    clarity: false,
  });
  assert.deepEqual(getAnalyticsScriptPlan("accepted", false, true), {
    googleAnalytics: true,
    clarity: false,
  });
});

test("acceptance enables configured analytics and revocation disables them again", () => {
  assert.equal(
    parseAnalyticsConsent(`${ANALYTICS_CONSENT_COOKIE}=accepted`),
    "accepted",
  );
  assert.deepEqual(getAnalyticsScriptPlan("accepted", true, true), {
    googleAnalytics: true,
    clarity: true,
  });
  assert.deepEqual(getAnalyticsScriptPlan("rejected", true, true), {
    googleAnalytics: false,
    clarity: false,
  });
  assert.deepEqual(getAnalyticsScriptPlan("accepted", true, false), {
    googleAnalytics: false,
    clarity: true,
  });
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
  } finally {
    globalThis.window = previousWindow;
    globalThis.document = previousDocument;
  }
});

test("Clarity is limited to the canonical production hostname", () => {
  for (const host of [
    "localhost:3000",
    "127.0.0.1",
    "qasr-al-mabrook.vercel.app",
    "preview.example.com",
    "www.qasralmabrook.com.evil.test",
  ]) {
    assert.equal(isCanonicalProductionHost(host), false, host);
  }
  assert.equal(isCanonicalProductionHost("www.qasralmabrook.com"), true);
  assert.equal(isCanonicalProductionHost("www.qasralmabrook.com:443"), true);
  assert.equal(isCanonicalProductionHost("WWW.QASRALMABROOK.COM"), true);
});

test("Clarity project and script identifiers are fixed and unique", () => {
  assert.equal(CLARITY_PROJECT_ID, "z3oo92tnyo");
  const scriptIds = [
    CLARITY_SCRIPT_ID,
    GOOGLE_ANALYTICS_SCRIPT_ID,
    GOOGLE_ANALYTICS_SOURCE_SCRIPT_ID,
  ];
  assert.equal(new Set(scriptIds).size, scriptIds.length);
});

test("changing consent updates both systems and revocation clears Clarity cookies", () => {
  const calls: unknown[][] = [];
  const runtime = {
    gtag: (...args: unknown[]) => calls.push(["gtag", ...args]),
    clarity: (...args: unknown[]) => calls.push(["clarity", ...args]),
  };

  applyAnalyticsConsent("accepted", runtime);
  assert.deepEqual(calls, [
    [
      "gtag",
      "consent",
      "update",
      { analytics_storage: "granted", ad_storage: "denied" },
    ],
    ["clarity", "consentv2", { ad_Storage: "denied", analytics_Storage: "granted" }],
  ]);

  calls.length = 0;
  applyAnalyticsConsent("rejected", runtime);
  assert.deepEqual(calls, [
    [
      "gtag",
      "consent",
      "update",
      { analytics_storage: "denied", ad_storage: "denied" },
    ],
    ["clarity", "consentv2", { ad_Storage: "denied", analytics_Storage: "denied" }],
    ["clarity", "consent", false],
  ]);
});

test("trackEvent sends nothing until optional analytics is accepted", () => {
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  const events: unknown[] = [];
  const fakeWindow = {
    dispatchEvent: (event: CustomEvent) => {
      events.push(event.detail);
      return true;
    },
    gtag: (...args: unknown[]) => events.push(args),
  } as unknown as Window & typeof globalThis;
  let cookie = "";

  globalThis.window = fakeWindow;
  globalThis.document = {
    get cookie() {
      return cookie;
    },
  } as Document;
  try {
    trackEvent("product_view", { product_slug: "example" });
    assert.deepEqual(events, []);

    cookie = `${ANALYTICS_CONSENT_COOKIE}=accepted`;
    trackEvent("product_view", { product_slug: "example" });
    assert.equal(events.length, 2);

    events.length = 0;
    cookie = `${ANALYTICS_CONSENT_COOKIE}=rejected`;
    trackEvent("product_view", { product_slug: "example" });
    assert.deepEqual(events, []);
  } finally {
    globalThis.window = previousWindow;
    globalThis.document = previousDocument;
  }
});
