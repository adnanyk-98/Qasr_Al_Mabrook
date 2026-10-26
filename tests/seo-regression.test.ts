import assert from "node:assert/strict";
import { test } from "node:test";

import { PRODUCTION_SITE_URL, resolveSiteUrl } from "@/config/site";
import {
  getBaseUrl,
  buildCanonical,
  buildAlternates,
  buildCategorySeoTitle,
  buildCategorySeoDescription,
  createCategoryMetadata,
  buildProductSeoTitle,
  createFaqStructuredData,
  createOrganizationStructuredData,
  createPublicPageMetadata,
  createProductMetadata,
  createProductStructuredData,
  createBreadcrumbStructuredData,
  hasLocaleScript,
  shouldNoindexHost,
  shouldNoindexFilteredView,
  shouldNoindexStateQuery,
} from "@/lib/seo";
import { getAlternateLocale, localePath, localizedHref } from "@/lib/locales";
import { getBlogArticleBySlug } from "@/lib/blog";
import { renderBlogCategoryLinks } from "@/lib/blog-category-links";
import nextConfig from "../next.config";
import {
  mapPublishedCategories,
  sanitizeCatalogueDescription,
} from "@/lib/public-catalog-mapping";
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
  assert.equal(baseUrl, PRODUCTION_SITE_URL);
});

test("staging and noncanonical hosts are noindexed while the production host remains indexable", () => {
  assert.equal(shouldNoindexHost("preview-qam.vercel.app"), true);
  assert.equal(shouldNoindexHost("localhost:3000"), true);
  assert.equal(shouldNoindexHost("www.qasralmabrook.com"), false);
  assert.equal(shouldNoindexHost("www.qasralmabrook.com:443"), false);
});

test("crawler metadata is blocking while regular user agents keep normal streaming behavior", () => {
  assert.ok(nextConfig.htmlLimitedBots instanceof RegExp);
  assert.ok(nextConfig.htmlLimitedBots.test("Googlebot"));
  assert.ok(nextConfig.htmlLimitedBots.test("Screaming Frog SEO Spider"));
  assert.equal(nextConfig.htmlLimitedBots.test("Mozilla/5.0"), false);
});

test("About metadata can distinguish English and Arabic descriptions", () => {
  assert.equal(hasLocaleScript("Learn about Qasr Al Mabrook.", "ar"), false);
  assert.equal(hasLocaleScript("تعرّف على قصر المبارك.", "ar"), true);
  assert.equal(hasLocaleScript("Learn about Qasr Al Mabrook.", "en"), true);
});

test("internal database caveats are removed from public English and Arabic descriptions", () => {
  assert.equal(
    sanitizeCatalogueDescription(
      "Adivasi Oil is listed in the catalogue. The database does not record ingredients or applications.",
    ),
    "Adivasi Oil is listed in the catalogue.",
  );
  assert.equal(
    sanitizeCatalogueDescription(
      "زيت أديفاسي مدرج في الكتالوج. لا تسجل قاعدة البيانات مكونات أو استخدامات إضافية.",
    ),
    "زيت أديفاسي مدرج في الكتالوج.",
  );
  const [category] = mapPublishedCategories(
    [{ id: "hair-oils", slug: "hair-oils", status: "PUBLISHED" }],
    [
      {
        categoryId: "hair-oils",
        locale: "en" as const,
        name: "Hair Oils",
        description:
          "This category includes Adivasi Oil. The database does not record further ingredients or applications.",
      },
    ],
    "en",
  );
  assert.equal(category.description, "This category includes Adivasi Oil.");
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
    title: "قصر المبارك",
    description: "منصة الكتالوج والاستفسار.",
  });

  assert.equal(metadata.title, "قصر المبارك");
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
  assert.equal(
    localizedHref("en", "/en/categories/cloth-piece"),
    "/en/categories/fabrics-textiles",
  );
  assert.equal(
    localizedHref("ar", "/ar/categories/cloth-piece?source=hero"),
    "/ar/categories/fabrics-textiles?source=hero",
  );
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

