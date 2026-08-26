import assert from "node:assert/strict";
import test from "node:test";

import { validateBrandLogoUpload } from "@/lib/brand-media";

test("accepts a valid square brand logo", () => {
  const result = validateBrandLogoUpload({ mimeType: "image/png", size: 1000, width: 512, height: 512 });
  assert.equal(result.ok, true);
});

test("rejects a non-square brand logo", () => {
  const result = validateBrandLogoUpload({ mimeType: "image/png", size: 1000, width: 512, height: 256 });
  assert.deepEqual(result, { ok: false, error: "Brand logos must be square (1:1)." });
});

test("rejects a brand logo below the minimum dimensions", () => {
  const result = validateBrandLogoUpload({ mimeType: "image/png", size: 1000, width: 128, height: 128 });
  assert.deepEqual(result, { ok: false, error: "Brand logo must be at least 256 × 256 pixels." });
});
