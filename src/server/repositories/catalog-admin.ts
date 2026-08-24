import { and, asc, desc, eq, sql } from "drizzle-orm";

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
