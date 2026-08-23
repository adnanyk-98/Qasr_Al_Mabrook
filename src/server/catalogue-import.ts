import { readFile } from "node:fs/promises";
import path from "node:path";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { serverEnv } from "@/config/env";
import {
  categoryTranslations,
  categories,
  productCategories,
  productImages,
  productTranslations,
  products,
} from "@/db/schema";
import type { DiscoveryReport } from "@/lib/catalogue-discovery";
import { buildCatalogueImportPlan } from "@/lib/catalogue-import";
import { S3Client, HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

// no local staging for confirmed imports; we upload directly to R2.

async function assertNoExistingDataConflicts(
  plan: ReturnType<typeof buildCatalogueImportPlan>,
) {
  for (const category of plan.categories) {
    const existing = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, category.slug))
      .limit(1);
    if (!existing[0]) continue;
    const translation = await db
      .select()
      .from(categoryTranslations)
      .where(
        and(
          eq(categoryTranslations.categoryId, existing[0].id),
          eq(categoryTranslations.locale, "en"),
        ),
      )
      .limit(1);
    if (!translation[0] || translation[0].name !== category.name) {
      throw new Error(
        `Import conflict for category slug "${category.slug}"; existing data is not an exact importer match.`,
      );
    }
  }

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
    throw new Error(
      "Catalogue import refused while manifest errors remain.",
    );
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

  const uploadedObjects: string[] = [];
  const normalizedSizes = new Map<string, { width: number | null; height: number | null }>();

  const { generateR2ObjectKey } = await import("@/lib/catalogue-import");

  // Upload/reconcile objects (normalize first)
  for (const product of plan.products) {
    for (const image of product.images) {
      const key = generateR2ObjectKey(product.slug, image.filename);
      const localPath = path.join(report.source, image.relativePath);
      // Read source buffer
      let srcBuffer: Buffer;
      try {
        srcBuffer = await readFile(localPath);
      } catch (err) {
        throw new Error(`Failed to read local image ${localPath}: ${String(err)}`);
      }

      // Normalize image (conservative). If analyzer decides unsafe, use original buffer.
      const { analyzeImage } = await import("@/lib/image-normalize");
      const analysis = await analyzeImage(localPath, { previewMaxSize: 500, paddingPct: 0.05 });

      let finalBuffer = srcBuffer;
      let finalMeta = await (await import("sharp")).default(finalBuffer).metadata();

      if (analysis.trimBox && !analysis.reason) {
        const tb = analysis.trimBox;
        try {
          const sharpMod = (await import("sharp")).default;
          let img = sharpMod(srcBuffer).extract({ left: tb.left, top: tb.top, width: tb.width, height: tb.height });
          // Re-encode conservatively based on original format
          const origMeta = await sharpMod(srcBuffer).metadata();
          const fmt = origMeta.format ?? "jpeg";
          if (fmt === "jpeg" || fmt === "jpg") img = img.jpeg({ quality: 82 });
          else if (fmt === "png") img = img.png();
          else if (fmt === "webp") img = img.webp({ quality: 82 });
          const buf = await img.toBuffer();
          finalBuffer = buf;
          finalMeta = await sharpMod(finalBuffer).metadata();
        } catch (err) {
          // On any normalization failure, fallback to original buffer
          finalBuffer = srcBuffer;
          finalMeta = await (await import("sharp")).default(finalBuffer).metadata();
        }
      }

      // Record normalized dimensions for DB use
      normalizedSizes.set(key, { width: finalMeta.width ?? null, height: finalMeta.height ?? null });

      // Check if object exists in R2 (head)
      let objectExists = false;
      try {
        await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
        objectExists = true;
      } catch (err) {
        objectExists = false;
      }

      if (!objectExists) {
        // Upload the normalized buffer; fail fast on any upload error
        try {
          await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: finalBuffer }));
          uploadedObjects.push(key);
        } catch (uploadErr) {
          throw new Error(`Failed to upload image ${image.relativePath} to R2: ${String(uploadErr)}`);
        }
      }
    }
  }

  return db.transaction(async (transaction) => {
    const categoryIds = new Map<string, string>();
    for (const category of plan.categories) {
      const existing = await transaction
        .select()
        .from(categories)
        .where(eq(categories.slug, category.slug))
        .limit(1);
      const record =
        existing[0] ??
        (
          await transaction
            .insert(categories)
            .values({ slug: category.slug, status: plan.status })
            .returning()
        )[0];
      if (!record) throw new Error(`Could not create category: ${category.name}`);
      categoryIds.set(category.name, record.id);

      const translation = await transaction
        .select()
        .from(categoryTranslations)
        .where(
          and(
            eq(categoryTranslations.categoryId, record.id),
            eq(categoryTranslations.locale, "en"),
          ),
        )
        .limit(1);
      if (!translation[0])
        await transaction
          .insert(categoryTranslations)
          .values({ categoryId: record.id, locale: "en", name: category.name })
          .returning();
    }

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

      const categoryId = categoryIds.get(product.category);
      if (!categoryId)
        throw new Error(`Missing imported category: ${product.category}`);
      const relation = await transaction
        .select()
        .from(productCategories)
        .where(
          and(
            eq(productCategories.productId, record.id),
            eq(productCategories.categoryId, categoryId),
          ),
        )
        .limit(1);
      if (!relation[0])
        await transaction
          .insert(productCategories)
          .values({ productId: record.id, categoryId, isPrimary: true })
          .returning();

      for (const image of product.images) {
        const key = generateR2ObjectKey(product.slug, image.filename);
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
            return url.includes("/catalogue/") && url.toLowerCase().endsWith(image.filename.toLowerCase());
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

    return plan;
  });
}
