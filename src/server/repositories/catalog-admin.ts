import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";

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
  homepageDeals,
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
  const totalRows = await db.select({ count: sql<number>`count(*)` }).from(categories).where(whereClause as any);
  const items = await db.select().from(categories).where(whereClause as any).orderBy(asc(categories.sortOrder), asc(categories.createdAt)).limit(pageSize).offset(offset);
  const total = Number(totalRows[0]?.count ?? 0);
  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) || 1 };
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

export async function updateCategory(input: { id: string; slug?: string; parentId?: string | null; status?: "DRAFT" | "PUBLISHED" | "ARCHIVED"; sortOrder?: number }) {
  const rows = await db.update(categories).set({ slug: input.slug, parentId: input.parentId ?? null, status: input.status, sortOrder: input.sortOrder }).where(eq(categories.id, input.id)).returning();
  return rows[0] ?? null;
}

export async function setCategoryImage(input: { categoryId: string; objectKey: string; publicUrl: string; width?: number | null; height?: number | null }) {
  const rows = await db.update(categories).set({ imageObjectKey: input.objectKey, imagePublicUrl: input.publicUrl, imageWidth: input.width ?? null, imageHeight: input.height ?? null }).where(eq(categories.id, input.categoryId)).returning();
  return rows[0] ?? null;
}

