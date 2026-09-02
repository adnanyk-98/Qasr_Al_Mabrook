import assert from "node:assert/strict";
import { after, test } from "node:test";

import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { products } from "@/db/schema";
import { localePath } from "@/lib/locales";
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