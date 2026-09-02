import test from "node:test";
import assert from "node:assert/strict";

import { reorderProductImages } from "@/lib/product-image-order";
import { resolvePrimaryProductImageId } from "@/lib/product-image-primary";

test("reorders product images and renumbers sort order without losing the primary image", () => {
  const images = [
    { id: "a", publicUrl: "a", objectKey: "a", sortOrder: 0, isPrimary: false },
    { id: "b", publicUrl: "b", objectKey: "b", sortOrder: 1, isPrimary: true },
    { id: "c", publicUrl: "c", objectKey: "c", sortOrder: 2, isPrimary: false },
  ];

  const reordered = reorderProductImages(images, 2, "up");

  assert.deepEqual(
    reordered.map((image) => image.id),
    ["a", "c", "b"],
  );
  assert.deepEqual(
    reordered.map((image) => image.sortOrder),
    [0, 1, 2],
  );
  assert.equal(reordered.find((image) => image.isPrimary)?.id, "b");
});

test("leaves the order unchanged when the move is out of bounds", () => {
  const images = [
    { id: "a", publicUrl: "a", objectKey: "a", sortOrder: 0, isPrimary: true },
    { id: "b", publicUrl: "b", objectKey: "b", sortOrder: 1, isPrimary: false },
  ];

  const reordered = reorderProductImages(images, 0, "up");

  assert.deepEqual(reordered.map((image) => image.id), ["a", "b"]);
  assert.deepEqual(reordered.map((image) => image.sortOrder), [0, 1]);
});

test("switches primary selection only when explicitly requested", () => {
  assert.equal(
    resolvePrimaryProductImageId({
      currentPrimaryImageId: "existing",
      candidateImageId: "replacement",
      isPrimaryChecked: false,
    }),
    "existing",
  );
  assert.equal(
    resolvePrimaryProductImageId({
      currentPrimaryImageId: "existing",
      candidateImageId: "replacement",
      isPrimaryChecked: true,
    }),
    "replacement",
  );
});

test("preserves the primary image while reordering", () => {
  const images = [
    { id: "primary", objectKey: "primary", sortOrder: 0, isPrimary: true },
    { id: "other", objectKey: "other", sortOrder: 1, isPrimary: false },
  ];

  const reordered = reorderProductImages(images, 0, "down");
  assert.equal(reordered.find((image) => image.isPrimary)?.id, "primary");
});
