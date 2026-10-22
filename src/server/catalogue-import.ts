import { readFile } from "node:fs/promises";
import path from "node:path";

import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { serverEnv } from "@/config/env";
import {
  categories,
  productCategories,
  productImages,
  productTranslations,
  products,
} from "@/db/schema";
import type { DiscoveryReport } from "@/lib/catalogue-discovery";
import {
  buildProductCategoryAssignments,
  buildCatalogueImportPlan,
  getMissingProductCategoryRelations,
  resolveCatalogueCategoryIdsForImport,
  runCatalogueImportWithCleanup,
} from "@/lib/catalogue-import";
import {
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

// no local staging for confirmed imports; we upload directly to R2.

async function assertNoExistingDataConflicts(
  plan: ReturnType<typeof buildCatalogueImportPlan>,
) {
  await resolveCatalogueCategoryIdsForImport(
    plan.categories,
    (ids) =>
      db
        .select({ id: categories.id, slug: categories.slug })
        .from(categories)
        .where(inArray(categories.id, ids)),
    (slugs) =>
      db
        .select({ id: categories.id, slug: categories.slug })
        .from(categories)
        .where(inArray(categories.slug, slugs)),
  );

  for (const product of plan.products) {
    const existing = await db
      .select()
      .from(products)
      .where(eq(products.slug, product.slug))
      .limit(1);
    if (!existing[0]) continue;
    const translation = await db
      .select()
      .from(productTranslations)
      .where(
        and(
          eq(productTranslations.productId, existing[0].id),
          eq(productTranslations.locale, "en"),
        ),
      )
      .limit(1);
    if (!translation[0] || translation[0].name !== product.name) {
      throw new Error(
        `Import conflict for product slug "${product.slug}"; existing data is not an exact importer match.`,
      );
    }
  }
}

export async function importLocalCatalogue(report: DiscoveryReport) {
  // Validate manifest errors first
  if (report.manifestErrors.length) {
    throw new Error("Catalogue import refused while manifest errors remain.");
  }

  // Prevent accidental writes to an unintended remote DB: require explicit approval when DATABASE_URL is remote
  const { isLocalDatabaseUrl } = await import("@/lib/catalogue-import");
  const runtimeDbUrl = serverEnv.DIRECT_DATABASE_URL ?? serverEnv.DATABASE_URL;
  if (!isLocalDatabaseUrl(runtimeDbUrl)) {
    if (serverEnv.IMPORT_CONFIRMATION !== "APPLY_CATALOGUE_IMPORT") {
      throw new Error(
        "Refusing local import at runtime: DATABASE_URL appears to be a remote host. Set IMPORT_CONFIRMATION=APPLY_CATALOGUE_IMPORT to explicitly allow imports into this database.",
      );
    }
  }

  // Validate R2 configuration before attempting any uploads
  const { validateR2Configuration } = await import("@/lib/production-readiness");
  const r2Check = validateR2Configuration({
    r2AccountId: serverEnv.R2_ACCOUNT_ID,
    r2AccessKeyId: serverEnv.R2_ACCESS_KEY_ID,
    r2SecretAccessKey: serverEnv.R2_SECRET_ACCESS_KEY,
    r2BucketName: serverEnv.R2_BUCKET_NAME,
    r2PublicBaseUrl: serverEnv.R2_PUBLIC_BASE_URL,
  });
  if (!r2Check.ok) {
    throw new Error(
      `Refusing local import: R2 configuration invalid: ${r2Check.errors.map((e) => e.key).join(", ")}`,
    );
  }

  const plan = buildCatalogueImportPlan(report);
  const duplicateSlugs = plan.products.filter(
    (product, index, all) =>
      all.findIndex((candidate) => candidate.slug === product.slug) !== index,
  );
  if (duplicateSlugs.length)
    throw new Error(
      `Catalogue import refused due to duplicate product slugs: ${duplicateSlugs.map((product) => product.slug).join(", ")}`,
    );

  await assertNoExistingDataConflicts(plan);
  // For confirmed imports we will upload assets to R2 and then create DB records.

  // Construct R2 S3-compatible endpoint using account id
  const r2AccountId = serverEnv.R2_ACCOUNT_ID;
  const bucket = serverEnv.R2_BUCKET_NAME ?? "";
  if (!r2AccountId || !bucket) {
    throw new Error("Refusing local import: missing R2_ACCOUNT_ID or R2_BUCKET_NAME.");
  }

  const s3Endpoint = `https://${r2AccountId}.r2.cloudflarestorage.com`;
  const s3 = new S3Client({
    region: "auto",
    endpoint: s3Endpoint,
    credentials: {
      accessKeyId: serverEnv.R2_ACCESS_KEY_ID ?? "",
      secretAccessKey: serverEnv.R2_SECRET_ACCESS_KEY ?? "",
    },
  });

  const { generateR2ObjectKey } = await import("@/lib/catalogue-import");
  const importRunId = crypto.randomUUID();
  const attemptedObjectKeys = new Set<string>();

  const performImport = async () => {
    const normalizedSizes = new Map<
      string,
      { width: number | null; height: number | null }
    >();
    const objectKeysByImage = new WeakMap<object, string>();

    // Upload/reconcile objects (normalize first)
    for (const product of plan.products) {
      for (const image of product.images) {
        const key = generateR2ObjectKey(product.slug, image.filename);
        objectKeysByImage.set(image, key);
        const localPath = path.join(report.source, image.relativePath);
        // Read source buffer
        let srcBuffer: Buffer;
        try {
          srcBuffer = await readFile(localPath);
        } catch (err) {
          throw new Error(`Failed to read local image ${localPath}: ${String(err)}`);
        }

        // Preserve source image bytes and dimensions without any destructive trimming or normalization.
        const sharpMod = (await import("sharp")).default;
        const finalBuffer = srcBuffer;
        const finalMeta = await sharpMod(finalBuffer).metadata();

        // Record original dimensions for DB use without altering the stored asset.
        normalizedSizes.set(key, {
          width: finalMeta.width ?? null,
          height: finalMeta.height ?? null,
        });

        // Conditional creation and run metadata make later cleanup ownership verifiable.
        attemptedObjectKeys.add(key);
        try {
          await s3.send(
            new PutObjectCommand({
              Bucket: bucket,
              Key: key,
              Body: finalBuffer,
              IfNoneMatch: "*",
              Metadata: { "catalogue-import-run-id": importRunId },
            }),
          );
        } catch (uploadErr) {
          throw new Error(
            `Failed to upload image ${image.relativePath} to R2: ${String(uploadErr)}`,
          );
        }
      }
    }

    return await db.transaction(async (transaction) => {
      const categoryIds = await resolveCatalogueCategoryIdsForImport(
        plan.categories,
        (ids) =>
          transaction
            .select({ id: categories.id, slug: categories.slug })
            .from(categories)
            .where(inArray(categories.id, ids)),
        (slugs) =>
          transaction
            .select({ id: categories.id, slug: categories.slug })
            .from(categories)
            .where(inArray(categories.slug, slugs)),
      );
      const productCategorySources: Array<{
        productId: string;
        sourceCategory: string;
      }> = [];

      for (const product of plan.products) {
        const existing = await transaction
          .select()
          .from(products)
          .where(eq(products.slug, product.slug))
          .limit(1);
        const record =
          existing[0] ??
          (
            await transaction
              .insert(products)
              .values({ slug: product.slug, status: plan.status })
              .returning()
          )[0];
        if (!record) throw new Error(`Could not create product: ${product.name}`);

        const translation = await transaction
          .select()
          .from(productTranslations)
          .where(
            and(
              eq(productTranslations.productId, record.id),
              eq(productTranslations.locale, "en"),
            ),
          )
          .limit(1);
        if (!translation[0])
          await transaction
            .insert(productTranslations)
            .values({ productId: record.id, locale: "en", name: product.name })
            .returning();

        productCategorySources.push({
          productId: record.id,
          sourceCategory: product.category,
        });

        for (const image of product.images) {
          const key = objectKeysByImage.get(image);
          if (!key) {
            throw new Error(
              `Missing uploaded object key for image ${image.relativePath}.`,
            );
          }
          const publicUrl = `${serverEnv.R2_PUBLIC_BASE_URL?.replace(/\/$/, "")}/${key}`;
          // Find existing image by objectKey
          const existingImage = await transaction
            .select()
            .from(productImages)
            .where(
              and(
                eq(productImages.productId, record.id),
                eq(productImages.objectKey, key),
              ),
            )
            .limit(1);

          let imageRecord = existingImage[0];

          // If no record for this objectKey, look for an old local `/catalogue/` record matching the filename and update it
          if (!imageRecord) {
            const productImagesForProduct = await transaction
              .select()
              .from(productImages)
              .where(eq(productImages.productId, record.id));

            const oldRecord = productImagesForProduct.find((r) => {
              const url = r.publicUrl ?? "";
              return (
                url.includes("/catalogue/") &&
                url.toLowerCase().endsWith(image.filename.toLowerCase())
              );
            });

            if (oldRecord) {
              const sizes = normalizedSizes.get(key);
              const updated = (
                await transaction
                  .update(productImages)
                  .set({
                    objectKey: key,
                    publicUrl,
                    width: sizes?.width ?? image.width ?? null,
                    height: sizes?.height ?? image.height ?? null,
                    sortOrder: image.sortOrder,
                    isPrimary: image.filename === product.primaryImage,
                  })
                  .where(eq(productImages.id, oldRecord.id))
                  .returning()
              )[0];
              imageRecord = updated;
            }
          }

          if (!imageRecord) {
            const sizes = normalizedSizes.get(key);
            imageRecord = (
              await transaction
                .insert(productImages)
                .values({
                  productId: record.id,
                  objectKey: key,
                  publicUrl,
                  width: sizes?.width ?? image.width ?? null,
                  height: sizes?.height ?? image.height ?? null,
                  sortOrder: image.sortOrder,
                  isPrimary: image.filename === product.primaryImage,
                })
                .returning()
            )[0];
          }
          if (!imageRecord)
            throw new Error(`Could not create image: ${image.relativePath}`);
          if (!record.primaryImageId && image.filename === product.primaryImage)
            await transaction
              .update(products)
              .set({ primaryImageId: imageRecord.id })
              .where(eq(products.id, record.id));
        }
      }

      const desiredRelations = buildProductCategoryAssignments(
        productCategorySources,
        categoryIds,
      );
      if (desiredRelations.length) {
        const existingRelations = await transaction
          .select({
            productId: productCategories.productId,
            categoryId: productCategories.categoryId,
          })
          .from(productCategories)
          .where(
            inArray(productCategories.productId, [
              ...new Set(desiredRelations.map(({ productId }) => productId)),
            ]),
          );
        const missingRelations = getMissingProductCategoryRelations(
          desiredRelations,
          existingRelations,
        );
        if (missingRelations.length) {
          await transaction
            .insert(productCategories)
            .values(missingRelations)
            .returning();
        }
      }

      return plan;
    });
  };

  return runCatalogueImportWithCleanup(performImport, attemptedObjectKeys, {
    isOwnedByImport: async (objectKey) => {
      try {
        const head = await s3.send(
          new HeadObjectCommand({ Bucket: bucket, Key: objectKey }),
        );
        return head.Metadata?.["catalogue-import-run-id"] === importRunId;
      } catch (error) {
        if (
          error &&
          typeof error === "object" &&
          "$metadata" in error &&
          error.$metadata &&
          typeof error.$metadata === "object" &&
          "httpStatusCode" in error.$metadata &&
          error.$metadata.httpStatusCode === 404
        ) {
          return false;
        }
        throw error;
      }
    },
    isReferenced: async (objectKey) => {
      const existing = await db
        .select({ id: productImages.id })
        .from(productImages)
        .where(eq(productImages.objectKey, objectKey))
        .limit(1);
      return existing.length > 0;
    },
    deleteObject: async (objectKey) => {
      await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: objectKey }));
    },
    reportCleanupFailure: (objectKey, error) => {
      console.error(
        `Failed to clean up R2 object "${objectKey}" after catalogue import failure.`,
        error,
      );
    },
    reportCleanupSkipped: (objectKey) => {
      console.warn(
        `Skipped cleanup of R2 object "${objectKey}" because it is not owned by this import or is still referenced.`,
      );
    },
  });
}
