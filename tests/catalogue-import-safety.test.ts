import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import sharp from "sharp";

import { discoverCatalogue } from "@/lib/catalogue-discovery";
import {
  buildCatalogueImportPlan,
  buildProductCategoryAssignments,
  getMissingProductCategoryRelations,
  readOriginalProductImageMetadata,
  resolveCatalogueCategoryIds,
  runCatalogueImportWithCleanup,
  validateLocalImportMode,
} from "@/lib/catalogue-import";
import { validateR2Configuration } from "@/lib/production-readiness";
import { resolvePrimaryProductImageId } from "@/server/services/admin-catalog";

const importerSource = readFileSync(
  path.resolve("src/server/catalogue-import.ts"),
  "utf8",
).replace(/\s+/g, " ");

test("local DATABASE_URL accepted", () => {
  const mode = validateLocalImportMode(
    "local",
    true,
    "postgresql://user:pass@localhost:5432/db",
  );
  assert.equal(mode.ok, true);
});

test("remote Supabase DATABASE_URL accepted for development", () => {
  const mode = validateLocalImportMode(
    "local",
    true,
    "postgresql://postgres.ocbxudldjtpxzdfzmkyp:secret@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres",
  );
  assert.equal(mode.ok, true);
});

test("malformed DATABASE_URL rejected", () => {
  const mode = validateLocalImportMode("local", true, "not-a-url");
  assert.equal(mode.ok, false);
});

test("missing DATABASE_URL rejected", () => {
  const mode = validateLocalImportMode("local", true, undefined);
  assert.equal(mode.ok, false);
});

test("R2 missing configuration detected", () => {
  const res = validateR2Configuration({});
  assert.equal(res.ok, false);
  const keys = res.errors.map((e) => e.key).sort();
  assert.ok(keys.includes("R2_ACCOUNT_ID"));
  assert.ok(keys.includes("R2_ACCESS_KEY_ID"));
  assert.ok(keys.includes("R2_SECRET_ACCESS_KEY"));
  assert.ok(keys.includes("R2_BUCKET_NAME"));
  assert.ok(keys.includes("R2_PUBLIC_BASE_URL"));
});

test("malformed R2 public URL detected", () => {
  const res = validateR2Configuration({
    r2AccountId: "a",
    r2AccessKeyId: "b",
    r2SecretAccessKey: "c",
    r2BucketName: "d",
    r2PublicBaseUrl: "not-a-url",
  });
  assert.equal(res.ok, false);
  assert.ok(res.errors.some((e) => e.key === "R2_PUBLIC_BASE_URL"));
});

test("valid R2 configuration accepted", () => {
  const res = validateR2Configuration({
    r2AccountId: "account",
    r2AccessKeyId: "access",
    r2SecretAccessKey: "secret",
    r2BucketName: "bucket",
    r2PublicBaseUrl: "https://cdn.example.com",
  });
  assert.equal(res.ok, true);
});

test("reads original product image dimensions without trimming", async () => {
  const buffer = await sharp({
    create: {
      width: 3,
      height: 2,
      channels: 3,
      background: "#ff0000",
    },
  })
    .png()
    .toBuffer();

  const metadata = await readOriginalProductImageMetadata(buffer);
  assert.deepEqual(metadata, { width: 3, height: 2 });
});

test("keeps the current primary image unless the new image is explicitly marked primary", () => {
  assert.equal(
    resolvePrimaryProductImageId({
      currentPrimaryImageId: "existing-primary",
      candidateImageId: "new-upload",
      isPrimaryChecked: false,
    }),
    "existing-primary",
  );

  assert.equal(
    resolvePrimaryProductImageId({
      currentPrimaryImageId: null,
      candidateImageId: "new-upload",
      isPrimaryChecked: true,
    }),
    "new-upload",
  );
});

