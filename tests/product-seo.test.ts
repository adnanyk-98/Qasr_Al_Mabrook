import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { eq } from "drizzle-orm";
import ts from "typescript";

import {
  createCategoryMetadata,
  createProductMetadata,
  getBaseUrl,
  resolveSeoMetadata,
  resolveProductSeoMetadata,
} from "@/lib/seo";
import {
  categorySeoFieldsSchema,
  productSeoFieldsSchema,
  seoFieldsSchema,
} from "@/lib/product-seo";

const yokohamaProducts = [
  {
    slug: "5m-measuring-tape-green",
    name: "5M Measuring Tape Green",
    englishTitle: "Yokohama 5M Measuring Tape",
    englishDescription:
      "Explore the Yokohama 5M/18FT measuring tape. View product details for this measuring tape.",
    arabicTitle: "شريط قياس Yokohama 5 أمتار",
    arabicDescription:
      "تعرّف على شريط قياس Yokohama بطول 5 أمتار أو 18 قدمًا. اطّلع على تفاصيل المنتج.",
  },
  {
    slug: "5-5m-measuring-tape-green",
    name: "5.5M Measuring Tape Green",
    englishTitle: "Yokohama 5.5M Measuring Tape",
    englishDescription:
      "Explore the Yokohama 5.5M/18FT measuring tape. View product details for this measuring tape.",
    arabicTitle: "شريط قياس Yokohama 5.5 أمتار",
    arabicDescription:
      "تعرّف على شريط قياس Yokohama بطول 5.5 أمتار أو 18 قدمًا. اطّلع على تفاصيل المنتج.",
  },
  {
    slug: "7-5m-measuring-tape-green",
    name: "7.5M Measuring Tape Green",
    englishTitle: "Yokohama 7.5M Measuring Tape",
    englishDescription:
      "Explore the Yokohama 7.5M/25FT measuring tape. View product details for this measuring tape.",
    arabicTitle: "شريط قياس Yokohama 7.5 أمتار",
    arabicDescription:
      "تعرّف على شريط قياس Yokohama بطول 7.5 أمتار أو 25 قدمًا. اطّلع على تفاصيل المنتج.",
  },
] as const;

test("product SEO fields are optional, trimmed, and enforce database and metadata limits", () => {
  assert.deepEqual(productSeoFieldsSchema.parse({}), {
    seoTitle: "",
    seoDescription: "",
  });
  assert.deepEqual(
    productSeoFieldsSchema.parse({
      seoTitle: "  Product SEO title  ",
      seoDescription: "  Product description  ",
    }),
    {
      seoTitle: "Product SEO title",
      seoDescription: "Product description",
    },
  );
  assert.equal(
    productSeoFieldsSchema.safeParse({ seoTitle: "x".repeat(256) }).success,
    false,
  );
  assert.equal(
    productSeoFieldsSchema.safeParse({ seoDescription: "x".repeat(141) }).success,
    false,
  );
  assert.equal(
    productSeoFieldsSchema.safeParse({ seoDescription: "x".repeat(140) }).success,
    true,
  );
});

test("blank product SEO fields fall back to existing curated or generated metadata", () => {
  assert.deepEqual(
    resolveProductSeoMetadata(
      { seoTitle: "  ", seoDescription: null },
      {
        seoTitle: "Existing localized title",
        seoDescription: "Existing localized description",
      },
    ),
    {
      seoTitle: "Existing localized title",
      seoDescription: "Existing localized description",
    },
  );

  const resolved = resolveProductSeoMetadata(
    { seoTitle: null, seoDescription: "" },
    null,
  );
  const generated = createProductMetadata({
    locale: "en",
    path: "/products/sample-measuring-tape",
    productName: "Sample Measuring Tape",
    seoTitle: resolved.seoTitle,
    seoDescription: resolved.seoDescription,
  });
  assert.equal(generated.title, "Sample Measuring Tape | Qasr Al Mabrook");
  assert.match(generated.description ?? "", /Sample Measuring Tape/u);
});

