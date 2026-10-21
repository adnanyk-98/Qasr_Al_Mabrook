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
import { blogArticles } from "@/lib/blog";

const serviceActions = readFileSync(resolve("src/server/services/admin-catalog.ts"), "utf8");
const translationActions = readFileSync(resolve("src/app/(admin)/admin/translations/actions.ts"), "utf8");
const categoryDeleteRoute = readFileSync(resolve("src/app/api/admin/categories/delete/route.ts"), "utf8");
const productDeleteRoute = readFileSync(resolve("src/app/api/admin/products/delete/route.ts"), "utf8");
const blogArticleRoute = readFileSync(resolve("src/app/[locale]/(with-loading)/blog/[slug]/page.tsx"), "utf8");

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
  assert.ok(serviceActions.includes("revalidateSitemapAfterMutation(createdTranslation)"));
  assert.ok(serviceActions.includes("invalidateProductPublicCache(createdOrUpdatedProductId, slug, existingProduct?.slug)"));

  const savedGuard = serviceActions.indexOf("if (!saved) return");
  const productRevalidation = serviceActions.indexOf("revalidateSitemapAfterMutation(saved)");
  assert.ok(savedGuard >= 0 && productRevalidation > savedGuard);

  const failedTranslationGuard = translationActions.indexOf("if (!translation) {");
  const firstTranslationRevalidation = translationActions.indexOf("revalidateSitemapAfterMutation(translation)");
  assert.ok(failedTranslationGuard >= 0 && firstTranslationRevalidation > failedTranslationGuard);
  assert.ok(translationActions.includes("revalidateSitemapAfterMutation(deleted)"));

  const failedProductDeleteGuard = productDeleteRoute.indexOf("if (!deleted) return");
  const productDeleteRevalidation = productDeleteRoute.indexOf("revalidateSitemapAfterMutation(deleted)");
  assert.ok(failedProductDeleteGuard >= 0 && productDeleteRevalidation > failedProductDeleteGuard);
  assert.ok(categoryDeleteRoute.includes("revalidateSitemapAfterMutation(result)"));
  assert.ok(serviceActions.includes("revalidateBlogCategoryLinksAfterMutation(updatedCategory, updatedCategory?.id)"));
  assert.ok(serviceActions.includes("revalidateBlogCategoryLinksAfterMutation(created, created?.id)"));
  assert.ok(translationActions.includes("revalidateBlogCategoryLinksAfterMutation(translation, category.id)"));
  assert.ok(translationActions.includes("revalidateBlogCategoryLinksAfterMutation(deleted, existing.categoryId)"));
  assert.ok(categoryDeleteRoute.includes("revalidateBlogCategoryLinksAfterMutation(result, result.id)"));
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

  revalidateBlogCategoryLinksAfterMutation(
    { id: "updated" },
    "9c63ae52-6468-4a21-b8a3-c08ae78c3d3d",
    revalidate,
  );
  revalidateBlogCategoryLinksAfterMutation(null, "9c63ae52-6468-4a21-b8a3-c08ae78c3d3d", revalidate);
  revalidateBlogCategoryLinksAfterMutation({ id: "updated" }, undefined, revalidate);

  assert.deepEqual(calls, [
    "/en/blog/adivasi-oil-overview",
    "/ar/blog/adivasi-oil-overview",
  ]);
});

test("blog article category links resolve current slugs for both locales without changing article content", () => {
  const article = blogArticles.find((entry) => entry.slug === "adivasi-oil-overview");
  assert.ok(article);
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
  for (const [locale, label] of [["en", "Hair Oils"], ["ar", "زيوت الشعر"]] as const) {
    const body = `<p><a href="category-id:9c63ae52-6468-4a21-b8a3-c08ae78c3d3d">${label}</a></p>`;
    const rendered = renderBlogCategoryLinks(locale, body, new Map());

    assert.equal(rendered, `<p>${label}</p>`);
    assert.ok(!rendered.includes("category-id:"));
    assert.ok(!rendered.includes("/categories/"));
  }
});

test("all localized blog category links use stable IDs and product URLs remain authored", () => {
  const body = blogArticles.flatMap((article) => [...article.body.en, ...article.body.ar]).join("\n");

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
  const referencedIds = [...new Set(blogArticles.flatMap((article) => [
    ...getBlogCategoryIds(article.body.en),
    ...getBlogCategoryIds(article.body.ar),
  ]))].sort();

  assert.deepEqual(referencedIds, [...currentRecords.keys()].sort());
  for (const article of blogArticles) {
    for (const locale of ["en", "ar"] as const) {
      const body = article.body[locale].join("");
      const rendered = renderBlogCategoryLinks(locale, body, currentRecords);
      for (const id of getBlogCategoryIds(article.body[locale])) {
        const slug = currentRecords.get(id);
        assert.ok(slug, `Unknown category ID ${id}`);
        assert.ok(rendered.includes(`href="/${locale}/categories/${slug}"`));
      }
      assert.ok(!rendered.includes("category-id:"));
    }
  }
});

test("all English and Arabic articles render resolved current category URLs without placeholders", () => {
  const currentSlugs = new Map([
    ["9c63ae52-6468-4a21-b8a3-c08ae78c3d3d", "hair-oils"],
    ["3703a065-d590-4335-80d3-fcebdaf5dd61", "fabrics-textiles"],
    ["a8d36d07-3881-410a-a8a5-cb81ba72dc00", "mens-bottom-wear"],
    ["f4b74bfb-a999-416e-8402-f48bea7c3f36", "measuring-tape"],
    ["fe12dc19-cd89-452b-83d0-f6aedd948386", "fancy-suit"],
  ]);

  for (const article of blogArticles) {
    for (const locale of ["en", "ar"] as const) {
      const rendered = article.body[locale]
        .map((html) => renderBlogCategoryLinks(locale, html, currentSlugs))
        .join("");
      assert.ok(!rendered.includes("category-id:"), `${article.slug} (${locale}) leaked a placeholder`);
      assert.ok(
        !/<a href="[^"]*category-id:/.test(rendered),
        `${article.slug} (${locale}) has an unresolved category href`,
      );
    }
  }
});
