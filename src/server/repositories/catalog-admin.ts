import { and, asc, desc, eq, sql } from "drizzle-orm";
import postgres from 'postgres';

import { db } from "@/db";
import {
  attributes,
  attributeTranslations,
  attributeValues,
  brandTranslations,
  brands,
  categories,
  categoryAttributes,
  categoryTranslations,
  homepageSections,
  productCategories,
  productImages,
  productTranslations,
  products,
  quoteRequestItems,
  quoteRequests,
  specificationDefinitions,
  specificationTranslations,
  variantCombinations,
  variantDefinitions,
  variantImages,
} from "@/db/schema";

export async function listCategories() {
  return db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.createdAt));
}

export async function listCategoriesPaginated({ page = 1, pageSize = 10, search = "" }: { page?: number; pageSize?: number; search?: string }) {
  const offset = Math.max(0, (page - 1) * pageSize);

  const whereClause = search
    ? sql`(categories.slug ILIKE ${"%" + search + "%"} OR EXISTS (SELECT 1 FROM category_translations ct WHERE ct.category_id = categories.id AND ct.name ILIKE ${"%" + search + "%"}))`
    : undefined;

  const totalRes = await db.select({ count: sql<number>`count(*)` }).from(categories).where(whereClause as any);
  const total = Number(totalRes?.[0]?.count ?? 0);

  const items = await db
    .select()
    .from(categories)
    .where(whereClause as any)
    .orderBy(asc(categories.sortOrder), asc(categories.createdAt))
    .limit(pageSize)
    .offset(offset);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
  };
}

export async function createCategory(input: { slug: string; status: "DRAFT" | "PUBLISHED" | "ARCHIVED"; parentId?: string | null; sortOrder?: number }) {
  const rows = await db
    .insert(categories)
    .values({
      slug: input.slug,
      status: input.status,
      parentId: input.parentId ?? null,
      sortOrder: input.sortOrder ?? 0,
    })
    .returning();

  return rows[0] ?? null;
}

export async function listBrandTranslations() {
  return db.select().from(brandTranslations).orderBy(asc(brandTranslations.locale), asc(brandTranslations.name));
}

export async function listBrands() {
  return db.select().from(brands).orderBy(desc(brands.createdAt));
}

export async function createBrand(input: { slug: string; status: "DRAFT" | "PUBLISHED" | "ARCHIVED"; logoImageId?: string | null }) {
  const rows = await db
    .insert(brands)
    .values({
      slug: input.slug,
      status: input.status,
      logoImageId: input.logoImageId ?? null,
    })
    .returning();

  return rows[0] ?? null;
}

export async function listAttributes() {
  return db.select().from(attributes).orderBy(asc(attributes.sortOrder), desc(attributes.createdAt));
}

export async function createAttribute(input: { code: string; dataType: "TEXT" | "NUMBER" | "BOOLEAN" | "SELECT" | "MULTI_SELECT" | "COLOR"; isVariantDefining?: boolean; isFilterable?: boolean; isSearchable?: boolean; status?: "DRAFT" | "PUBLISHED" | "ARCHIVED"; sortOrder?: number }) {
  const rows = await db
    .insert(attributes)
    .values({
      code: input.code,
      dataType: input.dataType,
      isVariantDefining: input.isVariantDefining ?? false,
      isFilterable: input.isFilterable ?? false,
      isSearchable: input.isSearchable ?? false,
      status: input.status ?? "DRAFT",
      sortOrder: input.sortOrder ?? 0,
    })
    .returning();

  return rows[0] ?? null;
}

export async function listAttributeValuesByAttribute(attributeId: string) {
  return db
    .select()
    .from(attributeValues)
    .where(eq(attributeValues.attributeId, attributeId))
    .orderBy(asc(attributeValues.sortOrder), asc(attributeValues.code));
}

