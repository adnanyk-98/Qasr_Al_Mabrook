import assert from "node:assert/strict";
import { after, test } from "node:test";

import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { products } from "@/db/schema";
import { localePath } from "@/lib/locales";
import { filterAutocompleteResults } from "@/lib/public-search";
import { searchPublishedProductsAutocomplete } from "@/server/repositories/public-catalog";

after(async () => {
  await (db as typeof db & { $client: { end: () => Promise<void> } }).$client.end();
});

test("autocomplete returns no results for an empty query", async () => {
  assert.deepEqual(await searchPublishedProductsAutocomplete("en", "   "), []);
});

test("autocomplete returns localized, published product results with a limit", async () => {
  const englishResults = await searchPublishedProductsAutocomplete("en", "measuring", 2);
  const arabicResults = await searchPublishedProductsAutocomplete("ar", "قياس", 6);

  assert.ok(englishResults.length > 0);
  assert.ok(englishResults.length <= 2);
  assert.ok(englishResults.every((result) => result.name && result.categoryName && result.slug));
  assert.ok(arabicResults.length > 0);
  assert.ok(arabicResults.every((result) => /[\u0600-\u06ff]/u.test(result.name)));
  assert.ok(arabicResults.every((result) => result.categoryName && /[\u0600-\u06ff]/u.test(result.categoryName)));

  const ids = englishResults.map((result) => result.id);
  const publishedRows = await db.select({ id: products.id }).from(products).where(and(eq(products.status, "PUBLISHED"), inArray(products.id, ids)));
  assert.equal(publishedRows.length, ids.length);
  assert.equal(localePath("en", `/products/${englishResults[0].slug}`), `/en/products/${englishResults[0].slug}`);
  assert.equal(localePath("ar", `/products/${arabicResults[0].slug}`), `/ar/products/${arabicResults[0].slug}`);
});

test("local autocomplete filtering preserves matching, order, limit, and no-results behavior", () => {
  const results = [
    { id: "1", slug: "5m-measuring-tape", name: "5M Measuring Tape", categoryName: "Tools", sku: "TAPE-5", imageUrl: null, imageAlt: null },
    { id: "2", slug: "adivasi-oil", name: "Adivasi Oil", categoryName: "Personal Care", sku: "OIL-1", imageUrl: null, imageAlt: null },
    { id: "3", slug: "7m-measuring-tape", name: "7M Measuring Tape", categoryName: "Tools", sku: "TAPE-7", imageUrl: null, imageAlt: null },
  ];

  assert.deepEqual(filterAutocompleteResults(results, "TAPE", 1).map((result) => result.id), ["1"]);
  assert.deepEqual(filterAutocompleteResults(results, "oil").map((result) => result.id), ["2"]);
  assert.deepEqual(filterAutocompleteResults(results, "missing"), []);
});