test("sitemap adds only existing localized category and product URLs with reciprocal alternates", () => {
  const updatedAt = new Date("2026-10-20T12:00:00.000Z");
  const entries = buildSitemapEntries({
    categories: [{ id: "gloves", slug: "gloves", updatedAt }],
    categoryTranslations: [{ categoryId: "gloves", locale: "en" }],
    products: [{ id: "dpl-gloves", slug: "dpl-gloves", updatedAt }],
    productTranslations: [{ productId: "dpl-gloves", locale: "ar" }],
  });
  const englishCategory = entries.find(
    (entry) => entry.url === `${baseUrl}/en/categories/gloves`,
  );
  const arabicProduct = entries.find(
    (entry) => entry.url === `${baseUrl}/ar/products/dpl-gloves`,
  );

  assert.ok(englishCategory);
  assert.ok(arabicProduct);
  assert.equal(
    englishCategory.alternates?.languages?.en,
    `${baseUrl}/en/categories/gloves`,
  );
  assert.equal(englishCategory.alternates?.languages?.ar, undefined);
  assert.equal(
    arabicProduct.alternates?.languages?.ar,
    `${baseUrl}/ar/products/dpl-gloves`,
  );
  assert.equal(arabicProduct.alternates?.languages?.en, undefined);
  assert.ok(
    entries.every((entry) => new URL(entry.url).origin === PRODUCTION_SITE_URL),
  );
});

test("sitemap uses the current category URL rather than the legacy cloth-piece path", () => {
  const entries = buildSitemapEntries({
    categories: [{ id: "fabrics", slug: "cloth-piece", updatedAt: null }],
    categoryTranslations: [
      { categoryId: "fabrics", locale: "en" },
      { categoryId: "fabrics", locale: "ar" },
    ],
    products: [],
    productTranslations: [],
  });

  assert.ok(
    entries.some((entry) => entry.url === `${baseUrl}/en/categories/fabrics-textiles`),
  );
  assert.ok(
    entries.some((entry) => entry.url === `${baseUrl}/ar/categories/fabrics-textiles`),
  );
  assert.ok(entries.every((entry) => !entry.url.includes("/categories/cloth-piece")));
});

test("category directory lists published categories only for locales with exact translations", () => {
  const categories = [
    { id: "gloves", slug: "gloves", status: "PUBLISHED" },
    { id: "fabrics", slug: "cloth-piece", status: "PUBLISHED" },
    { id: "shoes", slug: "shoes", status: "PUBLISHED" },
    { id: "draft", slug: "draft", status: "DRAFT" },
  ];
  const translations = [
    { categoryId: "gloves", locale: "en" as const, name: "Gloves", description: null },
    { categoryId: "gloves", locale: "ar" as const, name: "قفازات", description: null },
    {
      categoryId: "fabrics",
      locale: "en" as const,
      name: "Fabrics & Textiles",
      description: null,
    },
    {
      categoryId: "fabrics",
      locale: "ar" as const,
      name: "الأقمشة والمنسوجات",
      description: null,
    },
    { categoryId: "shoes", locale: "en" as const, name: "Shoes", description: null },
    { categoryId: "draft", locale: "en" as const, name: "Draft", description: null },
  ];

  assert.deepEqual(
    mapPublishedCategories(categories, translations, "en").map(({ slug }) => slug),
    ["gloves", "fabrics-textiles", "shoes"],
  );
  assert.deepEqual(
    mapPublishedCategories(categories, translations, "ar").map(({ slug }) => slug),
    ["gloves", "fabrics-textiles"],
  );
});

test("blog category links skip the legacy cloth-piece redirect in both locales", () => {
  const categoryId = "3703a065-d590-4335-80d3-fcebdaf5dd61";
  const html = `<a href="category-id:${categoryId}">Fabrics &amp; Textiles</a>`;
  const slugs = new Map([[categoryId, "cloth-piece"]]);

  assert.equal(
    renderBlogCategoryLinks("en", html, slugs),
    '<a href="/en/categories/fabrics-textiles">Fabrics &amp; Textiles</a>',
  );
  assert.equal(
    renderBlogCategoryLinks("ar", html, slugs),
    '<a href="/ar/categories/fabrics-textiles">Fabrics &amp; Textiles</a>',
  );
});

test("localized homepage metadata is distinct, useful, and localized", () => {
  assert.equal(enMessages.metadata.siteTitle, "Qasr Al Mabrook Product Catalogue");
  assert.equal(
    enMessages.metadata.siteDescription,
    "Explore the Qasr Al Mabrook product catalogue by category, review product details, and contact the team with an enquiry.",
  );
  assert.equal(arMessages.metadata.siteTitle, "كتالوج منتجات قصر المبارك");
  assert.equal(
    arMessages.metadata.siteDescription,
    "تصفح كتالوج منتجات قصر المبارك حسب الفئة، وراجع تفاصيل المنتجات، وتواصل مع الفريق للاستفسار.",
  );
  assert.equal(enMessages.home.browse, "Browse Catalogue");
  assert.equal(arMessages.home.browse, "تصفح الكتالوج");
  assert.equal(enMessages.common.viewDetails, "View details");
  assert.equal(arMessages.common.viewDetails, "عرض التفاصيل");
});