test("category SEO fields accept 155 characters while product fields retain their limit", () => {
  assert.equal(seoFieldsSchema, productSeoFieldsSchema);
  assert.deepEqual(
    seoFieldsSchema.parse({
      seoTitle: "  Category title  ",
      seoDescription: "  Category description  ",
    }),
    {
      seoTitle: "Category title",
      seoDescription: "Category description",
    },
  );
  assert.deepEqual(seoFieldsSchema.parse({}), {
    seoTitle: "",
    seoDescription: "",
  });
  assert.equal(seoFieldsSchema.safeParse({ seoTitle: "x".repeat(256) }).success, false);
  assert.equal(
    productSeoFieldsSchema.safeParse({ seoDescription: "x".repeat(141) }).success,
    false,
  );
  assert.equal(
    categorySeoFieldsSchema.safeParse({ seoDescription: "x".repeat(149) }).success,
    true,
  );
  assert.equal(
    categorySeoFieldsSchema.safeParse({ seoDescription: "x".repeat(156) }).success,
    false,
  );
});

test("requested category SEO metadata fits category limits and remains untruncated", () => {
  const glovesDescription =
    "Browse industrial rubber gloves at Qasr Al Mabrook, including DPL industrial gloves. Find DPL industrial rubber gloves in Sharjah and across the UAE.";
  const mensPajamaDescription =
    "Explore men's pajama at Qasr Al Mabrook, including Citylife men's pajama. Find pajama options in Sharjah and across the UAE.";
  const gloves = categorySeoFieldsSchema.parse({
    seoTitle: "Industrial Rubber Gloves in UAE | Qasr Al Mabrook",
    seoDescription: glovesDescription,
  });
  const mensBottomWear = categorySeoFieldsSchema.parse({
    seoTitle: "Men's Pajama in Sharjah & UAE | Qasr Al Mabrook",
    seoDescription: mensPajamaDescription,
  });

  const glovesMetadata = createCategoryMetadata({
    locale: "en",
    path: "/categories/gloves",
    categoryName: "Gloves",
    seoTitle: gloves.seoTitle,
    seoDescription: gloves.seoDescription,
  });
  const mensBottomWearMetadata = createCategoryMetadata({
    locale: "en",
    path: "/categories/mens-bottom-wear",
    categoryName: "Men's Bottom Wear",
    seoTitle: mensBottomWear.seoTitle,
    seoDescription: mensBottomWear.seoDescription,
  });

  assert.equal(glovesDescription.length, 149);
  assert.equal(mensPajamaDescription.length, 124);
  assert.equal(glovesMetadata.title, gloves.seoTitle);
  assert.equal(glovesMetadata.description, glovesDescription);
  assert.equal(glovesMetadata.openGraph?.description, glovesDescription);
  assert.equal(
    glovesMetadata.alternates?.canonical,
    `${getBaseUrl()}/en/categories/gloves`,
  );
  assert.deepEqual(glovesMetadata.alternates?.languages, {
    en: `${getBaseUrl()}/en/categories/gloves`,
    ar: `${getBaseUrl()}/ar/categories/gloves`,
    "x-default": `${getBaseUrl()}/en/categories/gloves`,
  });
  assert.equal(mensBottomWearMetadata.title, mensBottomWear.seoTitle);
  assert.equal(mensBottomWearMetadata.description, mensPajamaDescription);
  assert.equal(mensBottomWearMetadata.openGraph?.description, mensPajamaDescription);
  assert.equal(
    mensBottomWearMetadata.alternates?.canonical,
    `${getBaseUrl()}/en/categories/mens-bottom-wear`,
  );
});

