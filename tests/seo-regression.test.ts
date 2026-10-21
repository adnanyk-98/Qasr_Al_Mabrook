import assert from "node:assert/strict";
import { test } from "node:test";

import { PRODUCTION_SITE_URL, resolveSiteUrl } from "@/config/site";
import {
  getBaseUrl,
  buildCanonical,
  buildAlternates,
  buildCategorySeoDescription,
  buildProductSeoTitle,
  createFaqStructuredData,
  createOrganizationStructuredData,
  createPublicPageMetadata,
  createProductMetadata,
  createProductStructuredData,
  createBreadcrumbStructuredData,
  shouldNoindexFilteredView,
  shouldNoindexStateQuery,
} from "@/lib/seo";
import { getAlternateLocale, localePath } from "@/lib/locales";
import { mapPublishedCategories } from "@/lib/public-catalog-mapping";
import arMessages from "@/i18n/messages/ar.json";
import enMessages from "@/i18n/messages/en.json";
import robots from "@/app/robots";
import { buildSitemapEntries } from "@/app/sitemap";

const baseUrl = getBaseUrl();

test("production SEO origin stays canonical if the build-time URL is misconfigured", () => {
  assert.equal(
    resolveSiteUrl("production", "http://localhost:3000"),
    PRODUCTION_SITE_URL,
  );
  assert.equal(
    resolveSiteUrl("production", "https://preview.example.com"),
    PRODUCTION_SITE_URL,
  );
  assert.equal(
    resolveSiteUrl("development", "http://localhost:3000"),
    "http://localhost:3000",
  );
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
  const ogImageUrl =
    typeof firstOgImage === "object" && firstOgImage !== null && "url" in firstOgImage
      ? firstOgImage.url
      : undefined;

  assert.equal(metadata.title, "Sample Product | Qasr Al Mabrook");
  assert.equal(metadata.description, "A premium product description.");
  assert.equal(ogImageUrl, "https://cdn.example.com/product.jpg");
  assert.equal(metadata.alternates?.canonical, `${baseUrl}/en/products/sample-product`);
  assert.equal(
    metadata.alternates?.languages?.en,
    `${baseUrl}/en/products/sample-product`,
  );
  assert.equal(
    metadata.alternates?.languages?.ar,
    `${baseUrl}/ar/products/sample-product`,
  );

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

test("Open Graph image dimensions are emitted only when the source dimensions are known", () => {
  const withDimensions = createPublicPageMetadata({
    locale: "en",
    path: "/products/sample-product",
    title: "Sample Product",
    ogImage: "https://cdn.example.com/product.jpg",
    ogImageWidth: 2500,
    ogImageHeight: 2500,
  });
  const withoutDimensions = createPublicPageMetadata({
    locale: "en",
    path: "/categories/sample-category",
    title: "Sample Category",
    ogImage: "https://cdn.example.com/category.jpg",
  });
  const withImage = Array.isArray(withDimensions.openGraph?.images)
    ? withDimensions.openGraph.images[0]
    : withDimensions.openGraph?.images;
  const withoutImage = Array.isArray(withoutDimensions.openGraph?.images)
    ? withoutDimensions.openGraph.images[0]
    : withoutDimensions.openGraph?.images;
  const getDimensions = (image: typeof withImage) => {
    if (
      typeof image !== "object" ||
      image === null ||
      !("width" in image) ||
      !("height" in image)
    )
      return undefined;
    return { width: image.width, height: image.height };
  };

  assert.deepEqual(getDimensions(withImage), { width: 2500, height: 2500 });
  assert.equal(getDimensions(withoutImage), undefined);
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

test("sitemap contains public canonical URLs and excludes admin, API, and query variants", () => {
  const updatedAt = new Date("2026-10-20T12:00:00.000Z");
  const categories = [{ id: "gloves", slug: "gloves", updatedAt }];
  const categoryTranslations = [
    { categoryId: "gloves", locale: "en" as const },
    { categoryId: "gloves", locale: "ar" as const },
  ];
  const products = [{ id: "dpl-gloves", slug: "dpl-gloves", updatedAt }];
  const productTranslations = [
    { productId: "dpl-gloves", locale: "en" as const },
    { productId: "dpl-gloves", locale: "ar" as const },
  ];
  const entries = buildSitemapEntries({
    categories,
    categoryTranslations,
    products,
    productTranslations,
    contactUpdatedAt: updatedAt,
  });
  const urls = entries.map((entry) => entry.url);

  assert.ok(urls.every((url) => url.startsWith(baseUrl)));
  assert.equal(new Set(urls).size, urls.length);
  assert.ok(urls.every((url) => new URL(url).origin === new URL(baseUrl).origin));
  assert.ok(urls.some((url) => url === `${baseUrl}/en`));
  assert.ok(urls.some((url) => url === `${baseUrl}/ar`));
  assert.ok(urls.some((url) => url === `${baseUrl}/en/store-locator`));
  assert.ok(urls.some((url) => url === `${baseUrl}/ar/store-locator`));
  assert.ok(urls.some((url) => url === `${baseUrl}/en/blog`));
  assert.ok(urls.some((url) => url === `${baseUrl}/ar/blog`));
  assert.ok(!urls.some((url) => url.endsWith("/sitemap")));
  assert.ok(!urls.some((url) => url.endsWith("/contact-us")));
  assert.ok(
    urls.some((url) => url.includes("/en/products/")) ||
      urls.some((url) => url.includes("/ar/products/")),
  );
  assert.ok(
    urls.some((url) => url.includes("/en/categories/")) ||
      urls.some((url) => url.includes("/ar/categories/")),
  );
  assert.ok(!urls.some((url) => url.includes("/admin")));
  assert.ok(!urls.some((url) => url.includes("/api")));
  assert.ok(!urls.some((url) => url.includes("/search")));
  assert.ok(!urls.some((url) => url.includes("/request-quote")));
  assert.ok(!urls.some((url) => url.includes("?")));

  const actualCategoryPaths = urls
    .filter((url) => /\/categories\/[^/]+$/.test(new URL(url).pathname))
    .sort();
  const expectedCategoryPaths = categories
    .flatMap((category) =>
      categoryTranslations
        .filter((translation) => translation.categoryId === category.id)
        .map(({ locale }) => `${baseUrl}/${locale}/categories/${category.slug}`),
    )
    .sort();
  const actualProductPaths = urls
    .filter((url) => /\/products\/[^/]+$/.test(new URL(url).pathname))
    .sort();
  const expectedProductPaths = products
    .flatMap((product) =>
      productTranslations
        .filter((translation) => translation.productId === product.id)
        .map(({ locale }) => `${baseUrl}/${locale}/products/${product.slug}`),
    )
    .sort();

  assert.deepEqual(actualCategoryPaths, expectedCategoryPaths);
  assert.deepEqual(actualProductPaths, expectedProductPaths);
  const homepageEn = entries.find((entry) => entry.url === `${baseUrl}/en`);
  assert.equal(homepageEn?.alternates?.languages?.en, `${baseUrl}/en`);
  assert.equal(homepageEn?.alternates?.languages?.ar, `${baseUrl}/ar`);
  assert.equal(homepageEn?.alternates?.languages?.["x-default"], `${baseUrl}/en`);
  assert.ok(
    entries
      .filter((entry) =>
        /\/(products|categories)\/[^/]+$/.test(new URL(entry.url).pathname),
      )
      .every((entry) => entry.lastModified instanceof Date),
  );
  assert.ok(
    entries
      .filter((entry) => /\/blog\/[^/]+$/.test(new URL(entry.url).pathname))
      .every((entry) => entry.lastModified instanceof Date),
  );
});

test("category directory lists published categories only for locales with exact translations", () => {
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

test("localized homepage metadata retains the approved upstream defaults", () => {
  assert.equal(enMessages.metadata.siteTitle, "Qasr Al Mabrook");
  assert.equal(
    enMessages.metadata.siteDescription,
    "Qasr Al Mabrook catalogue and enquiry platform.",
  );
  assert.equal(arMessages.metadata.siteTitle, "قصر المبارك");
  assert.equal(arMessages.metadata.siteDescription, "كتالوج ومنصة تواصل قصر المبارك.");
  assert.equal(enMessages.home.browse, "Browse Catalogue");
  assert.equal(arMessages.home.browse, "تصفح الكتالوج");
  assert.equal(enMessages.common.viewDetails, "View details");
  assert.equal(arMessages.common.viewDetails, "عرض التفاصيل");
});

test("product and category metadata builders use real names and concise descriptions", () => {
  assert.equal(
    buildProductSeoTitle("Sample Product", "Tools"),
    "Sample Product | Tools | Qasr Al Mabrook",
  );
  assert.equal(
    buildProductSeoTitle("DPL Gloves", "Gloves"),
    "DPL Gloves | Qasr Al Mabrook",
  );
  assert.equal(
    buildProductSeoTitle("قفازات DPL", "قفازات"),
    "قفازات DPL | Qasr Al Mabrook",
  );
  assert.match(
    buildCategorySeoDescription("Tools", null, ["Hammer", "Tape"]),
    /Hammer and Tape/,
  );
});

test("product metadata honors a populated SEO title and otherwise adds its localized category", () => {
  const explicitTitle = createProductMetadata({
    locale: "en",
    path: "/products/sample-product",
    productName: "Sample Product",
    categoryName: "Tools",
    seoTitle: "Owner-approved product title",
  });
  const generatedTitle = createProductMetadata({
    locale: "ar",
    path: "/products/sample-product",
    productName: "منتج تجريبي",
    categoryName: "الأدوات والقياس",
  });

  assert.equal(explicitTitle.title, "Owner-approved product title");
  assert.equal(generatedTitle.title, "منتج تجريبي | الأدوات والقياس | Qasr Al Mabrook");
});

test("FAQ and Organization structured data contain only specified actual information", () => {
  const faq = JSON.parse(
    createFaqStructuredData([{ question: "Question?", answer: "Answer." }]),
  );
  assert.equal(faq["@type"], "FAQPage");
  assert.equal(faq.mainEntity[0].acceptedAnswer.text, "Answer.");

  const organization = JSON.parse(createOrganizationStructuredData());
  assert.equal(organization["@type"], "Organization");
  assert.equal(organization.telephone, "+971503093800");
  assert.equal(organization.address.addressLocality, "Sharjah");
  assert.equal(organization.address.addressCountry, "AE");
});

test("filtered product listing views are flagged for noindex while clean listing pages remain indexable", () => {
  assert.equal(shouldNoindexFilteredView({ category: "chairs" }), true);
  assert.equal(shouldNoindexFilteredView({ q: "lamp" }), true);
  assert.equal(shouldNoindexFilteredView({}), false);
});

test("success and error query states are noindexed even when their values are empty", () => {
  assert.equal(shouldNoindexStateQuery({ success: "" }), true);
  assert.equal(shouldNoindexStateQuery({ error: [""] }), true);
  assert.equal(shouldNoindexStateQuery({ source: "CONTACT" }), false);
});

test("JSON-LD escapes script-closing characters while preserving parseable data", () => {
  const name = "</script><script>alert(1)</script>";
  const json = createProductStructuredData({
    id: "product-456",
    name,
    url: `${baseUrl}/en/products/sample-product`,
  });

  assert.ok(!json.includes("</script>"));
  assert.equal(JSON.parse(json).name, name);
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
