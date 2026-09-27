import assert from "node:assert/strict";
import { after, test } from "node:test";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, categoryTranslations, productTranslations, products } from "@/db/schema";
import { PRODUCTION_SITE_URL, resolveSiteUrl } from "@/config/site";
import { getBaseUrl, buildCanonical, buildAlternates, createPublicPageMetadata, createProductMetadata, createProductStructuredData, createBreadcrumbStructuredData, shouldNoindexFilteredView } from "@/lib/seo";
import { getAlternateLocale, localePath } from "@/lib/locales";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

const baseUrl = getBaseUrl();

test("production SEO origin stays canonical if the build-time URL is misconfigured", () => {
  assert.equal(resolveSiteUrl("production", "http://localhost:3000"), PRODUCTION_SITE_URL);
  assert.equal(resolveSiteUrl("production", "https://preview.example.com"), PRODUCTION_SITE_URL);
  assert.equal(resolveSiteUrl("development", "http://localhost:3000"), "http://localhost:3000");
});

after(async () => {
  await (db as typeof db & { $client: { end: () => Promise<void> } }).$client.end();
});

test("English homepage metadata uses the configured site origin and locale alternates", () => {
  const metadata = createPublicPageMetadata({
    locale: "en",
    path: "/",
    title: "Qasr Al Mabrook",
    description: "Catalogue and enquiry platform.",
  });

  assert.equal(metadata.title, "Qasr Al Mabrook");
  assert.equal(metadata.description, "Catalogue and enquiry platform.");
  assert.equal(metadata.alternates?.canonical, `${baseUrl}/en`);
  assert.equal(metadata.alternates?.languages?.en, `${baseUrl}/en`);
  assert.equal(metadata.alternates?.languages?.ar, `${baseUrl}/ar`);
  assert.equal(metadata.alternates?.languages?.["x-default"], `${baseUrl}/en`);
  assert.equal(metadata.openGraph?.url, `${baseUrl}/en`);
});

test("Arabic homepage metadata uses the Arabic locale path and reciprocal locale alternates", () => {
  const metadata = createPublicPageMetadata({
    locale: "ar",
    path: "/",
    title: "قصر المبرك",
    description: "منصة الكتالوج والاستفسار.",
  });

  assert.equal(metadata.title, "قصر المبرك");
  assert.equal(metadata.description, "منصة الكتالوج والاستفسار.");
  assert.equal(metadata.alternates?.canonical, `${baseUrl}/ar`);
  assert.equal(metadata.alternates?.languages?.ar, `${baseUrl}/ar`);
  assert.equal(metadata.alternates?.languages?.en, `${baseUrl}/en`);
  assert.equal(metadata.alternates?.languages?.["x-default"], `${baseUrl}/en`);
  assert.equal(metadata.openGraph?.locale, "ar_SA");
});

test("localized URLs preserve the configured locale routing format", () => {
  assert.equal(localePath("en", "/products"), "/en/products");
  assert.equal(localePath("ar", "/products"), "/ar/products");
  assert.equal(localePath("en", "/"), "/en");
  assert.equal(localePath("ar", "/"), "/ar");
  assert.equal(getAlternateLocale("en"), "ar");
  assert.equal(getAlternateLocale("ar"), "en");
});

test("product metadata keeps the product identity and omits fabricated pricing or review fields", () => {
  const metadata = createProductMetadata({
    locale: "en",
    path: "/products/sample-product",
    productName: "Sample Product",
    seoTitle: "Sample Product | Qasr Al Mabrook",
    seoDescription: "A premium product description.",
    shortDescription: "Short description.",
    fullDescription: "Long description.",
    productImage: "https://cdn.example.com/product.jpg",
    productImageAlt: "Sample Product",
    hasAlternate: true,
  });

  const ogImages = metadata.openGraph?.images;
  const firstOgImage = Array.isArray(ogImages) ? ogImages[0] : ogImages;
  const ogImageUrl = typeof firstOgImage === "object" && firstOgImage !== null && "url" in firstOgImage ? firstOgImage.url : undefined;

  assert.equal(metadata.title, "Sample Product | Qasr Al Mabrook");
  assert.equal(metadata.description, "A premium product description.");
  assert.equal(ogImageUrl, "https://cdn.example.com/product.jpg");
  assert.equal(metadata.alternates?.canonical, `${baseUrl}/en/products/sample-product`);
  assert.equal(metadata.alternates?.languages?.en, `${baseUrl}/en/products/sample-product`);
  assert.equal(metadata.alternates?.languages?.ar, `${baseUrl}/ar/products/sample-product`);

  const json = createProductStructuredData({
    id: "product-123",
    name: "Sample Product",
    description: "A premium product description.",
    image: "https://cdn.example.com/product.jpg",
    sku: "SKU-001",
    brand: "Qasr Al Mabrook",
    url: `${baseUrl}/en/products/sample-product`,
  });

  const parsed = JSON.parse(json);
  assert.equal(parsed["@type"], "Product");
  assert.equal(parsed.name, "Sample Product");
  assert.equal(parsed.url, `${baseUrl}/en/products/sample-product`);
  assert.equal(parsed.sku, "SKU-001");
  assert.equal(parsed.identifier.value, "product-123");
  assert.ok(!Object.hasOwn(parsed, "price"));
  assert.ok(!Object.hasOwn(parsed, "availability"));
  assert.ok(!Object.hasOwn(parsed, "aggregateRating"));
});