test("category custom SEO fields independently override generated metadata in both locales", () => {
  const english = createCategoryMetadata({
    locale: "en",
    path: "/categories/gloves",
    categoryName: "DPL Industrial Gloves",
    seoTitle: "DPL Gloves | Qasr Al Mabrook | Qasr Al Mabrook",
    seoDescription: "Configured English category description.",
    description: "Generated English category description.",
  });
  const arabic = createCategoryMetadata({
    locale: "ar",
    path: "/categories/gloves",
    categoryName: "قفازات DPL",
    seoTitle: "قفازات DPL | قصر المبارك",
    seoDescription: "وصف فئة القفازات المخصص.",
    description: "وصف الفئة المُنشأ.",
  });

  assert.equal(english.title, "DPL Gloves | Qasr Al Mabrook");
  assert.equal(english.description, "Configured English category description.");
  assert.equal(english.alternates?.canonical, `${getBaseUrl()}/en/categories/gloves`);
  assert.equal(english.openGraph?.url, `${getBaseUrl()}/en/categories/gloves`);
  assert.deepEqual(english.alternates?.languages, {
    en: `${getBaseUrl()}/en/categories/gloves`,
    ar: `${getBaseUrl()}/ar/categories/gloves`,
    "x-default": `${getBaseUrl()}/en/categories/gloves`,
  });
  assert.equal(arabic.title, "قفازات DPL | قصر المبارك");
  assert.equal(arabic.description, "وصف فئة القفازات المخصص.");
  assert.equal(arabic.alternates?.canonical, `${getBaseUrl()}/ar/categories/gloves`);
  assert.equal(arabic.openGraph?.url, `${getBaseUrl()}/ar/categories/gloves`);
  assert.deepEqual(arabic.alternates?.languages, {
    ar: `${getBaseUrl()}/ar/categories/gloves`,
    en: `${getBaseUrl()}/en/categories/gloves`,
    "x-default": `${getBaseUrl()}/en/categories/gloves`,
  });
});

test("blank category SEO fields use localized generated fallbacks", () => {
  const english = createCategoryMetadata({
    locale: "en",
    path: "/categories/gloves",
    categoryName: "Occupational Gloves",
    seoTitle: "  ",
    seoDescription: " ",
    description: "Neoprene gloves with a flock-lined interior.",
  });
  const arabic = createCategoryMetadata({
    locale: "ar",
    path: "/categories/gloves",
    categoryName: "قفازات مهنية",
    seoTitle: "",
    seoDescription: "",
    description: "قفازات مهنية ببطانة داخلية من الفلوك.",
  });

  assert.equal(english.title, "Occupational Gloves | Qasr Al Mabrook");
  assert.match(english.description ?? "", /Neoprene gloves/u);
  assert.equal(arabic.title, "قفازات مهنية | قصر المبارك");
  assert.match(arabic.description ?? "", /قفازات مهنية/u);
});

test("category configured SEO values take precedence over curated landing fallbacks independently", () => {
  assert.deepEqual(
    resolveSeoMetadata(
      { seoTitle: "  Admin title  ", seoDescription: " " },
      {
        seoTitle: "Curated title",
        seoDescription: "Curated description",
      },
    ),
    {
      seoTitle: "Admin title",
      seoDescription: "Curated description",
    },
  );

  const metadata = createCategoryMetadata({
    locale: "en",
    path: "/categories/fancy-suit",
    categoryName: "Fancy Suit",
    seoTitle: "Admin-configured category title",
    seoDescription: "Admin-configured category description.",
  });
  assert.equal(metadata.title, "Admin-configured category title | Qasr Al Mabrook");
  assert.equal(metadata.description, "Admin-configured category description.");
});

test("product and category SEO write actions authenticate before persistence", () => {
  const actionFiles = [
    {
      path: "../src/server/services/admin-catalog.ts",
      functionName: "upsertProductAction",
      guard: "authorizeAdminMutation",
    },
    {
      path: "../src/app/(admin)/admin/translations/actions.ts",
      functionName: "saveProductTranslation",
      guard: "requireAdminSession",
    },
    {
      path: "../src/app/(admin)/admin/translations/actions.ts",
      functionName: "saveCategoryTranslation",
      guard: "requireAdminSession",
    },
    {
      path: "../src/server/services/admin-catalog.ts",
      functionName: "upsertCategoryTranslationAction",
      guard: "authorizeAdminMutation",
    },
  ];

  for (const { path, functionName, guard } of actionFiles) {
    const filePath = new URL(path, import.meta.url);
    const source = readFileSync(filePath, "utf8");
    const sourceFile = ts.createSourceFile(
      filePath.pathname,
      source,
      ts.ScriptTarget.Latest,
      true,
    );
    const action = sourceFile.statements.find(
      (statement): statement is ts.FunctionDeclaration =>
        ts.isFunctionDeclaration(statement) && statement.name?.text === functionName,
    );
    const firstStatement = action?.body?.statements[0];

    assert.ok(firstStatement);
    assert.match(
      firstStatement.getText(sourceFile),
      new RegExp(`await ${guard}\\(\\)`),
    );
  }
});