test("homepage, category, product, and blog titles contain the brand at most once", () => {
  const titles = [
    createPublicPageMetadata({
      locale: "en",
      path: "/",
      title: enMessages.metadata.siteTitle,
    }).title,
    createPublicPageMetadata({
      locale: "ar",
      path: "/",
      title: arMessages.metadata.siteTitle,
    }).title,
    createCategoryMetadata({
      locale: "en",
      path: "/categories/hair-oils",
      categoryName: "Hair Oils",
    }).title,
    createCategoryMetadata({
      locale: "ar",
      path: "/categories/hair-oils",
      categoryName: "زيوت الشعر",
    }).title,
    createProductMetadata({
      locale: "en",
      path: "/products/dpl-gloves",
      productName: "DPL Gloves",
      categoryName: "Gloves",
    }).title,
    createProductMetadata({
      locale: "ar",
      path: "/products/dpl-gloves",
      productName: "قفازات DPL",
      categoryName: "قفازات",
    }).title,
    createPublicPageMetadata({
      locale: "en",
      path: "/blog/product-discovery-for-smarter-shopping",
      title: getBlogArticleBySlug("en", "product-discovery-for-smarter-shopping")
        ?.seoTitle,
    }).title,
    createPublicPageMetadata({
      locale: "ar",
      path: "/blog/product-discovery-for-smarter-shopping",
      title: getBlogArticleBySlug("ar", "product-discovery-for-smarter-shopping")
        ?.seoTitle,
    }).title,
    createPublicPageMetadata({
      locale: "en",
      path: "/blog/fancy-suit-guide",
      title: getBlogArticleBySlug("en", "fancy-suit-guide")?.seoTitle,
    }).title,
    createPublicPageMetadata({
      locale: "en",
      path: "/blog/cloth-piece-guide",
      title: getBlogArticleBySlug("en", "cloth-piece-guide")?.seoTitle,
    }).title,
    createPublicPageMetadata({
      locale: "ar",
      path: "/blog/adivasi-oil-overview",
      title: getBlogArticleBySlug("ar", "adivasi-oil-overview")?.seoTitle,
    }).title,
  ];

  assert.deepEqual(titles, [
    "Qasr Al Mabrook Product Catalogue",
    "كتالوج منتجات قصر المبارك",
    "Hair Oils | Qasr Al Mabrook",
    "زيوت الشعر | قصر المبارك",
    "DPL Gloves | Qasr Al Mabrook",
    "قفازات DPL | قصر المبارك",
    "Product Discovery: Measuring Tapes | Qasr Al Mabrook",
    "مقارنة خيارات أشرطة القياس: 5 و5.5 و7.5 أمتار | قصر المبارك",
    "Fancy Suit Options in the Catalogue | Qasr Al Mabrook",
    "Cloth Pieces: Catalogue Guide | Qasr Al Mabrook",
    "زيت أديفاسي: نظرة عامة | قصر المبارك",
  ]);
  assert.ok(titles.every((title) => typeof title === "string"));
  assert.equal(buildCategorySeoTitle("Hair Oils"), "Hair Oils | Qasr Al Mabrook");
  assert.equal(
    createPublicPageMetadata({
      locale: "en",
      path: "/categories/hair-oils",
      title: "Hair Oils | Qasr Al Mabrook | Qasr Al Mabrook Product Catalogue",
    }).title,
    "Hair Oils | Qasr Al Mabrook",
  );
});

test("the three long English blog titles are shortened while preserving their topics", () => {
  const choosing = getBlogArticleBySlug("en", "choosing-everyday-essentials");
  const discovery = getBlogArticleBySlug(
    "en",
    "product-discovery-for-smarter-shopping",
  );
  const oil = getBlogArticleBySlug("en", "adivasi-oil-overview");
  assert.ok(choosing);
  assert.ok(discovery);
  assert.ok(oil);

  assert.equal(choosing.title, "Everyday Essentials by Category");
  assert.equal(choosing.seoTitle, "Everyday Essentials by Category");
  assert.equal(discovery.title, "Product Discovery: Measuring Tapes");
  assert.equal(discovery.seoTitle, "Product Discovery: Measuring Tapes");
  assert.match(discovery.excerpt, /measuring-tape family/i);
  assert.match(discovery.body.join(" "), /Measuring Tapes category/);
  assert.equal(oil.title, "Adivasi Oil Overview");
  assert.equal(oil.seoTitle, "Adivasi Oil Overview");
  assert.doesNotMatch(choosing.title, /measuring tape/i);
  assert.doesNotMatch(oil.title, /measuring tape/i);
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
    buildProductSeoTitle("قفازات DPL", "قفازات", "ar"),
    "قفازات DPL | قصر المبارك",
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

  assert.equal(explicitTitle.title, "Owner-approved product title | Qasr Al Mabrook");
  assert.equal(generatedTitle.title, "منتج تجريبي | الأدوات والقياس | قصر المبارك");
});

