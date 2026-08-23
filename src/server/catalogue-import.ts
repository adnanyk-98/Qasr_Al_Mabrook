import { readFile } from "node:fs/promises";
import path from "node:path";

import { S3Client, HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { and, eq, sql } from "drizzle-orm";
import sharp from "sharp";

import { db } from "@/db";
import { serverEnv } from "@/config/env";
import {
  categoryTranslations,
  categories,
  homepageSections,
  productCategories,
  productImages,
  productTranslations,
  products,
} from "@/db/schema";
import type { DiscoveryReport } from "@/lib/catalogue-discovery";
import { buildCatalogueImportPlan, generateR2ObjectKey, generateR2PublicUrl, readOriginalProductImageMetadata } from "@/lib/catalogue-import";

function isLocalImageReference(publicUrl: string) {
  if (!publicUrl) return false;
  return /(?:\/catalogue\/|public\/catalogue\/|localhost:|127\.0\.0\.1:)/i.test(publicUrl);
}

async function ensureValidProductDimensions(filePath: string) {
  const buffer = await readFile(filePath);
  const metadata = await sharp(buffer).metadata();
  const width = metadata.width ?? null;
  const height = metadata.height ?? null;

  if (!width || !height || width !== height) {
    throw new Error(`Invalid product/category image dimensions for ${filePath}: ${width ?? "?"}x${height ?? "?"}`);
  }

  return { width, height };
}

async function ensureValidHeroBannerDimensions(filePath: string) {
  const buffer = await readFile(filePath);
  const metadata = await sharp(buffer).metadata();
  const width = metadata.width ?? null;
  const height = metadata.height ?? null;

  if (!width || !height || width !== 1920 || height !== 1080) {
    throw new Error(`Invalid hero banner dimensions for ${filePath}: ${width ?? "?"}x${height ?? "?"}`);
  }

  return { width, height };
}

async function ensureR2Object(s3: S3Client, bucket: string, key: string, body: Buffer) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return false;
  } catch {
    await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body }));
    return true;
  }
}

async function upsertProductImageRow(tx: Parameters<typeof db.transaction>[0] extends (tx: infer T) => unknown ? T : never, productId: string, objectKey: string, publicUrl: string, width: number | null, height: number | null, sortOrder: number, isPrimary: boolean) {
  const existing = await tx
    .select()
    .from(productImages)
    .where(and(eq(productImages.productId, productId), eq(productImages.objectKey, objectKey)))
    .limit(1);

  if (existing[0]) {
    const row = existing[0];
    const updated = await tx
      .update(productImages)
      .set({
        publicUrl,
        width,
        height,
        sortOrder,
        isPrimary,
      })
      .where(eq(productImages.id, row.id))
      .returning();
    return updated[0] ?? row;
  }

  const inserted = await tx
    .insert(productImages)
    .values({
      productId,
      objectKey,
      publicUrl,
      width,
      height,
      sortOrder,
      isPrimary,
    })
    .returning();

  return inserted[0];
}

async function reconcilePrimaryImage(tx: Parameters<typeof db.transaction>[0] extends (tx: infer T) => unknown ? T : never, productId: string, preferredObjectKey?: string) {
  const rows = await tx
    .select()
    .from(productImages)
    .where(eq(productImages.productId, productId))
    .orderBy(sql`sort_order ASC`, sql`created_at ASC`);

  const desiredKey = preferredObjectKey ?? rows[0]?.objectKey ?? null;
  const updates = await Promise.all(
    rows.map(async (row) => {
      const shouldPrimary = row.objectKey === desiredKey;
      if (row.isPrimary !== shouldPrimary) {
        return tx
          .update(productImages)
          .set({ isPrimary: shouldPrimary })
          .where(eq(productImages.id, row.id))
          .returning();
      }
      return [row];
    }),
  );

  const chosen = rows.find((row) => row.objectKey === desiredKey) ?? rows[0] ?? null;
  if (chosen) {
    await tx
      .update(products)
      .set({ primaryImageId: chosen.id })
      .where(eq(products.id, productId));
  }

  return updates.flat();
}