test("category SEO admin controls and save workflow carry both locale fields", () => {
  const translationManagerPath = new URL(
    "../src/app/(admin)/admin/translations/translation-manager.tsx",
    import.meta.url,
  );
  const translationManager = readFileSync(translationManagerPath, "utf8");
  assert.match(translationManager, /id="category-translation-seo-title"/u);
  assert.match(translationManager, /name="seoTitle"/u);
  assert.match(translationManager, /id="category-translation-seo-description"/u);
  assert.match(translationManager, /name="seoDescription"/u);
  assert.match(translationManager, /categoryEdit\?\.seoTitle/u);
  assert.match(translationManager, /categoryEdit\?\.seoDescription/u);
  assert.match(translationManager, /maxLength=\{155\}/u);
  assert.match(translationManager, /up to 155 characters/u);

  const actionPath = new URL(
    "../src/app/(admin)/admin/translations/actions.ts",
    import.meta.url,
  );
  const actionSource = readFileSync(actionPath, "utf8");
  const actionFile = ts.createSourceFile(
    actionPath.pathname,
    actionSource,
    ts.ScriptTarget.Latest,
    true,
  );
  const categoryAction = actionFile.statements.find(
    (statement): statement is ts.FunctionDeclaration =>
      ts.isFunctionDeclaration(statement) &&
      statement.name?.text === "saveCategoryTranslation",
  );
  assert.ok(categoryAction);
  assert.match(
    categoryAction.getText(actionFile),
    /categoryTranslationSchema\.safeParse/u,
  );
  assert.match(categoryAction.getText(actionFile), /seoTitle:\s*values\.seoTitle/u);
  assert.match(
    categoryAction.getText(actionFile),
    /seoDescription:\s*values\.seoDescription/u,
  );
});

test("localized Yokohama tape SEO preserves route canonicals and reciprocal hreflang", () => {
  for (const product of yokohamaProducts) {
    for (const locale of ["en", "ar"] as const) {
      const english = locale === "en";
      const seoTitle = english ? product.englishTitle : product.arabicTitle;
      const seoDescription = english
        ? product.englishDescription
        : product.arabicDescription;
      const metadata = createProductMetadata({
        locale,
        path: `/products/${product.slug}`,
        productName: product.name,
        seoTitle,
        seoDescription,
        hasAlternate: true,
      });
      const englishPath = `${getBaseUrl()}/en/products/${product.slug}`;
      const arabicPath = `${getBaseUrl()}/ar/products/${product.slug}`;

      assert.ok(Array.from(seoDescription).length <= 140);
      assert.equal(
        metadata.title,
        `${seoTitle} | ${english ? "Qasr Al Mabrook" : "قصر المبارك"}`,
      );
      assert.equal(metadata.description, seoDescription);
      assert.equal(metadata.alternates?.canonical, english ? englishPath : arabicPath);
      assert.deepEqual(metadata.alternates?.languages, {
        [locale]: english ? englishPath : arabicPath,
        [english ? "ar" : "en"]: english ? arabicPath : englishPath,
        "x-default": englishPath,
      });
    }
  }
});