export async function createAttributeValue(input: { attributeId: string; code: string; rawValue?: string | null; numericValue?: string | null; sortOrder?: number }) {
  const rows = await db
    .insert(attributeValues)
    .values({
      attributeId: input.attributeId,
      code: input.code,
      rawValue: input.rawValue ?? null,
      numericValue: input.numericValue ?? null,
      sortOrder: input.sortOrder ?? 0,
      status: "DRAFT",
    })
    .returning();

  return rows[0] ?? null;
}

export async function listProducts() {
  return db.select().from(products).orderBy(desc(products.createdAt));
}

export async function listProductsPaginated({ page = 1, pageSize = 10, search = "" }: { page?: number; pageSize?: number; search?: string }) {
  const offset = Math.max(0, (page - 1) * pageSize);

  // Build a where clause that searches slug, defaultSku, id, or translation name
  const searchClause = search
    ? sql`(products.slug ILIKE ${"%" + search + "%"} OR products.default_sku ILIKE ${"%" + search + "%"} OR products.id::text ILIKE ${"%" + search + "%"} OR EXISTS (SELECT 1 FROM product_translations pt WHERE pt.product_id = products.id AND pt.name ILIKE ${"%" + search + "%"}))`
    : undefined;

  const totalRes = await db.select({ count: sql<number>`count(*)` }).from(products).where(searchClause as any);
  const total = Number(totalRes?.[0]?.count ?? 0);

  const items = await db
    .select()
    .from(products)
    .where(searchClause as any)
    .orderBy(desc(products.createdAt))
    .limit(pageSize)
    .offset(offset);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
  };
}

