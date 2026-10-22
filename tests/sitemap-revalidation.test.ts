import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  getCategorySlugsForInvalidation,
  getProductSlugsForInvalidation,
  revalidateBlogCategoryLinksAfterMutation,
  revalidateSitemapAfterMutation,
} from "@/lib/public-cache";
import { getBlogCategoryIds, renderBlogCategoryLinks } from "@/lib/blog-category-links";
import type { BlogArticle } from "@/lib/blog";

const testBlogArticles: BlogArticle[] = [
  {
    slug: "adivasi-oil-overview",
    publishedAt: "2026-10-01",
    updatedAt: "2026-10-01",
    featuredImage: "/test-image.jpg",
    title: { en: "Adivasi Oil", ar: "زيت الأديڤاسي" },
    excerpt: { en: "Overview", ar: "نظرة عامة" },
    summary: { en: "Summary", ar: "ملخص" },
    body: {
      en: [
        '<p><a href="category-id:9c63ae52-6468-4a21-b8a3-c08ae78c3d3d">Hair Oils</a></p>',
      ],
      ar: [
        '<p><a href="category-id:9c63ae52-6468-4a21-b8a3-c08ae78c3d3d">زيوت الشعر</a></p>',
      ],
    },
  },
];

const serviceActions = readFileSync(
  resolve("src/server/services/admin-catalog.ts"),
  "utf8",
).replace(/\s+/g, " ");
const translationActions = readFileSync(
  resolve("src/app/(admin)/admin/translations/actions.ts"),
  "utf8",
).replace(/\s+/g, " ");
const categoryDeleteRoute = readFileSync(
  resolve("src/app/api/admin/categories/delete/route.ts"),
  "utf8",
).replace(/\s+/g, " ");
const productDeleteRoute = readFileSync(
  resolve("src/app/api/admin/products/delete/route.ts"),
  "utf8",
).replace(/\s+/g, " ");
const blogArticleRoute = readFileSync(
  resolve("src/app/[locale]/(with-loading)/blog/[slug]/page.tsx"),
  "utf8",
).replace(/\s+/g, " ");

test("sitemap revalidation runs only for successful mutation results", () => {
  const paths: string[] = [];
  const revalidate = (path: string) => paths.push(path);

  revalidateSitemapAfterMutation({ id: "saved" }, revalidate);
  revalidateSitemapAfterMutation(null, revalidate);
  revalidateSitemapAfterMutation(undefined, revalidate);

  assert.deepEqual(paths, ["/sitemap.xml"]);
});

test("Admin category and product URL mutations revalidate sitemap only after successful writes", () => {
  assert.ok(serviceActions.includes("revalidateSitemapAfterMutation(updatedCategory)"));
  assert.ok(serviceActions.includes("revalidateSitemapAfterMutation(created)"));
  assert.ok(
    serviceActions.includes("revalidateSitemapAfterMutation(createdTranslation)"),
  );
  assert.match(
    serviceActions,
    /invalidateProductPublicCache\(\s*createdOrUpdatedProductId,\s*slug,\s*existingProduct\?\.slug,?\s*\)/,
  );

  const savedGuard = serviceActions.indexOf("if (!saved) return");
  const productRevalidation = serviceActions.indexOf(
    "revalidateSitemapAfterMutation(saved)",
  );
  assert.ok(savedGuard >= 0 && productRevalidation > savedGuard);

  const failedTranslationGuard = translationActions.indexOf("if (!translation) {");
  const firstTranslationRevalidation = translationActions.indexOf(
    "revalidateSitemapAfterMutation(translation)",
  );
  assert.ok(
    failedTranslationGuard >= 0 &&
      firstTranslationRevalidation > failedTranslationGuard,
  );
  assert.ok(translationActions.includes("revalidateSitemapAfterMutation(deleted)"));

  const failedProductDeleteGuard = productDeleteRoute.indexOf("if (!deleted) return");
  const productDeleteRevalidation = productDeleteRoute.indexOf(
    "revalidateSitemapAfterMutation(deleted)",
  );
  assert.ok(
    failedProductDeleteGuard >= 0 &&
      productDeleteRevalidation > failedProductDeleteGuard,
  );
  assert.ok(categoryDeleteRoute.includes("revalidateSitemapAfterMutation(result)"));
  assert.ok(
    serviceActions.includes(
      "revalidateBlogCategoryLinksAfterMutation(updatedCategory, updatedCategory?.id)",
    ),
  );
  assert.ok(
    serviceActions.includes(
      "revalidateBlogCategoryLinksAfterMutation(created, created?.id)",
    ),
  );
  assert.ok(
    translationActions.includes(
      "revalidateBlogCategoryLinksAfterMutation(translation, category.id)",
    ),
  );
  assert.ok(
    translationActions.includes(
      "revalidateBlogCategoryLinksAfterMutation(deleted, existing.categoryId)",
    ),
  );
  assert.ok(
    categoryDeleteRoute.includes(
      "revalidateBlogCategoryLinksAfterMutation(result, result.id)",
    ),
  );
  assert.match(
    blogArticleRoute,
    /getPublishedCategorySlugsByIds\(\s*currentLocale,\s*categoryIds,\s*\)/,
  );
});