export async function getCategoryById(id: string) {
  const rows = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listBrandTranslations() {
  return db.select().from(brandTranslations).orderBy(asc(brandTranslations.locale), asc(brandTranslations.name));
}

export async function listBrands() {
  return db.select().from(brands).orderBy(asc(brands.sortOrder), asc(brands.name), desc(brands.createdAt));
}

export async function getBrandById(id: string) {
  const rows = await db.select().from(brands).where(eq(brands.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createBrand(input: { name: string; slug: string; logoUrl?: string | null; sortOrder?: number; enabled?: boolean; status?: "DRAFT" | "PUBLISHED" | "ARCHIVED"; logoImageId?: string | null }) {
  const rows = await db
    .insert(brands)
    .values({
      name: input.name,
      slug: input.slug,
      logoUrl: input.logoUrl ?? null,
      sortOrder: input.sortOrder ?? 0,
      enabled: input.enabled ?? true,
      status: input.status ?? "PUBLISHED",
      logoImageId: input.logoImageId ?? null,
    })
    .returning();

  return rows[0] ?? null;
}

export async function updateBrand(input: { id: string; name: string; slug: string; logoUrl?: string | null; sortOrder: number; enabled: boolean }) {
  const rows = await db.update(brands).set({ name: input.name, slug: input.slug, logoUrl: input.logoUrl ?? null, sortOrder: input.sortOrder, enabled: input.enabled, status: input.enabled ? "PUBLISHED" : "DRAFT" }).where(eq(brands.id, input.id)).returning();
  return rows[0] ?? null;
}

export async function deleteBrandById(id: string) {
  const referenced = await db.select({ id: products.id }).from(products).where(eq(products.brandId, id)).limit(1);
  if (referenced.length) return { ok: false as const, reason: "Brand is assigned to a product and cannot be deleted. Disable it instead." };
  const rows = await db.delete(brands).where(eq(brands.id, id)).returning();
  return rows[0] ? { ok: true as const, brand: rows[0] } : { ok: false as const, reason: "Brand not found." };
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

async function attachAdminProductImages(items: Array<typeof products.$inferSelect & { name: string }>) {
  const productIds = items.map((product) => product.id);
  const images = productIds.length
    ? await db.select().from(productImages).where(inArray(productImages.productId, productIds))
    : [];

  return items.map((product) => {
    const productImagesForProduct = images.filter((image) => image.productId === product.id);
    const primaryImage = productImagesForProduct.find((image) => image.id === product.primaryImageId) ?? productImagesForProduct.find((image) => image.isPrimary) ?? productImagesForProduct[0];
    return { ...product, primaryImageUrl: primaryImage?.publicUrl ?? null };
  });
}

export async function listHomepageDeals() {
  const rows = await db
    .select({ deal: homepageDeals, product: products, translation: productTranslations })
    .from(homepageDeals)
    .innerJoin(products, eq(homepageDeals.productId, products.id))
    .leftJoin(productTranslations, and(eq(productTranslations.productId, products.id), eq(productTranslations.locale, "en")))
    .orderBy(asc(homepageDeals.sortOrder), asc(homepageDeals.createdAt));
  const productsWithNames = await attachAdminProductImages(rows.map(({ product, translation }) => ({ ...product, name: translation?.name ?? product.slug })));
  const productMap = new Map(productsWithNames.map((product) => [product.id, product]));
  return rows.map(({ deal }) => ({ ...deal, product: productMap.get(deal.productId)! }));
}

export async function getHomepageDealById(id: string) {
  const deals = await listHomepageDeals();
  return deals.find((deal) => deal.id === id) ?? null;
}

export async function getHomepageDealByProductId(productId: string) {
  const deals = await listHomepageDeals();
  return deals.find((deal) => deal.productId === productId) ?? null;
}

export async function createHomepageDeal(input: { productId: string; discountPercent: number; isActive: boolean; sortOrder: number }) {
  const rows = await db.insert(homepageDeals).values(input).returning();
  return rows[0] ?? null;
}

export async function updateHomepageDeal(input: { id: string; productId: string; discountPercent: number; isActive: boolean; sortOrder: number }) {
  const rows = await db.update(homepageDeals).set({ ...input, updatedAt: new Date() }).where(eq(homepageDeals.id, input.id)).returning();
  return rows[0] ?? null;
}

export async function deactivateHomepageDeal(id: string) {
  const rows = await db.update(homepageDeals).set({ isActive: false, updatedAt: new Date() }).where(eq(homepageDeals.id, id)).returning();
  return rows[0] ?? null;
}

export async function listProductsForDealSelector(search = "") {
  const trimmedSearch = search.trim();
  const searchClause = trimmedSearch
    ? sql`(products.slug ILIKE ${"%" + trimmedSearch + "%"} OR products.default_sku ILIKE ${"%" + trimmedSearch + "%"} OR EXISTS (SELECT 1 FROM product_translations pt WHERE pt.product_id = products.id AND pt.locale = 'en' AND pt.name ILIKE ${"%" + trimmedSearch + "%"}))`
    : undefined;
  const rows = await db
    .select({ product: products, translation: productTranslations })
    .from(products)
    .leftJoin(productTranslations, and(eq(productTranslations.productId, products.id), eq(productTranslations.locale, "en")))
    .where(and(eq(products.status, "PUBLISHED"), searchClause as any))
    .orderBy(asc(productTranslations.name), asc(products.slug));
  return attachAdminProductImages(rows.map(({ product, translation }) => ({ ...product, name: translation?.name ?? product.slug })));
}

export async function listProductsPaginated({ page = 1, pageSize = 10, search = "" }: { page?: number; pageSize?: number; search?: string }) {
  const offset = Math.max(0, (page - 1) * pageSize);
  const searchClause = search
    ? sql`(products.slug ILIKE ${"%" + search + "%"} OR products.default_sku ILIKE ${"%" + search + "%"} OR products.id::text ILIKE ${"%" + search + "%"} OR EXISTS (SELECT 1 FROM product_translations pt WHERE pt.product_id = products.id AND pt.name ILIKE ${"%" + search + "%"}))`
    : undefined;
  const totalRows = await db.select({ count: sql<number>`count(*)` }).from(products).where(searchClause as any);
  const items = await db.select().from(products).where(searchClause as any).orderBy(desc(products.createdAt)).limit(pageSize).offset(offset);
  const total = Number(totalRows[0]?.count ?? 0);
  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) || 1 };
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

export async function listProductTranslations() {
  return db.select().from(productTranslations).orderBy(desc(productTranslations.createdAt));
}

export async function listProductTranslationsForProduct(productId: string) {
  return db.select().from(productTranslations).where(eq(productTranslations.productId, productId)).orderBy(asc(productTranslations.locale));
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
  return db.transaction(async (transaction) => {
    const target = await transaction
      .select({ id: productImages.id })
      .from(productImages)
      .where(and(eq(productImages.id, imageId), eq(productImages.productId, productId)))
      .limit(1);
    if (!target[0]) return null;

    await transaction.update(productImages).set({ isPrimary: false }).where(eq(productImages.productId, productId));
    const primaryRows = await transaction
      .update(productImages)
      .set({ isPrimary: true })
      .where(and(eq(productImages.id, imageId), eq(productImages.productId, productId)))
      .returning();
    if (!primaryRows[0]) return null;

    const productRows = await transaction
      .update(products)
      .set({ primaryImageId: imageId })
      .where(eq(products.id, productId))
      .returning();
    if (!productRows[0]) return null;

    return primaryRows[0];
  });
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
  await db.update(productImages).set({ isPrimary: false }).where(eq(productImages.productId, productId));
  const rows = await db.update(productImages).set({ isPrimary: true }).where(and(eq(productImages.id, imageId), eq(productImages.productId, productId))).returning();
  return rows[0] ?? null;
}

export async function updateProductImage(input: { id: string; productId: string; sortOrder?: number; isPrimary?: boolean }) {
  const rows = await db
    .update(productImages)
    .set({
      sortOrder: input.sortOrder ?? productImages.sortOrder,
      isPrimary: input.isPrimary ?? productImages.isPrimary,
    })
    .where(and(eq(productImages.id, input.id), eq(productImages.productId, input.productId)))
    .returning();

  return rows[0] ?? null;
}

export async function listProductImagesForProduct(productId: string) {
  return db.select().from(productImages).where(eq(productImages.productId, productId)).orderBy(asc(productImages.sortOrder), asc(productImages.createdAt), asc(productImages.id));
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
  const rows = await db.update(products).set({ primaryImageId: null }).where(eq(products.id, productId)).returning();
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
  const whereClause = search ? sql`(homepage_sections.section_type ILIKE ${"%" + search + "%"})` : undefined;
  const totalRows = await db.select({ count: sql<number>`count(*)` }).from(homepageSections).where(whereClause as any);
  const items = await db.select().from(homepageSections).where(whereClause as any).orderBy(asc(homepageSections.sortOrder), desc(homepageSections.createdAt)).limit(pageSize).offset(offset);
  const total = Number(totalRows[0]?.count ?? 0);
  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) || 1 };
}

export async function deleteProductById(productId: string) {
  const rows = await db.delete(products).where(eq(products.id, productId)).returning();
  return rows[0] ?? null;
}

export async function deleteCategoryById(categoryId: string) {
  const rows = await db.delete(categories).where(eq(categories.id, categoryId)).returning();
  return rows[0] ?? null;
}

export async function deleteHomepageSectionById(sectionId: string) {
  const rows = await db.delete(homepageSections).where(eq(homepageSections.id, sectionId)).returning();
  return rows[0] ?? null;
}

export async function getHomepageSectionById(id: string) {
  const rows = await db.select().from(homepageSections).where(eq(homepageSections.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function updateHomepageSection(input: { id: string; sectionType?: string; status?: string; sortOrder?: string; configurationJson?: Record<string, unknown> }) {
  const rows = await db.update(homepageSections).set({ sectionType: input.sectionType, status: input.status, sortOrder: input.sortOrder, configurationJson: input.configurationJson }).where(eq(homepageSections.id, input.id)).returning();
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

export async function updateCategoryTranslation(input: { categoryId: string; locale: "en" | "ar"; name: string; description?: string | null; seoTitle?: string | null; seoDescription?: string | null }) {
  const rows = await db
    .update(categoryTranslations)
    .set({
      name: input.name,
      description: input.description ?? null,
      seoTitle: input.seoTitle ?? null,
      seoDescription: input.seoDescription ?? null,
    })
    .where(and(eq(categoryTranslations.categoryId, input.categoryId), eq(categoryTranslations.locale, input.locale)))
    .returning();

  return rows[0] ?? null;
}

export async function upsertCategoryTranslation(input: { categoryId: string; locale: "en" | "ar"; name: string; description?: string | null; seoTitle?: string | null; seoDescription?: string | null }) {
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
    .onConflictDoUpdate({
      target: [categoryTranslations.categoryId, categoryTranslations.locale],
      set: {
        name: input.name,
        description: input.description ?? null,
        seoTitle: input.seoTitle ?? null,
        seoDescription: input.seoDescription ?? null,
      },
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