export async function getProductById(id: string) {
  const rows = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function updateProduct(input: { id: string; slug?: string; brandId?: string | null; status?: "DRAFT" | "PUBLISHED" | "ARCHIVED"; defaultSku?: string | null }) {
  const rows = await db
    .update(products)
    .set({
      slug: input.slug,
      brandId: input.brandId ?? null,
      status: input.status,
      defaultSku: input.defaultSku ?? null,
    })
    .where(eq(products.id, input.id))
    .returning();
  return rows[0] ?? null;
}

export async function createProduct(input: { slug: string; brandId?: string | null; status: "DRAFT" | "PUBLISHED" | "ARCHIVED"; defaultSku?: string | null }) {
  const rows = await db
    .insert(products)
    .values({
      slug: input.slug,
      brandId: input.brandId ?? null,
      status: input.status,
      defaultSku: input.defaultSku ?? null,
    })
    .returning();

  return rows[0] ?? null;
}

export async function updateCategory(input: { id: string; slug?: string; parentId?: string | null; status?: "DRAFT" | "PUBLISHED" | "ARCHIVED"; sortOrder?: number }) {
  const rows = await db
    .update(categories)
    .set({
      slug: input.slug,
      parentId: input.parentId ?? null,
      status: input.status,
      sortOrder: input.sortOrder ?? 0,
    })
    .where(eq(categories.id, input.id))
    .returning();

  return rows[0] ?? null;
}

export async function setCategoryImage(input: { categoryId: string; objectKey: string; publicUrl: string; width?: number | null; height?: number | null }) {
  const rows = await db
    .update(categories)
    .set({
      imageObjectKey: input.objectKey,
      imagePublicUrl: input.publicUrl,
      imageWidth: input.width ?? null,
      imageHeight: input.height ?? null,
    })
    .where(eq(categories.id, input.categoryId))
    .returning();

  return rows[0] ?? null;
}

export async function getCategoryById(id: string) {
  const rows = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listProductTranslations() {
  return db.select().from(productTranslations).orderBy(desc(productTranslations.createdAt));
}

export async function listProductTranslationsForProduct(productId: string) {
  return db.select().from(productTranslations).where(eq(productTranslations.productId, productId)).orderBy(desc(productTranslations.locale));
}

export async function createProductTranslation(input: { productId: string; locale: "en" | "ar"; name: string; shortDescription?: string | null; description?: string | null; seoTitle?: string | null; seoDescription?: string | null }) {
  const rows = await db
    .insert(productTranslations)
    .values({
      productId: input.productId,
      locale: input.locale,
      name: input.name,
      shortDescription: input.shortDescription ?? null,
      description: input.description ?? null,
      seoTitle: input.seoTitle ?? null,
      seoDescription: input.seoDescription ?? null,
    })
    .returning();

  return rows[0] ?? null;
}

export async function listVariantDefinitions() {
  return db.select().from(variantDefinitions).orderBy(asc(variantDefinitions.sortOrder), asc(variantDefinitions.id));
}

export async function createVariantDefinition(input: { productId: string; attributeId: string; sortOrder?: number }) {
  const rows = await db
    .insert(variantDefinitions)
    .values({
      productId: input.productId,
      attributeId: input.attributeId,
      sortOrder: input.sortOrder ?? 0,
    })
    .returning();

  return rows[0] ?? null;
}

export async function listVariantCombinations() {
  return db.select().from(variantCombinations).orderBy(desc(variantCombinations.createdAt));
}

export async function createVariantCombination(input: { productId: string; sku: string; status?: "DRAFT" | "PUBLISHED" | "ARCHIVED" }) {
  const rows = await db
    .insert(variantCombinations)
    .values({
      productId: input.productId,
      sku: input.sku,
      status: input.status ?? "DRAFT",
    })
    .returning();

  return rows[0] ?? null;
}

export async function listSpecificationDefinitions() {
  return db.select().from(specificationDefinitions).orderBy(asc(specificationDefinitions.sortOrder), asc(specificationDefinitions.code));
}

export async function createSpecificationDefinition(input: { code: string; dataType: "TEXT" | "NUMBER" | "BOOLEAN"; status?: "DRAFT" | "PUBLISHED" | "ARCHIVED"; sortOrder?: number }) {
  const rows = await db
    .insert(specificationDefinitions)
    .values({
      code: input.code,
      dataType: input.dataType,
      status: input.status ?? "DRAFT",
      sortOrder: input.sortOrder ?? 0,
    })
    .returning();

  return rows[0] ?? null;
}

export async function listProductImages() {
  return db.select().from(productImages).orderBy(desc(productImages.createdAt));
}

export async function setProductPrimaryImage(productId: string, imageId: string) {
  const rows = await db
    .update(products)
    .set({
      primaryImageId: imageId,
    })
    .where(eq(products.id, productId))
    .returning();

  return rows[0] ?? null;
}

export async function createProductImage(input: { productId: string; objectKey: string; publicUrl: string; altTextEn?: string | null; altTextAr?: string | null; width?: number | null; height?: number | null; sortOrder?: number; isPrimary?: boolean }) {
  const rows = await db
    .insert(productImages)
    .values({
      productId: input.productId,
      objectKey: input.objectKey,
      publicUrl: input.publicUrl,
      altTextEn: input.altTextEn ?? null,
      altTextAr: input.altTextAr ?? null,
      width: input.width ?? null,
      height: input.height ?? null,
      sortOrder: input.sortOrder ?? 0,
      isPrimary: input.isPrimary ?? false,
    })
    .returning();

  return rows[0] ?? null;
}

export async function setProductImagePrimary(productId: string, imageId: string) {
  // set is_primary = false for all images of this product, then set true for given image
  await db
    .update(productImages)
    .set({ isPrimary: false })
    .where(eq(productImages.productId, productId as any));

  const rows = await db
    .update(productImages)
    .set({ isPrimary: true })
    .where(eq(productImages.id, imageId))
    .returning();

  return rows[0] ?? null;
}

export async function listProductImagesForProduct(productId: string) {
  return db.select().from(productImages).where(eq(productImages.productId, productId)).orderBy(asc(productImages.sortOrder), asc(productImages.createdAt));
}

export async function getProductImageById(id: string) {
  const rows = await db.select().from(productImages).where(eq(productImages.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function deleteProductImageById(id: string) {
  const rows = await db.delete(productImages).where(eq(productImages.id, id)).returning();
  return rows[0] ?? null;
}

export async function clearProductPrimaryImage(productId: string) {
  const rows = await db.update(products).set({ primaryImageId: null as any }).where(eq(products.id, productId)).returning();
  return rows[0] ?? null;
}

export async function listVariantImages() {
  return db.select().from(variantImages).orderBy(desc(variantImages.createdAt));
}

export async function createVariantImage(input: { variantCombinationId: string; objectKey: string; publicUrl: string; altTextEn?: string | null; altTextAr?: string | null; width?: number | null; height?: number | null; sortOrder?: number; isPrimary?: boolean }) {
  const rows = await db
    .insert(variantImages)
    .values({
      variantCombinationId: input.variantCombinationId,
      objectKey: input.objectKey,
      publicUrl: input.publicUrl,
      altTextEn: input.altTextEn ?? null,
      altTextAr: input.altTextAr ?? null,
      width: input.width ?? null,
      height: input.height ?? null,
      sortOrder: input.sortOrder ?? 0,
      isPrimary: input.isPrimary ?? false,
    })
    .returning();

  return rows[0] ?? null;
}

export async function listHomepageSections() {
  return db.select().from(homepageSections).orderBy(asc(homepageSections.sortOrder), desc(homepageSections.createdAt));
}

export async function listHomepageSectionsPaginated({ page = 1, pageSize = 10, search = "" }: { page?: number; pageSize?: number; search?: string }) {
  const offset = Math.max(0, (page - 1) * pageSize);

  const whereClause = search
    ? sql`(homepage_sections.section_type ILIKE ${"%" + search + "%"} OR (homepage_sections.configuration_json->>'title') ILIKE ${"%" + search + "%"})`
    : undefined;

  const totalRes = await db.select({ count: sql<number>`count(*)` }).from(homepageSections).where(whereClause as any);
  const total = Number(totalRes?.[0]?.count ?? 0);

  const items = await db
    .select()
    .from(homepageSections)
    .where(whereClause as any)
    .orderBy(asc(homepageSections.sortOrder), desc(homepageSections.createdAt))
    .limit(pageSize)
    .offset(offset);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
  };
}

// Deletion helpers with safety checks
import { serverEnv } from "@/config/env";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

async function deleteR2ObjectIfConfigured(objectKey?: string | null) {
  if (!objectKey) return;
  const r2AccountId = serverEnv.R2_ACCOUNT_ID;
  const bucket = serverEnv.R2_BUCKET_NAME;
  if (!r2AccountId || !bucket) return;
  const endpoint = `https://${r2AccountId}.r2.cloudflarestorage.com`;
  const s3 = new S3Client({ region: "auto", endpoint, credentials: { accessKeyId: serverEnv.R2_ACCESS_KEY_ID ?? "", secretAccessKey: serverEnv.R2_SECRET_ACCESS_KEY ?? "" } });
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: objectKey }));
  } catch (e: any) {
    console.error("R2 delete error", e?.message ?? e);
  }
}

