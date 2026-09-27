import assert from "node:assert/strict";
import test from "node:test";

import { createSquareCropArea, isSquareImageDimensions } from "@/lib/image-crop";

test("detects square image dimensions", () => {
  assert.equal(isSquareImageDimensions(1200, 1200), true);
  assert.equal(isSquareImageDimensions(1200, 900), false);
  assert.equal(isSquareImageDimensions(0, 1200), false);
});

test("creates a centered square crop area from a landscape image", () => {
  const crop = createSquareCropArea(1600, 900);

  assert.equal(crop.width, 900);
  assert.equal(crop.height, 900);
  assert.equal(crop.x, 350);
  assert.equal(crop.y, 0);
});

test("creates a centered square crop area from a portrait image", () => {
  const crop = createSquareCropArea(900, 1600);

  assert.equal(crop.width, 900);
  assert.equal(crop.height, 900);
  assert.equal(crop.x, 0);
  assert.equal(crop.y, 350);
});