test("catalogue import maps each supported source directory to its stable category ID", () => {
  const plan = buildCatalogueImportPlan({
    source: "catalogue",
    categories: [
      "Adivasi Oil",
      "Cloth Piece",
      "Pajama",
      "Measuring Tape",
      "FANCY SUIT",
    ],
    products: [
      "Adivasi Oil",
      "Cloth Piece",
      "Pajama",
      "Measuring Tape",
      "FANCY SUIT",
    ].map((category) => ({
      category,
      name: `${category} product`,
      images: [],
      primaryImage: "",
    })),
    banners: [],
    ignoredDirectories: [],
    unassignedImages: [],
    ambiguousImages: [],
    manifestUsed: true,
    manifestErrors: [],
    unreferencedManifestImages: [],
  });

  assert.deepEqual(
    plan.categories.map(({ sourceName, categoryId }) => ({ sourceName, categoryId })),
    [
      { sourceName: "Adivasi Oil", categoryId: "9c63ae52-6468-4a21-b8a3-c08ae78c3d3d" },
      { sourceName: "Cloth Piece", categoryId: "3703a065-d590-4335-80d3-fcebdaf5dd61" },
      { sourceName: "Pajama", categoryId: "a8d36d07-3881-410a-a8a5-cb81ba72dc00" },
      {
        sourceName: "Measuring Tape",
        categoryId: "f4b74bfb-a999-416e-8402-f48bea7c3f36",
      },
      { sourceName: "FANCY SUIT", categoryId: "fe12dc19-cd89-452b-83d0-f6aedd948386" },
    ],
  );
  assert.deepEqual(
    plan.products.map((product) => product.category),
    ["Adivasi Oil", "Cloth Piece", "Pajama", "Measuring Tape", "FANCY SUIT"],
  );
});

test("category resolution reuses mapped IDs even when current slugs change", () => {
  const plan = buildCatalogueImportPlan({
    source: "catalogue",
    categories: ["Adivasi Oil"],
    products: [
      { category: "Adivasi Oil", name: "Adivasi Oil", images: [], primaryImage: "" },
    ],
    banners: [],
    ignoredDirectories: [],
    unassignedImages: [],
    ambiguousImages: [],
    manifestUsed: true,
    manifestErrors: [],
    unreferencedManifestImages: [],
  });

  const categoryIds = resolveCatalogueCategoryIds(plan.categories, [
    { id: "9c63ae52-6468-4a21-b8a3-c08ae78c3d3d", slug: "a-new-current-slug" },
  ]);

  assert.equal(categoryIds.get("Adivasi Oil"), "9c63ae52-6468-4a21-b8a3-c08ae78c3d3d");
});

test("category resolution fails safely when a mapped ID is missing", () => {
  const plan = buildCatalogueImportPlan({
    source: "catalogue",
    categories: ["Adivasi Oil"],
    products: [
      { category: "Adivasi Oil", name: "Adivasi Oil", images: [], primaryImage: "" },
    ],
    banners: [],
    ignoredDirectories: [],
    unassignedImages: [],
    ambiguousImages: [],
    manifestUsed: true,
    manifestErrors: [],
    unreferencedManifestImages: [],
  });

  assert.throws(
    () => resolveCatalogueCategoryIds(plan.categories, []),
    /does not exist; refusing to create a replacement category/,
  );
});

test("category resolution rejects a legacy slug owned by another category ID", () => {
  const plan = buildCatalogueImportPlan({
    source: "catalogue",
    categories: ["Adivasi Oil"],
    products: [
      { category: "Adivasi Oil", name: "Adivasi Oil", images: [], primaryImage: "" },
    ],
    banners: [],
    ignoredDirectories: [],
    unassignedImages: [],
    ambiguousImages: [],
    manifestUsed: true,
    manifestErrors: [],
    unreferencedManifestImages: [],
  });

  assert.throws(
    () =>
      resolveCatalogueCategoryIds(plan.categories, [
        { id: "9c63ae52-6468-4a21-b8a3-c08ae78c3d3d", slug: "hair-oils" },
        { id: "another-category", slug: "adivasi-oil" },
      ]),
    /legacy slug "adivasi-oil" belongs to category ID "another-category"/,
  );
});

test("products from every source folder receive the mapped category ID", () => {
  const sourceFolders = [
    "Adivasi Oil",
    "Cloth Piece",
    "Pajama",
    "Measuring Tape",
    "FANCY SUIT",
  ];
  const plan = buildCatalogueImportPlan({
    source: "catalogue",
    categories: sourceFolders,
    products: sourceFolders.map((category, index) => ({
      category,
      name: `product-${index}`,
      images: [],
      primaryImage: "",
    })),
    banners: [],
    ignoredDirectories: [],
    unassignedImages: [],
    ambiguousImages: [],
    manifestUsed: true,
    manifestErrors: [],
    unreferencedManifestImages: [],
  });
  const categoryIds = resolveCatalogueCategoryIds(
    plan.categories,
    plan.categories.map(({ categoryId }) => ({
      id: categoryId,
      slug: "current-slug-may-change",
    })),
  );
  const assignments = buildProductCategoryAssignments(
    plan.products.map((product, index) => ({
      productId: `product-${index}`,
      sourceCategory: product.category,
    })),
    categoryIds,
  );

  assert.deepEqual(
    assignments.map(({ categoryId }) => categoryId),
    plan.categories.map(({ categoryId }) => categoryId),
  );
});