test("category rename cache invalidation retains both old and new paths", () => {
  assert.deepEqual(getCategorySlugsForInvalidation("hair-oils", "adivasi-oil"), [
    "hair-oils",
    "adivasi-oil",
  ]);
});

test("product slug cache invalidation retains both old and new paths", () => {
  assert.deepEqual(getProductSlugsForInvalidation("new-product", "old-product"), [
    "new-product",
    "old-product",
  ]);
});

test("category mutations revalidate only localized blog articles linked to that category", () => {
  const calls: string[] = [];
  const revalidate = (path: string) => calls.push(path);
  const categoryId = "9c63ae52-6468-4a21-b8a3-c08ae78c3d3d";

  revalidateBlogCategoryLinksAfterMutation(
    { id: "updated" },
    categoryId,
    revalidate,
    testBlogArticles,
  );
  revalidateBlogCategoryLinksAfterMutation(
    null,
    categoryId,
    revalidate,
    testBlogArticles,
  );
  revalidateBlogCategoryLinksAfterMutation(
    { id: "updated" },
    undefined,
    revalidate,
    testBlogArticles,
  );

  assert.deepEqual(calls, [
    "/en/blog/adivasi-oil-overview",
    "/ar/blog/adivasi-oil-overview",
  ]);
});

test("blog article category links resolve current slugs for both locales without changing article content", () => {
  const article = testBlogArticles[0];
  const originalEnglish = article.body.en[0];
  const originalArabic = article.body.ar[0];
  const categoryIds = getBlogCategoryIds(article.body.en);
  assert.deepEqual(categoryIds, ["9c63ae52-6468-4a21-b8a3-c08ae78c3d3d"]);

  const firstSlug = new Map([[categoryIds[0], "hair-oils"]]);
  const changedSlug = new Map([[categoryIds[0], "updated-hair-oils"]]);
  const englishFirst = renderBlogCategoryLinks("en", originalEnglish, firstSlug);
  const englishUpdated = renderBlogCategoryLinks("en", originalEnglish, changedSlug);
  const arabicUpdated = renderBlogCategoryLinks("ar", originalArabic, changedSlug);

  assert.notEqual(englishFirst, englishUpdated);
  assert.ok(englishFirst.includes('href="/en/categories/hair-oils"'));
  assert.ok(englishUpdated.includes('href="/en/categories/updated-hair-oils"'));
  assert.ok(arabicUpdated.includes('href="/ar/categories/updated-hair-oils"'));
  assert.ok(englishUpdated.includes(">Hair Oils</a>"));
  assert.ok(arabicUpdated.includes(">زيوت الشعر</a>"));
  assert.equal(article.body.en[0], originalEnglish);
  assert.equal(article.body.ar[0], originalArabic);
});

