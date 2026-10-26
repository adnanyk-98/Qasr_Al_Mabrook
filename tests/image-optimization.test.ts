import assert from "node:assert/strict";
import { test } from "node:test";

import { isNextImageOptimizableSource } from "@/lib/image-optimization";
import nextConfig from "../next.config";

test("image optimization is limited to local paths and the configured media origin", () => {
  assert.equal(isNextImageOptimizableSource("/catalogue/item.jpg"), true);
  assert.equal(
    isNextImageOptimizableSource("https://media.qasralmabrook.com/catalogue/item.jpg"),
    true,
  );
  assert.equal(
    isNextImageOptimizableSource(
      "https://media.qasralmabrook.com/catalogue/item.jpg?width=800",
    ),
    false,
  );
  assert.equal(
    isNextImageOptimizableSource("https://untrusted.example/item.jpg"),
    false,
  );
  assert.equal(isNextImageOptimizableSource("//untrusted.example/item.jpg"), false);
});

test("the Next.js image allowlist is restricted to the public media host", () => {
  const mediaPattern = nextConfig.images?.remotePatterns?.find(
    (pattern) =>
      !(pattern instanceof URL) && pattern.hostname === "media.qasralmabrook.com",
  );

  assert.ok(mediaPattern);
  assert.equal(mediaPattern.protocol, "https");
  assert.equal(mediaPattern.pathname, "/**");
  assert.equal(mediaPattern.search, "");
});
