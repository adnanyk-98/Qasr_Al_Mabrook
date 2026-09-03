import assert from "node:assert/strict";
import { after, test } from "node:test";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { brandTranslations, brands, categories, productCategories, products } from "@/db/schema";
import { PUBLIC_CACHE_REVALIDATE_SECONDS, publicCacheTags, withPublicCache } from "@/lib/public-cache";
import { getPublishedBrands, listProductCategoriesForProduct } from "@/server/repositories/public-catalog";

after(async () => {
  await (db as typeof db & { $client: { end: () => Promise<void> } }).$client.end();
});

test("public cache wrapper preserves production config and falls back in direct Node execution", async () => {
  assert.equal(PUBLIC_CACHE_REVALIDATE_SECONDS, 300);
  assert.equal(publicCacheTags.brands, "catalogue:brands");
  assert.equal(publicCacheTags.products, "catalogue:products");
  assert.equal(publicCacheTags.product("p-1"), "catalogue:product:p-1");
  assert.equal(publicCacheTags.category("c-1"), "catalogue:category:c-1");
  assert.equal(publicCacheTags.categorySlug("summer"), "catalogue:category-slug:summer");

  let calls = 0;
  const result = await withPublicCache(["wrapper-test", "en"], async () => {
    calls += 1;
    return { locale: "en", ok: true };
  }, { revalidate: 600, tags: [publicCacheTags.brands] });

  assert.deepEqual(result, { locale: "en", ok: true });
  assert.equal(calls, 1);
});

test("public brands use the requested locale and English fallback", async (t) => {
  const publishedBrands = await db
    .select({ id: brands.id, baseName: brands.name })
    .from(brands)
    .where(and(eq(brands.enabled, true), eq(brands.status, "PUBLISHED")));
  const translations = publishedBrands.length
    ? await db.select().from(brandTranslations)
    : [];
  const englishByBrand = new Map(translations.filter((translation) => translation.locale === "en").map((translation) => [translation.brandId, translation.name]));
  const arabicByBrand = new Map(translations.filter((translation) => translation.locale === "ar").map((translation) => [translation.brandId, translation.name]));
  const english = await getPublishedBrands("en");
  const arabic = await getPublishedBrands("ar");

  assert.deepEqual(english.map((brand) => brand.id), publishedBrands.map((brand) => brand.id));
  for (const brand of publishedBrands) {
    assert.equal(english.find((candidate) => candidate.id === brand.id)?.name, englishByBrand.get(brand.id) ?? brand.baseName);
    assert.equal(arabic.find((candidate) => candidate.id === brand.id)?.name, arabicByBrand.get(brand.id) ?? englishByBrand.get(brand.id) ?? brand.baseName);
  }

  const missingArabicBrand = publishedBrands.find((brand) => !arabicByBrand.has(brand.id));
  if (!missingArabicBrand) {
    t.skip("current published brand data has no missing Arabic translation fixture");
    return;
  }

  assert.equal(arabic.find((brand) => brand.id === missingArabicBrand.id)?.name, englishByBrand.get(missingArabicBrand.id) ?? missingArabicBrand.baseName);
});

test("public product categories include only published categories", async (t) => {
  const publishedProduct = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.status, "PUBLISHED"))
    .limit(1);
  assert.ok(publishedProduct[0]);

  const categoriesForProduct = await listProductCategoriesForProduct(publishedProduct[0].id, "en");
  assert.ok(categoriesForProduct.every(({ category }) => category.status === "PUBLISHED"));

  const unpublishedRelation = await db
    .select({ productId: productCategories.productId })
    .from(productCategories)
    .innerJoin(products, eq(productCategories.productId, products.id))
    .innerJoin(categories, eq(productCategories.categoryId, categories.id))
    .where(and(eq(products.status, "PUBLISHED"), eq(categories.status, "DRAFT")))
    .limit(1);
  const archivedRelation = unpublishedRelation.length
    ? unpublishedRelation
    : await db
        .select({ productId: productCategories.productId })
        .from(productCategories)
        .innerJoin(products, eq(productCategories.productId, products.id))
        .innerJoin(categories, eq(productCategories.categoryId, categories.id))
        .where(and(eq(products.status, "PUBLISHED"), eq(categories.status, "ARCHIVED")))
        .limit(1);

  if (!archivedRelation[0]) {
    t.skip("current database has no published product linked to an unpublished category fixture");
    return;
  }

  const result = await listProductCategoriesForProduct(archivedRelation[0].productId, "en");
  assert.ok(result.every(({ category }) => category.status === "PUBLISHED"));
});
