import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { eq } from "drizzle-orm";
import ts from "typescript";

import {
  createProductMetadata,
  getBaseUrl,
  resolveProductSeoMetadata,
} from "@/lib/seo";
import { productSeoFieldsSchema } from "@/lib/product-seo";

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

test("product SEO write actions authenticate before accessing persistence", () => {
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
