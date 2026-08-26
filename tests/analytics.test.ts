import assert from "node:assert/strict";
import test from "node:test";

import { trackEvent } from "@/lib/analytics";

test("dispatches analytics events without undefined parameters", () => {
  const events: unknown[] = [];
  const previousWindow = globalThis.window;
  globalThis.window = {
    dispatchEvent: (event: CustomEvent) => {
      events.push(event.detail);
      return true;
    },
  } as unknown as Window & typeof globalThis;

  try {
    trackEvent("product_request_quote", { product_slug: "cloth-piece", locale: "en", product_id: undefined });
  } finally {
    globalThis.window = previousWindow;
  }

  assert.deepEqual(events, [{ name: "product_request_quote", params: { product_slug: "cloth-piece", locale: "en" } }]);
});