export async function deleteProductById(productId: string) {
  return db.transaction(async (tx) => {
    const imgs = await tx.select().from(productImages).where(eq(productImages.productId, productId));
    for (const img of imgs) {
      await deleteR2ObjectIfConfigured(img.objectKey);
    }

    // Delete product (DB has cascade FKs for associated records)
    const rows = await tx.delete(products).where(eq(products.id, productId)).returning();
    return rows[0] ?? null;
  });
}

export async function deleteCategoryById(categoryId: string) {
  // Prevent deletion if child categories or product relationships exist
  const child = await db.select().from(categories).where(eq(categories.parentId, categoryId)).limit(1);
  if (child.length > 0) return { ok: false, reason: "HAS_CHILD" } as const;

  const rel = await db.select().from(productCategories).where(eq(productCategories.categoryId, categoryId)).limit(1);
  if (rel.length > 0) return { ok: false, reason: "IN_USE" } as const;

  // safe to delete: remove image object if present
  const cat = await db.select().from(categories).where(eq(categories.id, categoryId)).limit(1);
  const c = cat[0];
  if (c?.imageObjectKey) {
    await deleteR2ObjectIfConfigured(c.imageObjectKey);
  }

  const rows = await db.delete(categories).where(eq(categories.id, categoryId)).returning();
  return { ok: true, deleted: rows[0] ?? null } as const;
}