async function assertNoExistingDataConflicts(plan: ReturnType<typeof buildCatalogueImportPlan>) {
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
      .where(and(eq(categoryTranslations.categoryId, existing[0].id), eq(categoryTranslations.locale, "en")))
      .limit(1);
    if (!translation[0] || translation[0].name !== category.name) {
      throw new Error(`Import conflict for category slug "${category.slug}"; existing data is not an exact importer match.`);
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
      .where(and(eq(productTranslations.productId, existing[0].id), eq(productTranslations.locale, "en")))
      .limit(1);
    if (!translation[0] || translation[0].name !== product.name) {
      throw new Error(`Import conflict for product slug "${product.slug}"; existing data is not an exact importer match.`);
    }
  }
}

export async function importLocalCatalogue(report: DiscoveryReport) {
  if (report.manifestErrors.length) {
    throw new Error("Catalogue import refused while manifest errors remain.");
  }

  const { validateR2Configuration } = await import("@/lib/production-readiness");
  const r2Check = validateR2Configuration({
    r2AccountId: serverEnv.R2_ACCOUNT_ID,
    r2AccessKeyId: serverEnv.R2_ACCESS_KEY_ID,
    r2SecretAccessKey: serverEnv.R2_SECRET_ACCESS_KEY,
    r2BucketName: serverEnv.R2_BUCKET_NAME,
    r2PublicBaseUrl: serverEnv.R2_PUBLIC_BASE_URL,
  });
  if (!r2Check.ok) {
    throw new Error(`Refusing local import: R2 configuration invalid: ${r2Check.errors.map((e) => e.key).join(", ")}`);
  }

  const plan = buildCatalogueImportPlan(report);
  const duplicateSlugs = plan.products.filter((product, index, all) => all.findIndex((candidate) => candidate.slug === product.slug) !== index);
  if (duplicateSlugs.length) {
    throw new Error(`Catalogue import refused due to duplicate product slugs: ${duplicateSlugs.map((product) => product.slug).join(", ")}`);
  }

  await assertNoExistingDataConflicts(plan);

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

  const bannerUploads: Array<{ key: string; publicUrl: string; filename: string; width: number; height: number }> = [];
  const invalidProducts: string[] = [];
  const invalidBanners: string[] = [];

  const productImageQueue: Array<{ product: { slug: string; name: string; category: string; primaryImage: string }; image: { filename: string; relativePath: string; sortOrder: number }; sourcePath: string; key: string; publicUrl: string; width: number; height: number }> = [];

  for (const product of plan.products) {
    for (const image of product.images) {
      const sourcePath = path.join(report.source, image.relativePath);
      try {
        const dims = await ensureValidProductDimensions(sourcePath);
        if (dims.width !== dims.height) {
          invalidProducts.push(`${product.category}/${product.name}/${image.filename} (${dims.width}x${dims.height})`);
          continue;
        }
        const key = generateR2ObjectKey(product.slug, image.filename);
        const publicUrl = generateR2PublicUrl(serverEnv.R2_PUBLIC_BASE_URL ?? "", key);
        productImageQueue.push({ product, image, sourcePath, key, publicUrl, width: dims.width, height: dims.height });
      } catch (error) {
        invalidProducts.push(`${product.category}/${product.name}/${image.filename}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  for (const banner of report.banners) {
    const sourcePath = path.join(report.source, banner.relativePath);
    try {
      const dims = await ensureValidHeroBannerDimensions(sourcePath);
      const key = `catalogue/banners/${banner.filename}`;
      const publicUrl = generateR2PublicUrl(serverEnv.R2_PUBLIC_BASE_URL ?? "", key);
      bannerUploads.push({ key, publicUrl, filename: banner.filename, width: dims.width, height: dims.height });
    } catch (error) {
      invalidBanners.push(`${banner.relativePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  for (const item of productImageQueue) {
    const fileBuffer = await readFile(item.sourcePath);
    await ensureR2Object(s3, bucket, item.key, fileBuffer);
  }
  for (const item of bannerUploads) {
    const fileBuffer = await readFile(path.join(report.source, "Banner", item.filename));
    await ensureR2Object(s3, bucket, item.key, fileBuffer);
  }

  await db.transaction(async (transaction) => {
    const categoryIds = new Map<string, string>();
    for (const category of plan.categories) {
      const existing = await transaction.select().from(categories).where(eq(categories.slug, category.slug)).limit(1);
      const record = existing[0] ?? (await transaction.insert(categories).values({ slug: category.slug, status: plan.status }).returning())[0];
      if (!record) throw new Error(`Could not create category: ${category.name}`);
      categoryIds.set(category.name, record.id);

      const translation = await transaction.select().from(categoryTranslations).where(and(eq(categoryTranslations.categoryId, record.id), eq(categoryTranslations.locale, "en"))).limit(1);
      if (!translation[0]) {
        await transaction.insert(categoryTranslations).values({ categoryId: record.id, locale: "en", name: category.name });
      }
    }

    for (const product of plan.products) {
      const existingProduct = await transaction.select().from(products).where(eq(products.slug, product.slug)).limit(1);
      const record = existingProduct[0] ?? (await transaction.insert(products).values({ slug: product.slug, status: plan.status }).returning())[0];
      if (!record) throw new Error(`Could not create product: ${product.name}`);

      const translation = await transaction.select().from(productTranslations).where(and(eq(productTranslations.productId, record.id), eq(productTranslations.locale, "en"))).limit(1);
      if (!translation[0]) {
        await transaction.insert(productTranslations).values({ productId: record.id, locale: "en", name: product.name });
      }

      const categoryId = categoryIds.get(product.category);
      if (!categoryId) throw new Error(`Missing imported category: ${product.category}`);
      const categoryLink = await transaction.select().from(productCategories).where(and(eq(productCategories.productId, record.id), eq(productCategories.categoryId, categoryId))).limit(1);
      if (!categoryLink[0]) {
        await transaction.insert(productCategories).values({ productId: record.id, categoryId, isPrimary: true });
      }

      const productValidImages = productImageQueue.filter((item) => item.product.slug === product.slug);
      const preferredImage = productValidImages.find((item) => item.image.filename === product.primaryImage) ?? productValidImages[0];

      for (const item of productValidImages) {
        const currentImage = await upsertProductImageRow(
          transaction,
          record.id,
          item.key,
          item.publicUrl,
          item.width,
          item.height,
          item.image.sortOrder,
          item.image.filename === preferredImage?.image.filename,
        );

        if (currentImage && item.image.filename === preferredImage?.image.filename) {
          await transaction.update(products).set({ primaryImageId: currentImage.id }).where(eq(products.id, record.id));
        }
      }

      await reconcilePrimaryImage(transaction, record.id, preferredImage?.key);
    }

    const heroSection = await transaction.select().from(homepageSections).where(eq(homepageSections.sectionType, "hero")).limit(1);
    const heroConfig = {
      title: "Homepage hero",
      subtitle: "",
      description: "",
      imageUrl: bannerUploads[0]?.publicUrl ?? "",
      imageAlt: bannerUploads[0]?.filename ?? "Hero banner",
      ctaLabel: "",
      ctaHref: "",
      enabled: true,
    };

    if (heroSection[0]) {
      await transaction.update(homepageSections).set({
        status: "PUBLISHED",
        configurationJson: heroConfig,
        updatedAt: new Date(),
      }).where(eq(homepageSections.id, heroSection[0].id));
    } else {
      await transaction.insert(homepageSections).values({
        sectionType: "hero",
        status: "PUBLISHED",
        sortOrder: "0",
        configurationJson: heroConfig,
      });
    }

    const legacyRows = await transaction.select().from(productImages).where(sql`${productImages.publicUrl} LIKE '%/catalogue/%' OR ${productImages.publicUrl} LIKE '%public/catalogue/%' OR ${productImages.publicUrl} LIKE '%localhost:%' OR ${productImages.publicUrl} LIKE '%127.0.0.1:%'`);
    for (const legacy of legacyRows) {
      const replacementKey = legacy.objectKey;
      const replacementUrl = replacementKey ? generateR2PublicUrl(serverEnv.R2_PUBLIC_BASE_URL ?? "", replacementKey) : legacy.publicUrl;
      if (replacementKey && !isLocalImageReference(legacy.publicUrl) && legacy.publicUrl.startsWith(serverEnv.R2_PUBLIC_BASE_URL ?? "")) {
        continue;
      }
      if (replacementKey && !isLocalImageReference(replacementUrl)) {
        await transaction.update(productImages).set({ publicUrl: replacementUrl }).where(eq(productImages.id, legacy.id));
      }
    }
  });

  return {
    importedProducts: plan.products.length,
    uploadedProductImages: productImageQueue.length,
    uploadedHeroBanners: bannerUploads.length,
    invalidProductImages: invalidProducts.length,
    invalidHeroBanners: invalidBanners.length,
    invalidProductDetails: invalidProducts,
    invalidHeroDetails: invalidBanners,
  };
}
