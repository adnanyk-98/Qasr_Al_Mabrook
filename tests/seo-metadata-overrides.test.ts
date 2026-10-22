import assert from "node:assert/strict";
import test from "node:test";

import { createCategoryMetadata, createProductMetadata, getBaseUrl } from "@/lib/seo";

const baseUrl = getBaseUrl();

test("product SEO description overrides long and short descriptions", () => {
  const metadata = createProductMetadata({
    locale: "ar",
    path: "/products/dpl-gloves",
    productName: "قفازات DPL",
    seoTitle: "قفازات مهنية",
    seoDescription: "قفازات مهنية ببطانة داخلية.",
    fullDescription: "وصف المنتج الكامل.",
    shortDescription: "وصف مختصر.",
    hasAlternate: true,
  });

  assert.equal(metadata.title, "قفازات مهنية | قصر المبارك");
  assert.equal(metadata.description, "قفازات مهنية ببطانة داخلية.");
  assert.equal(metadata.alternates?.canonical, `${baseUrl}/ar/products/dpl-gloves`);
  assert.equal(metadata.alternates?.languages?.ar, `${baseUrl}/ar/products/dpl-gloves`);
  assert.equal(metadata.alternates?.languages?.en, `${baseUrl}/en/products/dpl-gloves`);
});

test("blank product SEO overrides fall back to existing content and title defaults", () => {
  const metadata = createProductMetadata({
    locale: "en",
    path: "/products/sample-product",
    productName: "Sample Product",
    categoryName: "Tools",
    seoTitle: " ",
    seoDescription: "<p> </p>",
    fullDescription: "Long description.",
    shortDescription: "Short description.",
  });

  assert.equal(metadata.title, "Sample Product | Tools | Qasr Al Mabrook");
  assert.equal(metadata.description, "Long description.");
});

test("category SEO overrides are honored without changing canonical or locale alternates", () => {
  const metadata = createCategoryMetadata({
    locale: "ar",
    path: "/categories/gloves",
    categoryName: "قفازات",
    seoTitle: "قفازات العمل | قصر المبارك",
    seoDescription: "قفازات مهنية مع بطانة داخلية.",
    description: "وصف الفئة العام.",
    productNames: ["قفازات DPL"],
    hasAlternate: true,
  });

  assert.equal(metadata.title, "قفازات العمل | قصر المبارك");
  assert.equal(metadata.description, "قفازات مهنية مع بطانة داخلية.");
  assert.equal(metadata.alternates?.canonical, `${baseUrl}/ar/categories/gloves`);
  assert.equal(metadata.alternates?.languages?.ar, `${baseUrl}/ar/categories/gloves`);
  assert.equal(metadata.alternates?.languages?.en, `${baseUrl}/en/categories/gloves`);
});

test("blank category SEO overrides preserve generated title and description defaults", () => {
  const metadata = createCategoryMetadata({
    locale: "en",
    path: "/categories/tools",
    categoryName: "Tools",
    seoTitle: " ",
    seoDescription: "  ",
    description: "Tools category description.",
  });

  assert.equal(metadata.title, "Tools | Qasr Al Mabrook");
  assert.match(metadata.description ?? "", /Tools category description\./);
});
