import assert from "node:assert/strict";
import { test } from "node:test";

import {
  getBaseUrl,
  createCategoryMetadata,
  createProductMetadata,
  shouldNoindexHost,
} from "@/lib/seo";
import {
  getCategoryLandingContent,
  getHomepageCatalogueLinks,
  getProductLandingContent,
} from "@/lib/catalogue-landing-content";

test("measuring tape landing content is localized, specific, and links its listed models", () => {
  const english = getCategoryLandingContent("en", "measuring-tape");
  const arabic = getCategoryLandingContent("ar", "measuring-tape");

  assert.ok(english);
  assert.ok(arabic);
  assert.equal(english.heading, "Yokohama Measuring Tapes");
  assert.match(english.intro, /Yokohama measuring tapes/u);
  assert.match(english.intro, /5M, 5\.5M and 7\.5M/u);
  assert.match(english.intro, /Sharjah, UAE/u);
  assert.deepEqual(
    english.links.map(({ href }) => href),
    [
      "/products/5m-measuring-tape-green",
      "/products/5-5m-measuring-tape-green",
      "/products/7-5m-measuring-tape-green",
    ],
  );
  assert.equal(arabic.heading, "أشرطة قياس Yokohama");
  assert.match(arabic.intro, /5 و5\.5 و7\.5 أمتار/u);
  assert.match(arabic.intro, /الشارقة، الإمارات العربية المتحدة/u);
  assert.ok(arabic.links.every(({ label }) => /[\u0600-\u06ff]/u.test(label)));

  const metadata = createCategoryMetadata({
    locale: "en",
    path: "/categories/measuring-tape",
    categoryName: english.heading,
    seoDescription: english.seoDescription,
  });
  assert.equal(metadata.title, "Yokohama Measuring Tapes | Qasr Al Mabrook");
  assert.equal(
    metadata.alternates?.canonical,
    `${getBaseUrl()}/en/categories/measuring-tape`,
  );
});

test("gloves landing page introduces DPL industrial gloves and links the product", () => {
  const english = getCategoryLandingContent("en", "gloves");
  const arabic = getCategoryLandingContent("ar", "gloves");

  assert.ok(english);
  assert.ok(arabic);
  assert.equal(english.heading, "DPL Industrial Gloves");
  assert.match(english.intro, /neoprene and natural rubber/u);
  assert.match(english.intro, /28 mil \(0\.70 mm\)/u);
  assert.match(english.intro, /Sharjah, UAE/u);
  assert.deepEqual(english.links, [
    { href: "/products/dpl-gloves", label: "DPL Grandeur 70 Gloves" },
  ]);
  assert.equal(arabic.heading, "قفازات DPL الصناعية");
  assert.doesNotMatch(arabic.seoDescription, /industrial gloves|Sharjah|UAE/i);
  assert.deepEqual(arabic.links, [
    { href: "/products/dpl-gloves", label: "قفازات DPL Grandeur 70" },
  ]);

  const englishMetadata = createCategoryMetadata({
    locale: "en",
    path: "/categories/gloves",
    categoryName: english.heading,
    seoDescription: english.seoDescription,
  });
  const arabicMetadata = createCategoryMetadata({
    locale: "ar",
    path: "/categories/gloves",
    categoryName: arabic.heading,
    seoDescription: arabic.seoDescription,
  });
  assert.equal(englishMetadata.title, "DPL Industrial Gloves | Qasr Al Mabrook");
  assert.equal(englishMetadata.description, english.seoDescription);
  assert.equal(arabicMetadata.title, "قفازات DPL الصناعية | قصر المبارك");
  assert.equal(arabicMetadata.description, arabic.seoDescription);
  assert.equal(
    englishMetadata.alternates?.canonical,
    `${getBaseUrl()}/en/categories/gloves`,
  );
  assert.equal(
    arabicMetadata.alternates?.canonical,
    `${getBaseUrl()}/ar/categories/gloves`,
  );
});

test("DPL product metadata and body copy are localized and use recorded specifications", () => {
  const english = getProductLandingContent("en", "dpl-gloves");
  const arabic = getProductLandingContent("ar", "dpl-gloves");

  assert.ok(english);
  assert.ok(arabic);
  assert.equal(english.heading, "DPL Industrial Gloves");
  assert.match(english.seoTitle, /DPL Grandeur 70 Industrial Gloves/u);
  assert.match(english.seoDescription, /DPL Grandeur 70 industrial gloves/u);
  assert.match(english.seoDescription, /Sharjah, UAE/u);
  assert.match(english.description, /Type A: AKLMNPT/u);
  assert.match(english.description, /EN 388:2016 – 3110X/u);
  assert.match(english.description, /EN ISO 374/u);
  assert.match(english.description, /28 mil \(0\.70 mm\)/u);

  const englishMetadata = createProductMetadata({
    locale: "en",
    path: "/products/dpl-gloves",
    productName: "DPL Gloves",
    seoTitle: english.seoTitle,
    seoDescription: english.seoDescription,
  });
  const arabicMetadata = createProductMetadata({
    locale: "ar",
    path: "/products/dpl-gloves",
    productName: "قفازات DPL",
    seoTitle: arabic.seoTitle,
    seoDescription: arabic.seoDescription,
  });

  assert.equal(
    englishMetadata.title,
    "DPL Grandeur 70 Industrial Gloves | Qasr Al Mabrook",
  );
  assert.equal(englishMetadata.description, english.seoDescription);
  assert.equal(arabicMetadata.title, "قفازات DPL Grandeur 70 | قصر المبارك");
  assert.equal(arabicMetadata.description, arabic.seoDescription);
  assert.doesNotMatch(
    arabicMetadata.description ?? "",
    /industrial gloves|Sharjah|UAE/i,
  );
  assert.equal(
    englishMetadata.alternates?.canonical,
    `${getBaseUrl()}/en/products/dpl-gloves`,
  );
  assert.equal(
    arabicMetadata.alternates?.canonical,
    `${getBaseUrl()}/ar/products/dpl-gloves`,
  );
});

test("homepage landing links target both category groups and the DPL product in each locale", () => {
  for (const locale of ["en", "ar"] as const) {
    const links = getHomepageCatalogueLinks(locale);
    assert.deepEqual(
      links.map(({ href }) => href),
      ["/categories/measuring-tape", "/categories/gloves", "/products/dpl-gloves"],
    );
  }
  assert.match(getHomepageCatalogueLinks("en")[0].label, /Yokohama/u);
  assert.match(getHomepageCatalogueLinks("en")[1].label, /DPL Industrial Gloves/u);
  assert.match(getHomepageCatalogueLinks("ar")[0].label, /Yokohama/u);
  assert.match(getHomepageCatalogueLinks("ar")[1].label, /قفازات DPL/u);
});

test("public production pages stay indexable while the Vercel host remains noindexed", () => {
  assert.equal(shouldNoindexHost("www.qasralmabrook.com"), false);
  assert.equal(shouldNoindexHost("qasr-al-mabrook.vercel.app"), true);
});