test("missing or unpublished category references render link text without a broken URL", () => {
  for (const [locale, label] of [
    ["en", "Hair Oils"],
    ["ar", "زيوت الشعر"],
  ] as const) {
    const body = `<p><a href="category-id:9c63ae52-6468-4a21-b8a3-c08ae78c3d3d">${label}</a></p>`;
    const rendered = renderBlogCategoryLinks(locale, body, new Map());

    assert.equal(rendered, `<p>${label}</p>`);
    assert.ok(!rendered.includes("category-id:"));
    assert.ok(!rendered.includes("/categories/"));
  }
});

test("all localized blog category links use stable IDs and product URLs remain authored", () => {
  const body =
    '<a href="category-id:9c63ae52-6468-4a21-b8a3-c08ae78c3d3d">Hair Oils</a>' +
    '<a href="/en/products/pajama">Pajama</a>' +
    '<a href="/ar/products/pajama">بيجاما</a>';

  assert.ok(!/href="\/(?:en|ar)\/categories\//.test(body));
  assert.ok(body.includes('href="category-id:'));
  assert.ok(body.includes('href="/en/products/pajama"'));
  assert.ok(body.includes('href="/ar/products/pajama"'));
});

test("all blog category IDs match their current published records and localized slugs", () => {
  const currentRecords = new Map([
    ["9c63ae52-6468-4a21-b8a3-c08ae78c3d3d", "hair-oils"],
    ["3703a065-d590-4335-80d3-fcebdaf5dd61", "fabrics-textiles"],
    ["a8d36d07-3881-410a-a8a5-cb81ba72dc00", "mens-bottom-wear"],
    ["f4b74bfb-a999-416e-8402-f48bea7c3f36", "measuring-tape"],
    ["fe12dc19-cd89-452b-83d0-f6aedd948386", "fancy-suit"],
  ]);
  const ids = [...currentRecords.keys()];
  const bodies = {
    en: ids.map((id) => `<a href="category-id:${id}">Category</a>`).join(" "),
    ar: ids.map((id) => `<a href="category-id:${id}">فئة</a>`).join(" "),
  };
  const referencedIds = [
    ...new Set(
      (["en", "ar"] as const).flatMap((locale) => getBlogCategoryIds([bodies[locale]])),
    ),
  ].sort();

  assert.deepEqual(referencedIds, ids.sort());
  for (const locale of ["en", "ar"] as const) {
    const rendered = renderBlogCategoryLinks(locale, bodies[locale], currentRecords);
    for (const id of getBlogCategoryIds([bodies[locale]])) {
      const slug = currentRecords.get(id);
      assert.ok(slug, `Unknown category ID ${id}`);
      assert.ok(rendered.includes(`href="/${locale}/categories/${slug}"`));
    }
    assert.ok(!rendered.includes("category-id:"));
  }
});

test("localized category-link fixtures render resolved URLs without placeholders", () => {
  const currentSlugs = new Map([
    ["9c63ae52-6468-4a21-b8a3-c08ae78c3d3d", "hair-oils"],
    ["3703a065-d590-4335-80d3-fcebdaf5dd61", "fabrics-textiles"],
    ["a8d36d07-3881-410a-a8a5-cb81ba72dc00", "mens-bottom-wear"],
    ["f4b74bfb-a999-416e-8402-f48bea7c3f36", "measuring-tape"],
    ["fe12dc19-cd89-452b-83d0-f6aedd948386", "fancy-suit"],
  ]);

  for (const locale of ["en", "ar"] as const) {
    const body = testBlogArticles[0].body[locale].join("");
    const rendered = renderBlogCategoryLinks(locale, body, currentSlugs);
    assert.ok(!rendered.includes("category-id:"), `${locale} leaked a placeholder`);
    assert.ok(
      !/<a href="[^"]*category-id:/.test(rendered),
      `${locale} has an unresolved category href`,
    );
  }
});