test("Arabic product metadata rejects English SEO overrides in favor of Arabic catalogue content", () => {
  const metadata = createProductMetadata({
    locale: "ar",
    path: "/products/dpl-gloves",
    productName: "قفازات DPL",
    categoryName: "قفازات",
    seoTitle: "DPL Gloves | Occupational gloves",
    seoDescription: "DPL Grandeur 70 occupational gloves.",
    shortDescription: "قفازات DPL Grandeur 70 ببطانة داخلية من الفلوك.",
  });

  assert.equal(metadata.title, "قفازات DPL | قصر المبارك");
  assert.equal(metadata.description, "قفازات DPL Grandeur 70 ببطانة داخلية من الفلوك.");
});

test("about and category titles use descriptive localized page names", () => {
  const aboutEn = createPublicPageMetadata({
    locale: "en",
    path: "/about-us",
    title: "About Us",
  });
  const aboutAr = createPublicPageMetadata({
    locale: "ar",
    path: "/about-us",
    title: "من نحن",
  });
  const fancySuitCategory = createCategoryMetadata({
    locale: "en",
    path: "/categories/fancy-suit",
    categoryName: "Fancy Suit",
    seoTitle: "Fancy Suit | Qasr Al Mabrook",
  });
  const fancySuitProduct = createProductMetadata({
    locale: "en",
    path: "/products/fancy-suit",
    productName: "Fancy Suit",
  });
  const mensBottomWearCategory = createCategoryMetadata({
    locale: "ar",
    path: "/categories/mens-bottom-wear",
    categoryName: "بيجاما",
    seoTitle: "عنوان منتج البيجاما | قصر المبارك",
  });

  assert.equal(aboutEn.title, "About Us | Qasr Al Mabrook");
  assert.equal(aboutAr.title, "من نحن | قصر المبارك");
  assert.equal(fancySuitCategory.title, "Fancy Suit Collection | Qasr Al Mabrook");
  assert.notEqual(fancySuitCategory.title, fancySuitProduct.title);
  assert.equal(mensBottomWearCategory.title, "بيجاما | قصر المبارك");
  assert.doesNotMatch(String(mensBottomWearCategory.title), /عنوان منتج/u);
});

test("the four flagged English metadata descriptions are shortened to 140 characters", () => {
  const longDescription =
    "This category includes occupational products made from neoprene and natural rubber with flock lining and textured grip surfaces for work environments where durable hand coverage and grip are important.";
  const categoryGloves = createCategoryMetadata({
    locale: "en",
    path: "/categories/gloves",
    categoryName: "Gloves",
    description: longDescription,
  });
  const categoryMensBottomWear = createCategoryMetadata({
    locale: "en",
    path: "/categories/mens-bottom-wear",
    categoryName: "Men's Bottom Wear",
    description:
      "This category groups pajama sleepwear products for personal use. Products currently listed include the Pajama product in the catalogue.",
  });
  const product5m = createProductMetadata({
    locale: "en",
    path: "/products/5m-measuring-tape-green",
    productName: "5M Measuring Tape Green",
    shortDescription:
      "The Yokohama 5M/18FT measuring tape keeps the focus on the range most often needed for everyday measurement jobs. Its compact format is identified on the product packaging.",
  });
  const product75m = createProductMetadata({
    locale: "en",
    path: "/products/7-5m-measuring-tape-green",
    productName: "7.5M Measuring Tape Green",
    shortDescription:
      "The Yokohama 7.5M/25FT measuring tape is the longest-range option in this collection, built around a 25-foot reach for measurements that move beyond the shorter tape.",
  });

  for (const metadata of [
    categoryGloves,
    categoryMensBottomWear,
    product5m,
    product75m,
  ]) {
    assert.ok((metadata.description?.length ?? 0) <= 140);
    assert.ok(metadata.description?.endsWith("…"));
  }
});