export async function deleteHomepageSectionById(sectionId: string) {
  // Deleting a homepage section; do not log connection details or credentials here.

  // Perform deletion inside a transaction and verify within the same tx that the row is removed.
  const result = await db.transaction(async (tx) => {
    const rows = await tx.select().from(homepageSections).where(eq(homepageSections.id, sectionId)).limit(1);
    const section = rows[0];
    if (!section) return null;
    const cfg = section.configurationJson as Record<string, unknown> | null;
    const imageUrl = typeof cfg?.imageUrl === "string" ? cfg.imageUrl : null;

    if (imageUrl) {
      // Check other sections referencing same imageUrl
      const refs = await tx.select().from(homepageSections).where(sql`(configuration_json->>'imageUrl') = ${imageUrl} AND id != ${sectionId}`);
      if (refs.length === 0) {
        // try to delete R2 object from URL (best-effort; do not fail delete if R2 cleanup errors)
        try {
          const objectKey = imageUrl.split("/").pop();
          if (objectKey) await deleteR2ObjectIfConfigured(objectKey);
        } catch (e) {
          // ignore R2 deletion errors here; do not mask DB delete issues
        }
      }
    }

    const deleted = await tx.delete(homepageSections).where(eq(homepageSections.id, sectionId)).returning();

    // Verify within the same transaction that the row no longer exists
    const chk = await tx.select({ count: sql<number>`count(*)` }).from(homepageSections).where(eq(homepageSections.id, sectionId));
    const remaining = Number(chk?.[0]?.count ?? 0);
    // eslint-disable-next-line no-console
    console.log(`homepage.delete(in-tx): id=${sectionId} deletedCount=${deleted.length} remainingInTx=${remaining}`);
    if (remaining !== 0) {
      throw new Error(`homepage.delete: deletion did not remove row within transaction (remaining=${remaining})`);
    }

    return deleted[0] ?? null;
  });

  // Post-commit: double-check using a fresh connection to the primary DB (DIRECT_DATABASE_URL) when available
  try {
    let postRemaining = 0;
    const direct = process.env.DIRECT_DATABASE_URL;
    if (direct) {
      try {
        const client = postgres(direct, { ssl: 'require' });
        const rows = await client`select count(*) as cnt from homepage_sections where id = ${sectionId}`;
        postRemaining = Number(rows?.[0]?.cnt ?? 0);
        await client.end();
      } catch (inner) {
        // fallback to global db if direct check fails
        const postChk = await db.select({ count: sql<number>`count(*)` }).from(homepageSections).where(eq(homepageSections.id, sectionId));
        postRemaining = Number(postChk?.[0]?.count ?? 0);
      }
    } else {
      const postChk = await db.select({ count: sql<number>`count(*)` }).from(homepageSections).where(eq(homepageSections.id, sectionId));
      postRemaining = Number(postChk?.[0]?.count ?? 0);
    }
    // eslint-disable-next-line no-console
    console.log(`homepage.delete(post-commit): id=${sectionId} remainingAfterCommit=${postRemaining}`);
    if (postRemaining !== 0) {
      throw new Error(`homepage.delete: row still present after commit (remaining=${postRemaining})`);
    }
  } catch (e) {
    // If verification fails, surface an error so the API does not return success
    throw e;
  }

  return result;
}