test("existing product-category relationships are preserved and only missing ones are returned", () => {
  const existing = [
    { productId: "product-1", categoryId: "category-a" },
    { productId: "product-1", categoryId: "category-b" },
  ];
  const desired = [
    { productId: "product-1", categoryId: "category-a", isPrimary: true },
    { productId: "product-2", categoryId: "category-c", isPrimary: true },
  ];

  assert.deepEqual(getMissingProductCategoryRelations(desired, existing), [
    { productId: "product-2", categoryId: "category-c", isPrimary: true },
  ]);
  assert.deepEqual(existing, [
    { productId: "product-1", categoryId: "category-a" },
    { productId: "product-1", categoryId: "category-b" },
  ]);
});

test("legacy-category preflight runs before R2 uploads and importer database writes", () => {
  const preflight = importerSource.indexOf("await assertNoExistingDataConflicts(plan)");
  const r2Client = importerSource.indexOf("new S3Client");
  const transaction = importerSource.indexOf("return await db.transaction");
  const transactionCategoryCheck = importerSource.indexOf(
    "const categoryIds = await resolveCatalogueCategoryIdsForImport(",
  );
  const productInsert = importerSource.indexOf(".insert(products)");

  assert.ok(preflight >= 0 && preflight < r2Client);
  assert.ok(r2Client < transaction);
  assert.ok(
    transactionCategoryCheck > transaction && transactionCategoryCheck < productInsert,
  );
  assert.match(
    importerSource,
    /transaction\s*\.insert\(productCategories\)\s*\.values\(missingRelations\)/,
  );
  assert.ok(!importerSource.includes(".insert(categories)"));
});

test("catalogue import cleans objects created before a later upload or transaction failure", async () => {
  const importError = new Error("transaction rejected");
  const objectKeys = new Set<string>();
  const deletedKeys: string[] = [];

  await assert.rejects(
    runCatalogueImportWithCleanup(
      async () => {
        objectKeys.add("catalogue/new-image.jpg");
        throw importError;
      },
      objectKeys,
      {
        isOwnedByImport: async () => true,
        isReferenced: async () => false,
        deleteObject: async (objectKey) => {
          deletedKeys.push(objectKey);
        },
      },
    ),
    (error) => error === importError,
  );

  assert.deepEqual(deletedKeys, ["catalogue/new-image.jpg"]);
});

test("catalogue import preserves its original error and reports cleanup failures", async () => {
  const importError = new Error("database rollback");
  const cleanupError = new Error("R2 delete unavailable");
  const objectKeys = new Set(["catalogue/new-image.jpg"]);
  const cleanupFailures: Array<{ objectKey: string; error: unknown }> = [];

  await assert.rejects(
    runCatalogueImportWithCleanup(
      async () => {
        throw importError;
      },
      objectKeys,
      {
        isOwnedByImport: async () => true,
        isReferenced: async () => false,
        deleteObject: async () => {
          throw cleanupError;
        },
        reportCleanupFailure: (objectKey, error) =>
          cleanupFailures.push({ objectKey, error }),
      },
    ),
    (error) => error === importError,
  );

  assert.deepEqual(cleanupFailures, [
    { objectKey: "catalogue/new-image.jpg", error: cleanupError },
  ]);
});

test("catalogue import never deletes an existing object that is not owned by the failed run", async () => {
  const objectKeys = new Set(["catalogue/pre-existing.jpg"]);
  let deleteCalled = false;
  const skippedKeys: string[] = [];

  await assert.rejects(
    runCatalogueImportWithCleanup(
      async () => {
        throw new Error("later failure");
      },
      objectKeys,
      {
        isOwnedByImport: async () => false,
        isReferenced: async () => false,
        deleteObject: async () => {
          deleteCalled = true;
        },
        reportCleanupSkipped: (objectKey) => skippedKeys.push(objectKey),
      },
    ),
    /later failure/,
  );

  assert.equal(deleteCalled, false);
  assert.deepEqual(skippedKeys, ["catalogue/pre-existing.jpg"]);
});

