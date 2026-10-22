import assert from "node:assert/strict";
import { test } from "node:test";

import {
  mapProductCategoriesForLocale,
  mapPublishedBrands,
  mapPublishedCategories,
} from "@/lib/public-catalog-mapping";
import {
  PUBLIC_CACHE_REVALIDATE_SECONDS,
  publicCacheTags,
  withPublicCache,
} from "@/lib/public-cache";

test("public cache wrapper preserves production config and falls back in direct Node execution", async () => {
  assert.equal(PUBLIC_CACHE_REVALIDATE_SECONDS, 300);
  assert.equal(publicCacheTags.brands, "catalogue:brands");
  assert.equal(publicCacheTags.products, "catalogue:products");
  assert.equal(publicCacheTags.product("p-1"), "catalogue:product:p-1");
  assert.equal(publicCacheTags.category("c-1"), "catalogue:category:c-1");
  assert.equal(
    publicCacheTags.categorySlug("summer"),
    "catalogue:category-slug:summer",
  );

  let calls = 0;
  const result = await withPublicCache(
    ["wrapper-test", "en"],
    async () => {
      calls += 1;
      return { locale: "en", ok: true };
    },
    { revalidate: 600, tags: [publicCacheTags.brands] },
  );

  assert.deepEqual(result, { locale: "en", ok: true });
  assert.equal(calls, 1);
});

test("public brands use the requested locale and English fallback", () => {
  const brands = [
    { id: "brand-1", baseName: "Base brand", logoUrl: null },
    { id: "brand-2", baseName: "Second brand", logoUrl: "/brand.png" },
  ];
  const translations = [
    { brandId: "brand-1", locale: "en" as const, name: "Brand" },
    { brandId: "brand-1", locale: "ar" as const, name: "علامة" },
  ];

  assert.deepEqual(mapPublishedBrands(brands, translations, "en"), [
    { id: "brand-1", name: "Brand", logoUrl: null },
    { id: "brand-2", name: "Second brand", logoUrl: "/brand.png" },
  ]);
  assert.deepEqual(mapPublishedBrands(brands, translations, "ar"), [
    { id: "brand-1", name: "علامة", logoUrl: null },
    { id: "brand-2", name: "Second brand", logoUrl: "/brand.png" },
  ]);
});

test("public product categories exclude unpublished rows and localize published rows", () => {
  const rows = [
    { category: { id: "published", status: "PUBLISHED" } },
    { category: { id: "draft", status: "DRAFT" } },
  ];
  const translations = [
    { categoryId: "published", locale: "en" as const, name: "Tools" },
    { categoryId: "published", locale: "ar" as const, name: "أدوات" },
    { categoryId: "draft", locale: "en" as const, name: "Draft" },
  ];

  assert.deepEqual(mapProductCategoriesForLocale(rows, translations, "en"), [
    { category: rows[0].category, translation: translations[0] },
  ]);
  assert.deepEqual(mapProductCategoriesForLocale(rows, translations, "ar"), [
    { category: rows[0].category, translation: translations[1] },
  ]);
});

test("public product category links use the current slug for legacy category records", () => {
  const rows = [
    {
      category: {
        id: "fabrics",
        status: "PUBLISHED",
        slug: "cloth-piece",
      },
    },
  ];
  const translations = [
    { categoryId: "fabrics", locale: "en" as const, name: "Fabrics & Textiles" },
  ];

  assert.equal(
    mapProductCategoriesForLocale(rows, translations, "en")[0]?.category.slug,
    "fabrics-textiles",
  );
});

test("public category directories require a published category and exact-locale translation", () => {
  const categories = [
    { id: "gloves", slug: "gloves", status: "PUBLISHED" },
    { id: "shoes", slug: "shoes", status: "PUBLISHED" },
    { id: "draft", slug: "draft", status: "DRAFT" },
  ];
  const translations = [
    { categoryId: "gloves", locale: "en" as const, name: "Gloves", description: null },
    { categoryId: "gloves", locale: "ar" as const, name: "قفازات", description: null },
    { categoryId: "shoes", locale: "en" as const, name: "Shoes", description: null },
    { categoryId: "draft", locale: "en" as const, name: "Draft", description: null },
  ];

  assert.deepEqual(
    mapPublishedCategories(categories, translations, "en").map(({ slug }) => slug),
    ["gloves", "shoes"],
  );
  assert.deepEqual(
    mapPublishedCategories(categories, translations, "ar").map(({ slug }) => slug),
    ["gloves"],
  );
});
