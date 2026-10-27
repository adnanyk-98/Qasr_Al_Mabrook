import assert from "node:assert/strict";
import test from "node:test";

import { trackEvent } from "@/lib/analytics";
import { ANALYTICS_CONSENT_COOKIE } from "@/lib/analytics-consent";

test("dispatches analytics events without undefined parameters", () => {
  const events: unknown[] = [];
  const clarityCalls: unknown[][] = [];
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  globalThis.window = {
    clarity: (...args: unknown[]) => clarityCalls.push(args),
    dispatchEvent: (event: CustomEvent) => {
      events.push(event.detail);
      return true;
    },
  } as unknown as Window & typeof globalThis;
  globalThis.document = {
    cookie: `${ANALYTICS_CONSENT_COOKIE}=accepted`,
  } as Document;

  try {
    trackEvent("product_request_quote", {
      product_slug: "cloth-piece",
      locale: "en",
      product_id: undefined,
    });
  } finally {
    globalThis.window = previousWindow;
    globalThis.document = previousDocument;
  }

  assert.deepEqual(events, [
    {
      name: "product_request_quote",
      params: { product_slug: "cloth-piece", locale: "en" },
    },
  ]);
  assert.deepEqual(clarityCalls, [["event", "product_request_quote"]]);
});
