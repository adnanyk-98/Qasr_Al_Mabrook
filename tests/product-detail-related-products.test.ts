import test from "node:test";
import assert from "node:assert/strict";

import { isRelatedProductEligible } from "@/server/repositories/public-catalog";

test("includes same-category published products and excludes the current product", () => {
  const allowedCategories = new Set(["cat-a", "cat-b"]);
  const products = [
    { id: "p-1", status: "PUBLISHED", categoryIds: ["cat-a"] },
    { id: "p-2", status: "PUBLISHED", categoryIds: ["cat-z"] },
    { id: "p-3", status: "PUBLISHED", categoryIds: ["cat-b"] },
  ];

  const eligible = products.filter((product) => isRelatedProductEligible(product, "p-2", allowedCategories));

  assert.deepEqual(eligible.map((product) => product.id), ["p-1", "p-3"]);
});

test("excludes inactive, unpublished, and different-category products", () => {
  const allowedCategories = new Set(["cat-a"]);
  const products = [
    { id: "p-1", status: "DRAFT", categoryIds: ["cat-a"] },
    { id: "p-2", status: "PUBLISHED", categoryIds: ["cat-b"] },
    { id: "p-3", status: "ARCHIVED", categoryIds: ["cat-a"] },
    { id: "p-4", status: "PUBLISHED", categoryIds: ["cat-a"] },
  ];

  const eligible = products.filter((product) => isRelatedProductEligible(product, "p-9", allowedCategories));

  assert.deepEqual(eligible.map((product) => product.id), ["p-4"]);
});

test("returns false when the product is current or no category match exists", () => {
  const allowedCategories = new Set(["cat-a"]);

  assert.equal(isRelatedProductEligible({ id: "p-1", status: "PUBLISHED", categoryIds: ["cat-a"] }, "p-1", allowedCategories), false);
  assert.equal(isRelatedProductEligible({ id: "p-2", status: "PUBLISHED", categoryIds: ["cat-b"] }, "p-9", allowedCategories), false);
  assert.equal(isRelatedProductEligible({ id: "p-3", status: "PUBLISHED", categoryIds: [] }, "p-9", allowedCategories), false);
});