test("representative English and Arabic catalogue and blog metadata uses locale canonicals", () => {
  const hairOilsEn = createCategoryMetadata({
    locale: "en",
    path: "/categories/hair-oils",
    categoryName: "Hair Oils",
    description:
      "This category includes Adivasi Oil, listed in the catalogue. The database does not record ingredients or applications.",
    hasAlternate: true,
  });
  const hairOilsAr = createCategoryMetadata({
    locale: "ar",
    path: "/categories/hair-oils",
    categoryName: "زيوت الشعر",
    description: "تضم هذه الفئة زيت أديفاسي المدرج في الكتالوج.",
    hasAlternate: true,
  });
  const mensWearEn = createCategoryMetadata({
    locale: "en",
    path: "/categories/mens-bottom-wear",
    categoryName: "Men's Bottom Wear",
    description: "Browse the Men's Bottom Wear category.",
    hasAlternate: true,
  });
  const mensWearAr = createCategoryMetadata({
    locale: "ar",
    path: "/categories/mens-bottom-wear",
    categoryName: "بيجاما",
    description: "تصفح فئة البيجاما في كتالوج قصر المبارك.",
    hasAlternate: true,
  });
  const glovesEn = createCategoryMetadata({
    locale: "en",
    path: "/categories/gloves",
    categoryName: "Gloves",
    description:
      "Occupational gloves designed with a neoprene and natural rubber construction, flock lining and textured grip surfaces.",
    hasAlternate: true,
  });
  const glovesAr = createCategoryMetadata({
    locale: "ar",
    path: "/categories/gloves",
    categoryName: "قفازات",
    description:
      "قفازات مهنية مصممة من النيوبرين والمطاط الطبيعي، مع بطانة داخلية من الفلوك وأسطح مزودة بنقشة لتحسين التماسك.",
    hasAlternate: true,
  });
  const productEn = createProductMetadata({
    locale: "en",
    path: "/products/dpl-gloves",
    productName: "DPL Gloves",
    categoryName: "Gloves",
    shortDescription:
      "DPL Grandeur 70 occupational gloves made from chlorine-washed neoprene/natural rubber with a flock-lined interior and textured grip surface.",
    hasAlternate: true,
  });
  const productAr = createProductMetadata({
    locale: "ar",
    path: "/products/dpl-gloves",
    productName: "قفازات DPL",
    categoryName: "قفازات",
    shortDescription:
      "قفازات DPL Grandeur 70 مهنية مصنوعة من النيوبرين والمطاط الطبيعي المغسول بالكلور، مع بطانة داخلية من الفلوك وسطح مزود بنقشة لتحسين التماسك.",
    hasAlternate: true,
  });
  const articleEn = getBlogArticleBySlug("en", "adivasi-oil-overview");
  const articleAr = getBlogArticleBySlug("ar", "adivasi-oil-overview");
  assert.ok(articleEn);
  assert.ok(articleAr);
  const blogEn = createPublicPageMetadata({
    locale: "en",
    path: "/blog/adivasi-oil-overview",
    title: articleEn.seoTitle,
    description: articleEn.seoDescription,
    hasAlternate: true,
  });
  const blogAr = createPublicPageMetadata({
    locale: "ar",
    path: "/blog/adivasi-oil-overview",
    title: articleAr.seoTitle,
    description: articleAr.seoDescription,
    hasAlternate: true,
  });

  for (const [locale, metadata, path] of [
    ["en", hairOilsEn, "/categories/hair-oils"],
    ["ar", hairOilsAr, "/categories/hair-oils"],
    ["en", mensWearEn, "/categories/mens-bottom-wear"],
    ["ar", mensWearAr, "/categories/mens-bottom-wear"],
    ["en", glovesEn, "/categories/gloves"],
    ["ar", glovesAr, "/categories/gloves"],
    ["en", productEn, "/products/dpl-gloves"],
    ["ar", productAr, "/products/dpl-gloves"],
    ["en", blogEn, "/blog/adivasi-oil-overview"],
    ["ar", blogAr, "/blog/adivasi-oil-overview"],
  ] as const) {
    assert.equal(metadata.alternates?.canonical, `${baseUrl}/${locale}${path}`);
    assert.equal(
      metadata.alternates?.languages?.[locale],
      `${baseUrl}/${locale}${path}`,
    );
    assert.equal(
      metadata.alternates?.languages?.[locale === "en" ? "ar" : "en"],
      `${baseUrl}/${locale === "en" ? "ar" : "en"}${path}`,
    );
    assert.doesNotMatch(metadata.description ?? "", /database|قاعدة البيانات/i);
  }
  assert.match(String(hairOilsAr.title), /زيوت الشعر/);
  assert.match(String(mensWearAr.title), /بيجاما/);
  assert.match(String(glovesAr.title), /قفازات/);
  assert.match(String(productAr.title), /قفازات DPL/);
  assert.match(String(blogAr.title), /زيت أديفاسي/);
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