export async function getHomepageSectionById(id: string) {
  const rows = await db.select().from(homepageSections).where(eq(homepageSections.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function updateHomepageSection(input: {
  id: string;
  sectionType?: string;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  sortOrder?: string;
  configurationJson?: Record<string, unknown>;
}) {
  const rows = await db
    .update(homepageSections)
    .set({
      sectionType: input.sectionType,
      status: input.status,
      sortOrder: input.sortOrder,
      configurationJson: input.configurationJson,
    })
    .where(eq(homepageSections.id, input.id))
    .returning();

  return rows[0] ?? null;
}

export async function createHomepageSection(input: { sectionType: string; status?: string; sortOrder?: string; configurationJson?: Record<string, unknown> }) {
  const rows = await db
    .insert(homepageSections)
    .values({
      sectionType: input.sectionType,
      status: input.status ?? "DRAFT",
      sortOrder: input.sortOrder ?? "0",
      configurationJson: input.configurationJson ?? {},
    })
    .returning();

  return rows[0] ?? null;
}

export async function listQuoteRequests() {
  return db.select().from(quoteRequests).orderBy(desc(quoteRequests.createdAt));
}

export async function listQuoteRequestItems() {
  return db.select().from(quoteRequestItems).orderBy(desc(quoteRequestItems.id));
}

export async function listCategoryTranslations() {
  return db.select().from(categoryTranslations).orderBy(desc(categoryTranslations.createdAt));
}

export async function createCategoryTranslation(input: { categoryId: string; locale: "en" | "ar"; name: string; description?: string | null; seoTitle?: string | null; seoDescription?: string | null }) {
  const rows = await db
    .insert(categoryTranslations)
    .values({
      categoryId: input.categoryId,
      locale: input.locale,
      name: input.name,
      description: input.description ?? null,
      seoTitle: input.seoTitle ?? null,
      seoDescription: input.seoDescription ?? null,
    })
    .returning();

  return rows[0] ?? null;
}

export async function listSpecificationTranslations() {
  return db.select().from(specificationTranslations).orderBy(asc(specificationTranslations.locale), asc(specificationTranslations.name));
}

export async function createSpecificationTranslation(input: { specificationDefinitionId: string; locale: "en" | "ar"; name: string }) {
  const rows = await db
    .insert(specificationTranslations)
    .values({
      specificationDefinitionId: input.specificationDefinitionId,
      locale: input.locale,
      name: input.name,
    })
    .returning();

  return rows[0] ?? null;
}

export async function listAttributeTranslations() {
  return db.select().from(attributeTranslations).orderBy(asc(attributeTranslations.locale), asc(attributeTranslations.name));
}

export async function createAttributeTranslation(input: { attributeId: string; locale: "en" | "ar"; name: string }) {
  const rows = await db
    .insert(attributeTranslations)
    .values({
      attributeId: input.attributeId,
      locale: input.locale,
      name: input.name,
    })
    .returning();

  return rows[0] ?? null;
}

export async function listCategoryAttributes() {
  return db.select().from(categoryAttributes).orderBy(asc(categoryAttributes.sortOrder));
}

export async function createCategoryAttribute(input: { categoryId: string; attributeId: string; isRequired?: boolean; sortOrder?: number }) {
  const rows = await db
    .insert(categoryAttributes)
    .values({
      categoryId: input.categoryId,
      attributeId: input.attributeId,
      isRequired: input.isRequired ?? false,
      sortOrder: input.sortOrder ?? 0,
    })
    .returning();

  return rows[0] ?? null;
}

export async function listProductCategories() {
  return db.select().from(productCategories).orderBy(desc(productCategories.productId));
}

export async function createProductCategory(input: { productId: string; categoryId: string; isPrimary?: boolean }) {
  const rows = await db
    .insert(productCategories)
    .values({
      productId: input.productId,
      categoryId: input.categoryId,
      isPrimary: input.isPrimary ?? false,
    })
    .returning();

  return rows[0] ?? null;
}