test("catalogue import retains an owned object if the database still references it", async () => {
  const objectKeys = new Set(["catalogue/referenced-image.jpg"]);
  let deleteCalled = false;
  const skippedKeys: string[] = [];

  await assert.rejects(
    runCatalogueImportWithCleanup(
      async () => {
        throw new Error("transaction outcome was ambiguous");
      },
      objectKeys,
      {
        isOwnedByImport: async () => true,
        isReferenced: async () => true,
        deleteObject: async () => {
          deleteCalled = true;
        },
        reportCleanupSkipped: (objectKey) => skippedKeys.push(objectKey),
      },
    ),
    /transaction outcome was ambiguous/,
  );

  assert.equal(deleteCalled, false);
  assert.deepEqual(skippedKeys, ["catalogue/referenced-image.jpg"]);
});

test("catalogue import retains newly uploaded objects after successful database writes", async () => {
  const objectKeys = new Set<string>();
  let deleteCalled = false;

  const result = await runCatalogueImportWithCleanup(
    async () => {
      objectKeys.add("catalogue/committed-image.jpg");
      return "committed";
    },
    objectKeys,
    {
      isOwnedByImport: async () => true,
      isReferenced: async () => false,
      deleteObject: async () => {
        deleteCalled = true;
      },
    },
  );

  assert.equal(result, "committed");
  assert.equal(deleteCalled, false);
});

test("catalogue importer uses conditional R2 writes and persists the exact uploaded key", () => {
  assert.ok(importerSource.includes('IfNoneMatch: "*"'));
  assert.ok(
    importerSource.includes('Metadata: { "catalogue-import-run-id": importRunId }'),
  );
  assert.ok(importerSource.includes("const key = objectKeysByImage.get(image)"));
  assert.ok(importerSource.includes("return await db.transaction"));
  assert.ok(importerSource.includes("isReferenced: async (objectKey)"));
});

test("catalogue import rejects unsupported product-bearing source folders", () => {
  assert.throws(
    () =>
      buildCatalogueImportPlan({
        source: "catalogue",
        categories: ["Unknown Category"],
        products: [
          {
            category: "Unknown Category",
            name: "Unknown product",
            images: [],
            primaryImage: "",
          },
        ],
        banners: [],
        ignoredDirectories: [],
        unassignedImages: [],
        ambiguousImages: [],
        manifestUsed: true,
        manifestErrors: [],
        unreferencedManifestImages: [],
      }),
    /Unsupported catalogue category folder "Unknown Category"/,
  );
});

test("catalogue discovery excludes explicit brand and store-locator supporting directories", async () => {
  const source = await mkdtemp(path.join(os.tmpdir(), "catalogue-discovery-"));
  try {
    for (const directory of [
      "Adivasi Oil",
      "Brands",
      "In-Store-Images",
      "LOGO",
      "Banner",
    ]) {
      await mkdir(path.join(source, directory));
    }
    await writeFile(
      path.join(source, "Adivasi Oil", "Adivasi Oil-#01.jpg"),
      Buffer.from("fixture"),
    );
    await writeFile(path.join(source, "Brands", "logo.png"), Buffer.from("fixture"));
    await writeFile(
      path.join(source, "In-Store-Images", "In-Store-Images-01.jpg"),
      Buffer.from("fixture"),
    );
    await writeFile(
      path.join(source, "catalogue-manifest.json"),
      JSON.stringify({
        products: [
          {
            category: "Adivasi Oil",
            name: "Adivasi Oil",
            images: ["Adivasi Oil-#01.jpg"],
            primaryImage: "Adivasi Oil-#01.jpg",
          },
        ],
        unresolvedImages: [],
      }),
    );

    const report = await discoverCatalogue(source);

    assert.deepEqual(report.categories, ["Adivasi Oil"]);
    assert.deepEqual(report.ignoredDirectories, ["Brands", "In-Store-Images", "LOGO"]);
    assert.deepEqual(
      report.products.map((product) => product.category),
      ["Adivasi Oil"],
    );
  } finally {
    await rm(source, { recursive: true, force: true });
  }
});