test("breadcrumb structured data points to the canonical localized paths", () => {
  const json = createBreadcrumbStructuredData("en", [
    { name: "Categories", path: "/categories" },
    { name: "Homeware", path: "/categories/homeware" },
  ]);

  const parsed = JSON.parse(json);
  assert.equal(parsed["@type"], "BreadcrumbList");
  assert.equal(parsed.itemListElement[0].item, `${baseUrl}/en`);
  assert.equal(parsed.itemListElement[1].item, `${baseUrl}/en/categories`);
  assert.equal(parsed.itemListElement[2].item, `${baseUrl}/en/categories/homeware`);
});

test("robots.txt allows public catalogue pages and blocks admin and API paths", () => {
  const rules = robots();

  assert.ok(Array.isArray(rules.rules));
  const rule = rules.rules[0];
  const allow = rule.allow ?? [];
  const disallow = rule.disallow ?? [];

  assert.ok(allow.includes("/"));
  assert.ok(allow.includes("/en/"));
  assert.ok(allow.includes("/ar/"));
  assert.ok(disallow.includes("/admin"));
  assert.ok(disallow.includes("/api"));
  assert.ok(disallow.includes("/search"));
  assert.equal(rules.sitemap, `${baseUrl}/sitemap.xml`);
});

test("sitemap contains public canonical URLs and excludes admin, API, and query variants", async () => {
  const entries = await sitemap();
  const urls = entries.map((entry) => entry.url);

  assert.ok(urls.every((url) => url.startsWith(baseUrl)));
  assert.equal(new Set(urls).size, urls.length);
  assert.ok(urls.every((url) => new URL(url).origin === new URL(baseUrl).origin));
  assert.ok(urls.some((url) => url === `${baseUrl}/en`));
  assert.ok(urls.some((url) => url === `${baseUrl}/ar`));
  assert.ok(urls.some((url) => url.includes("/en/products/")) || urls.some((url) => url.includes("/ar/products/")));
  assert.ok(urls.some((url) => url.includes("/en/categories/")) || urls.some((url) => url.includes("/ar/categories/")));
  assert.ok(!urls.some((url) => url.includes("/admin")));
  assert.ok(!urls.some((url) => url.includes("/api")));
  assert.ok(!urls.some((url) => url.includes("/search")));
  assert.ok(!urls.some((url) => url.includes("?")));

  const translatedCategories = await db
    .select({ slug: categories.slug, locale: categoryTranslations.locale })
    .from(categories)
    .innerJoin(categoryTranslations, eq(categoryTranslations.categoryId, categories.id))
    .where(eq(categories.status, "PUBLISHED"));
  const translatedProducts = await db
    .select({ slug: products.slug, locale: productTranslations.locale })
    .from(products)
    .innerJoin(productTranslations, eq(productTranslations.productId, products.id))
    .where(eq(products.status, "PUBLISHED"));
  const actualCategoryPaths = urls.filter((url) => /\/categories\/[^/]+$/.test(new URL(url).pathname)).sort();
  const expectedCategoryPaths = translatedCategories
    .map(({ slug, locale }) => `${baseUrl}/${locale}/categories/${slug}`)
    .sort();
  const actualProductPaths = urls.filter((url) => /\/products\/[^/]+$/.test(new URL(url).pathname)).sort();
  const expectedProductPaths = translatedProducts
    .map(({ slug, locale }) => `${baseUrl}/${locale}/products/${slug}`)
    .sort();

  assert.deepEqual(actualCategoryPaths, expectedCategoryPaths);
  assert.deepEqual(actualProductPaths, expectedProductPaths);
});

test("filtered product listing views are flagged for noindex while clean listing pages remain indexable", () => {
  assert.equal(shouldNoindexFilteredView({ category: "chairs" }), true);
  assert.equal(shouldNoindexFilteredView({ q: "lamp" }), true);
  assert.equal(shouldNoindexFilteredView({}), false);
});

test("helper builders do not accidentally fabricate invalid locale URLs", () => {
  const canonical = buildCanonical("en", "/products/sample-product");
  const alternates = buildAlternates("en", "/products/sample-product");

  assert.equal(canonical, `${baseUrl}/en/products/sample-product`);
  assert.equal(alternates?.languages?.en, `${baseUrl}/en/products/sample-product`);
  assert.equal(alternates?.languages?.ar, `${baseUrl}/ar/products/sample-product`);
  assert.ok(canonical.startsWith(`${baseUrl}/`));
  assert.ok(!canonical.includes("?"));
  assert.ok(!alternates?.languages?.ar.includes("?"));
  assert.ok(canonical === buildCanonical("en", "/products/sample-product"));
});