const databaseUrl = process.env.DATABASE_URL;
const isDisposableCiDatabase = (() => {
  if (process.env.CI !== "true" || process.env.NODE_ENV !== "test" || !databaseUrl) {
    return false;
  }
  try {
    const url = new URL(databaseUrl);
    return (
      ["127.0.0.1", "localhost"].includes(url.hostname) &&
      url.pathname.replace(/^\//u, "") === "qam_test"
    );
  } catch {
    return false;
  }
})();

if (process.env.CI === "true" && !isDisposableCiDatabase) {
  throw new Error(
    "Product SEO persistence tests require the isolated local qam_test database.",
  );
}

test(
  "localized product SEO fields load after default and alternate translation saves",
  { skip: !isDisposableCiDatabase },
  async () => {
    const [{ db }, { products }, repository] = await Promise.all([
      import("@/db"),
      import("@/db/schema/catalog"),
      import("@/server/repositories/catalog-admin"),
    ]);
    const slug = `seo-test-${randomUUID()}`;
    let createdProductId: string | null = null;

    try {
      const product = await repository.createProduct({
        slug,
        status: "DRAFT",
      });
      assert.ok(product);
      createdProductId = product.id;

      const englishSaved = await repository.saveProductWithDefaultTranslation({
        id: product.id,
        slug,
        status: "DRAFT",
        locale: "en",
        name: "Test measuring tape",
        shortDescription: "Test product summary",
        description: "Test product details",
        seoTitle: "English SEO title",
        seoDescription: "English SEO description",
      });
      assert.ok(englishSaved);

      const arabicSaved = await repository.createProductTranslation({
        productId: product.id,
        locale: "ar",
        name: "شريط قياس تجريبي",
        seoTitle: "عنوان SEO عربي",
        seoDescription: "وصف SEO عربي",
      });
      assert.ok(arabicSaved);

      const arabicUpdated = await repository.updateProductTranslationById(
        arabicSaved.id,
        {
          name: arabicSaved.name,
          seoTitle: "عنوان SEO عربي محدث",
          seoDescription: "وصف SEO عربي محدث",
        },
      );

      assert.ok(arabicUpdated);

      const loaded = await repository.listProductTranslationsForProduct(product.id);
      assert.deepEqual(
        loaded.map(({ locale, seoTitle, seoDescription }) => ({
          locale,
          seoTitle,
          seoDescription,
        })),
        [
          {
            locale: "en",
            seoTitle: "English SEO title",
            seoDescription: "English SEO description",
          },
          {
            locale: "ar",
            seoTitle: "عنوان SEO عربي محدث",
            seoDescription: "وصف SEO عربي محدث",
          },
        ],
      );
    } finally {
      if (createdProductId) {
        await db.delete(products).where(eq(products.id, createdProductId));
      }
    }
  },
);

test(
  "localized category SEO fields load after English and Arabic translation saves",
  { skip: !isDisposableCiDatabase },
  async () => {
    const [{ db }, repository] = await Promise.all([
      import("@/db"),
      import("@/server/repositories/catalog-admin"),
    ]);
    const slug = `seo-test-category-${randomUUID()}`;
    let categoryId: string | null = null;

    try {
      const category = await repository.createCategory({
        slug,
        status: "DRAFT",
      });
      assert.ok(category);
      categoryId = category.id;

      const english = await repository.createCategoryTranslation({
        categoryId: category.id,
        locale: "en",
        name: "Test work gloves",
        seoTitle: "English category SEO title",
        seoDescription: "English category SEO description",
      });
      const arabic = await repository.createCategoryTranslation({
        categoryId: category.id,
        locale: "ar",
        name: "قفازات عمل تجريبية",
        seoTitle: "عنوان SEO عربي للفئة",
        seoDescription: "وصف SEO عربي للفئة",
      });
      assert.ok(english);
      assert.ok(arabic);

      const englishUpdated = await repository.updateCategoryTranslationById(
        english.id,
        {
          name: english.name,
          seoTitle: "Updated English category SEO title",
          seoDescription: "Updated English category SEO description",
        },
      );
      const arabicUpdated = await repository.updateCategoryTranslationById(arabic.id, {
        name: arabic.name,
        seoTitle: "عنوان SEO عربي محدث للفئة",
        seoDescription: "وصف SEO عربي محدث للفئة",
      });
      assert.ok(englishUpdated);
      assert.ok(arabicUpdated);

      const reloaded = await Promise.all([
        repository.getCategoryTranslationForLocale(category.id, "en"),
        repository.getCategoryTranslationForLocale(category.id, "ar"),
      ]);
      assert.deepEqual(
        reloaded.map(({ locale, seoTitle, seoDescription }) => ({
          locale,
          seoTitle,
          seoDescription,
        })),
        [
          {
            locale: "en",
            seoTitle: "Updated English category SEO title",
            seoDescription: "Updated English category SEO description",
          },
          {
            locale: "ar",
            seoTitle: "عنوان SEO عربي محدث للفئة",
            seoDescription: "وصف SEO عربي محدث للفئة",
          },
        ],
      );
    } finally {
      if (categoryId) await repository.deleteCategoryById(categoryId);
      await db.$client.end();
    }
  },
);
