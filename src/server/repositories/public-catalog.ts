import { and, asc, desc, eq, exists, ilike, inArray, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { type Locale } from "@/lib/locales";
import {
  attributeTranslations,
  attributeValueTranslations,
  attributeValues,
  attributes,
  brandTranslations,
  categories,
  categoryTranslations,
  homepageSections,
  homepageDeals,
  productAttributeValues,
  productCategories,
  productImages,
  productSpecifications,
  productTranslations,
  products,
  specificationDefinitions,
  specificationTranslations,
  staticPageTranslations,
  staticPages,
  variantCombinationValues,
  variantCombinations,
  variantDefinitions,
  brands,
} from "@/db/schema";

export async function getPublishedBrands(locale: Locale) {
  const publishedBrands = await db
    .select({ id: brands.id, baseName: brands.name, logoUrl: brands.logoUrl, sortOrder: brands.sortOrder })
    .from(brands)
    .where(and(eq(brands.enabled, true), eq(brands.status, "PUBLISHED")))
    .orderBy(asc(brands.sortOrder), asc(brands.name));
  const brandIds = publishedBrands.map((brand) => brand.id);
  const translations = brandIds.length
    ? await db.select().from(brandTranslations).where(inArray(brandTranslations.brandId, brandIds))
    : [];

  return publishedBrands.map((brand) => {
    const candidates = translations.filter((translation) => translation.brandId === brand.id);
    const translation = candidates.find((candidate) => candidate.locale === locale) ?? candidates.find((candidate) => candidate.locale === "en");
    return { id: brand.id, name: translation?.name ?? brand.baseName, logoUrl: brand.logoUrl };
  });
}

export async function listPublishedHomepageSections() {
  return db
    .select()
    .from(homepageSections)
    .where(eq(homepageSections.status, "PUBLISHED"))
    .orderBy(asc(homepageSections.sortOrder), desc(homepageSections.createdAt));
}

export async function listPublishedHomepageDeals(locale: Locale, limit = 3) {
  const rows = await db
    .select({ deal: homepageDeals, product: products })
    .from(homepageDeals)
    .innerJoin(products, eq(homepageDeals.productId, products.id))
    .where(and(eq(homepageDeals.isActive, true), eq(products.status, "PUBLISHED")))
    .orderBy(asc(homepageDeals.sortOrder), asc(homepageDeals.createdAt))
    .limit(limit);

  const productIds = rows.map(({ product }) => product.id);
  const translations = productIds.length
    ? await db.select().from(productTranslations).where(inArray(productTranslations.productId, productIds))
    : [];
  const localizedProducts = rows.map(({ deal, product }) => {
    const candidates = translations.filter((translation) => translation.productId === product.id);
    const translation = candidates.find((candidate) => candidate.locale === locale) ?? candidates.find((candidate) => candidate.locale === "en");
    return { ...product, name: translation?.name ?? product.slug, deal };
  });
  const withImages = await attachPrimaryImages(localizedProducts, locale);

  return withImages.map(({ deal, ...product }) => ({
    ...deal,
    product,
  }));
}

export async function getPublishedStaticPage(locale: Locale, slug: string) {
  const page = await db.select().from(staticPages).where(and(eq(staticPages.slug, slug), eq(staticPages.status, "PUBLISHED"))).limit(1);
  const staticPage = page[0];
  if (!staticPage) return null;

  const translations = await db.select().from(staticPageTranslations).where(eq(staticPageTranslations.staticPageId, staticPage.id));
  const translation = translations.find((candidate) => candidate.locale === locale) ?? translations.find((candidate) => candidate.locale === "en");
  if (!translation) return null;

  return {
    ...staticPage,
    title: translation.title,
    body: translation.body,
    seoTitle: translation.seoTitle ?? null,
    seoDescription: translation.seoDescription ?? null,
  };
}

async function attachPrimaryImages<T extends { primaryImageId: string | null }>(items: T[], locale: Locale) {
  const productIds = items.map((i) => (i as unknown as { id?: string }).id).filter(Boolean) as string[];
  const imageIds = items.flatMap((item) => (item.primaryImageId ? [item.primaryImageId] : []));

  // Fetch any images referenced by id, and also fetch product-level primary images
  const imageRows = (await db
    .select({
      id: productImages.id,
      publicUrl: productImages.publicUrl,
      altTextEn: productImages.altTextEn,
      altTextAr: productImages.altTextAr,
      width: productImages.width,
      height: productImages.height,
      productId: productImages.productId,
      isPrimary: productImages.isPrimary,
    })
    .from(productImages)
    .where(or(inArray(productImages.id, imageIds), and(inArray(productImages.productId, productIds), eq(productImages.isPrimary, true))))) ?? [];

  const imageMap = new Map(imageRows.map((image) => [image.id, image]));
  const primaryByProduct = new Map(imageRows.filter((r) => r.isPrimary).map((r) => [r.productId, r]));

  return items.map((item: T) => {
    const anyItem = item as unknown as { id: string; primaryImageId?: string | null };
    const image = anyItem.primaryImageId ? imageMap.get(anyItem.primaryImageId) : undefined;
    const fallback = primaryByProduct.get(anyItem.id);

    const chosen = image ?? fallback;
    return {
      ...item,
      primaryImageUrl: chosen?.publicUrl ?? null,
      primaryImageAlt: chosen ? (locale === "ar" ? chosen.altTextAr ?? chosen.altTextEn : chosen.altTextEn ?? chosen.altTextAr) : null,
      primaryImageWidth: chosen?.width ?? null,
      primaryImageHeight: chosen?.height ?? null,
    } as T & {
      primaryImageUrl: string | null;
      primaryImageAlt: string | null;
      primaryImageWidth: number | null;
      primaryImageHeight: number | null;
    };
  });
}

async function localizeProductRows(rows: Array<{ product: typeof products.$inferSelect; translation: typeof productTranslations.$inferSelect | null }>, locale: Locale) {
  const productIds = rows.map(({ product }) => product.id);
  const translations = productIds.length
    ? await db.select().from(productTranslations).where(inArray(productTranslations.productId, productIds))
    : [];
  const translationMap = new Map<string, typeof translations>();

  for (const translation of translations) {
    const current = translationMap.get(translation.productId) ?? [];
    current.push(translation);
    translationMap.set(translation.productId, current);
  }

  const localized = rows.map(({ product }) => {
    const candidates = translationMap.get(product.id) ?? [];
    const translation = candidates.find((candidate) => candidate.locale === locale) ?? candidates.find((candidate) => candidate.locale === "en");
    return {
      ...product,
      name: translation?.name ?? "Untitled product",
      shortDescription: translation?.shortDescription ?? null,
    };
  });

  return attachPrimaryImages(localized, locale);
}

export async function listPublishedCategories(locale: Locale) {
  const categoryRows = await db.select().from(categories).where(eq(categories.status, "PUBLISHED")).orderBy(asc(categories.sortOrder), asc(categories.slug));
  const categoryIds = categoryRows.map((category) => category.id);
  const translations = categoryIds.length
    ? await db.select().from(categoryTranslations).where(inArray(categoryTranslations.categoryId, categoryIds))
    : [];

  return categoryRows.map((category) => {
    const candidates = translations.filter((translation) => translation.categoryId === category.id);
    const translation = candidates.find((candidate) => candidate.locale === locale) ?? candidates.find((candidate) => candidate.locale === "en");
    return { ...category, name: translation?.name ?? category.slug, description: translation?.description ?? null };
  });
}

export async function getCategoryBySlug(locale: Locale, slug: string) {
  const rows = await db
    .select({
      category: categories,
      translation: categoryTranslations,
    })
    .from(categories)
    .leftJoin(categoryTranslations, and(eq(categories.id, categoryTranslations.categoryId), eq(categoryTranslations.locale, locale)))
    .where(and(eq(categories.slug, slug), eq(categories.status, "PUBLISHED")))
    .limit(1);

  if (rows[0]?.translation) {
    return {
      ...rows[0].category,
      name: rows[0].translation.name,
      description: rows[0].translation.description ?? null,
      seoTitle: rows[0].translation.seoTitle ?? null,
      seoDescription: rows[0].translation.seoDescription ?? null,
    };
  }

  const fallback = await db
    .select({
      category: categories,
      translation: categoryTranslations,
    })
    .from(categories)
    .leftJoin(categoryTranslations, and(eq(categories.id, categoryTranslations.categoryId), eq(categoryTranslations.locale, "en")))
    .where(and(eq(categories.slug, slug), eq(categories.status, "PUBLISHED")))
    .limit(1);

  if (!fallback[0]?.translation) {
    return null;
  }

  return {
    ...fallback[0].category,
    name: fallback[0].translation.name,
    description: fallback[0].translation.description ?? null,
    seoTitle: fallback[0].translation.seoTitle ?? null,
    seoDescription: fallback[0].translation.seoDescription ?? null,
  };
}

export async function listCategoryProducts(locale: Locale, categoryId: string) {
  const rows = await db
    .select({
      product: products,
      translation: productTranslations,
    })
    .from(productCategories)
    .innerJoin(products, eq(productCategories.productId, products.id))
    .leftJoin(productTranslations, and(eq(productTranslations.productId, products.id), eq(productTranslations.locale, locale)))
    .where(and(eq(productCategories.categoryId, categoryId), eq(products.status, "PUBLISHED")))
    .orderBy(desc(products.createdAt), asc(products.id));

  return localizeProductRows(rows, locale);
}

export async function listPublishedProducts(locale: Locale, options?: { categoryId?: string; search?: string; limit?: number }) {
  const categoryId = options?.categoryId;
  const search = options?.search?.trim();

  if (categoryId) {
    const rows = await db
      .select({
        product: products,
        translation: productTranslations,
      })
      .from(productCategories)
      .innerJoin(products, eq(productCategories.productId, products.id))
      .leftJoin(productTranslations, and(eq(productTranslations.productId, products.id), eq(productTranslations.locale, locale)))
      .where(and(eq(productCategories.categoryId, categoryId), eq(products.status, "PUBLISHED")))
      .orderBy(desc(products.createdAt), asc(products.id))
      .limit(options?.limit ?? 40);

    return localizeProductRows(rows, locale);
  }

  const baseQuery = db
    .select({
      product: products,
      translation: productTranslations,
    })
    .from(products)
    .leftJoin(productTranslations, and(eq(productTranslations.productId, products.id), eq(productTranslations.locale, locale)))
    .where(eq(products.status, "PUBLISHED"));

  const rows = search
    ? await db
        .select({
          product: products,
          translation: productTranslations,
        })
        .from(products)
        .leftJoin(productTranslations, eq(productTranslations.productId, products.id))
        .where(and(eq(products.status, "PUBLISHED"), or(ilike(productTranslations.name, `%${search}%`), ilike(products.slug, `%${search}%`))))
        .orderBy(desc(products.createdAt), asc(products.id))
        .limit(options?.limit ?? 40)
    : await baseQuery.orderBy(desc(products.createdAt), asc(products.id)).limit(options?.limit ?? 40);

  return localizeProductRows(rows, locale);
}

export async function getProductBySlug(locale: Locale, slug: string) {
  const row = await db
    .select({
      product: products,
      translation: productTranslations,
      brand: brandTranslations,
    })
    .from(products)
    .leftJoin(productTranslations, and(eq(productTranslations.productId, products.id), eq(productTranslations.locale, locale)))
    .leftJoin(brandTranslations, and(eq(brandTranslations.brandId, products.brandId ?? ""), eq(brandTranslations.locale, locale)))
    .where(and(eq(products.slug, slug), eq(products.status, "PUBLISHED")))
    .limit(1);

  const result = row[0];

  if (result?.translation) {
    const brandName = result.product.brandId
      ? result.brand?.name ?? (await db
          .select({ name: brandTranslations.name })
          .from(brandTranslations)
          .where(and(eq(brandTranslations.brandId, result.product.brandId), eq(brandTranslations.locale, "en")))
          .limit(1))[0]?.name ?? null
      : null;

    return {
      ...result.product,
      name: result.translation.name,
      shortDescription: result.translation.shortDescription ?? null,
      description: result.translation.description ?? null,
      seoTitle: result.translation.seoTitle ?? null,
      seoDescription: result.translation.seoDescription ?? null,
      brandName,
    };
  }

  const fallback = await db
    .select({
      product: products,
      translation: productTranslations,
      brand: brandTranslations,
    })
    .from(products)
    .leftJoin(productTranslations, and(eq(productTranslations.productId, products.id), eq(productTranslations.locale, "en")))
    .leftJoin(brandTranslations, and(eq(brandTranslations.brandId, products.brandId ?? ""), eq(brandTranslations.locale, "en")))
    .where(and(eq(products.slug, slug), eq(products.status, "PUBLISHED")))
    .limit(1);

  const fallbackResult = fallback[0];

  if (!fallbackResult?.translation) {
    return null;
  }

  return {
    ...fallbackResult.product,
    name: fallbackResult.translation.name,
    shortDescription: fallbackResult.translation.shortDescription ?? null,
    description: fallbackResult.translation.description ?? null,
    seoTitle: fallbackResult.translation.seoTitle ?? null,
    seoDescription: fallbackResult.translation.seoDescription ?? null,
    brandName: fallbackResult.brand?.name ?? null,
  };
}

export async function listProductImagesForPublic(productId: string) {
  return db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, productId))
    .orderBy(asc(productImages.sortOrder), desc(productImages.createdAt), asc(productImages.id));
}

export async function listProductVariantGroups(productId: string, locale: Locale) {
  const definitions = await db
    .select({
      definition: variantDefinitions,
      attribute: attributes,
    })
    .from(variantDefinitions)
    .innerJoin(attributes, eq(variantDefinitions.attributeId, attributes.id))
    .where(eq(variantDefinitions.productId, productId))
    .orderBy(asc(variantDefinitions.sortOrder), asc(attributes.code));
  const attributeIds = definitions.map(({ attribute }) => attribute.id);
  const translations = attributeIds.length
    ? await db.select().from(attributeTranslations).where(inArray(attributeTranslations.attributeId, attributeIds))
    : [];

  return definitions.map(({ definition, attribute }) => {
    const candidates = translations.filter((translation) => translation.attributeId === attribute.id);
    const translation = candidates.find((candidate) => candidate.locale === locale) ?? candidates.find((candidate) => candidate.locale === "en");
    return {
    id: definition.id,
    attributeId: attribute.id,
    attributeCode: attribute.code,
    attributeName: translation?.name ?? attribute.code,
    };
  });
}

export async function listVariantCombinationsForProduct(productId: string) {
  return db
    .select()
    .from(variantCombinations)
    .where(and(eq(variantCombinations.productId, productId), eq(variantCombinations.status, "PUBLISHED")))
    .orderBy(asc(variantCombinations.sku));
}

export async function listVariantCombinationValuesForProduct(productId: string, locale: Locale) {
  const rows = await db
    .select({
      combinationId: variantCombinations.id,
      attributeId: variantCombinationValues.attributeId,
      valueId: variantCombinationValues.attributeValueId,
      code: attributeValues.code,
    })
    .from(variantCombinations)
    .innerJoin(variantCombinationValues, eq(variantCombinationValues.variantCombinationId, variantCombinations.id))
    .innerJoin(attributeValues, eq(attributeValues.id, variantCombinationValues.attributeValueId))
    .where(and(eq(variantCombinations.productId, productId), eq(variantCombinations.status, "PUBLISHED")));
  const valueIds = rows.map((row) => row.valueId);
  const translations = valueIds.length
    ? await db.select().from(attributeValueTranslations).where(inArray(attributeValueTranslations.attributeValueId, valueIds))
    : [];

  return rows.map((row) => ({
    ...row,
    label: translations.find((translation) => translation.attributeValueId === row.valueId && translation.locale === locale)?.label
      ?? translations.find((translation) => translation.attributeValueId === row.valueId && translation.locale === "en")?.label
      ?? row.code,
  }));
}

export function isRelatedProductEligible(product: { id: string; status: string; categoryIds: string[] }, currentProductId: string, categoryIds: Set<string>) {
  if (product.id === currentProductId) return false;
  if (product.status !== "PUBLISHED") return false;
  if (!product.categoryIds.length) return false;
  return product.categoryIds.some((categoryId) => categoryIds.has(categoryId));
}

export async function listRelatedProducts(locale: Locale, currentProductId: string, categoryIds: string[]) {
  if (categoryIds.length === 0) {
    return [];
  }

  const uniqueCategoryIds = [...new Set(categoryIds)];
  const rows = await db
    .select({
      product: products,
      translation: productTranslations,
      categoryId: productCategories.categoryId,
    })
    .from(productCategories)
    .innerJoin(products, eq(productCategories.productId, products.id))
    .leftJoin(productTranslations, and(eq(productTranslations.productId, products.id), eq(productTranslations.locale, locale)))
    .where(and(eq(products.status, "PUBLISHED"), inArray(productCategories.categoryId, uniqueCategoryIds)))
    .orderBy(desc(products.createdAt), asc(products.id));

  const seen = new Set<string>();
  const eligible = rows.filter(({ product, categoryId }) => {
    if (product.id === currentProductId) return false;
    if (seen.has(product.id)) return false;
    seen.add(product.id);
    return categoryId && uniqueCategoryIds.includes(categoryId);
  });

  return localizeProductRows(eligible, locale);
}

export async function searchPublishedProducts(locale: Locale, query: string) {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const trimmed = query.trim();

  const rows = await db
    .select({
      product: products,
      translation: sql<null>`NULL`,
    })
    .from(products)
    .where(
      and(
        eq(products.status, "PUBLISHED"),
        or(
          ilike(products.slug, `%${trimmed}%`),
          exists(
            db
              .select({ id: productTranslations.id })
              .from(productTranslations)
              .where(
                and(
                  eq(productTranslations.productId, products.id),
                  inArray(productTranslations.locale, [locale, "en"]),
                  ilike(productTranslations.name, `%${trimmed}%`),
                ),
              ),
          ),
        ),
      ),
    )
    .orderBy(desc(products.createdAt), asc(products.id))
    .limit(20);

  return localizeProductRows(rows, locale);
}

export async function listProductCategoriesForProduct(productId: string, locale: Locale) {
  const rows = await db
    .select({
      category: categories,
    })
    .from(productCategories)
    .innerJoin(categories, eq(productCategories.categoryId, categories.id))
    .where(and(eq(productCategories.productId, productId), eq(categories.status, "PUBLISHED")))
    .orderBy(asc(categories.sortOrder));
  const categoryIds = rows.map(({ category }) => category.id);
  const translations = categoryIds.length
    ? await db.select().from(categoryTranslations).where(inArray(categoryTranslations.categoryId, categoryIds))
    : [];

  return rows.map(({ category }) => {
    const candidates = translations.filter((translation) => translation.categoryId === category.id);
    const translation = candidates.find((candidate) => candidate.locale === locale) ?? candidates.find((candidate) => candidate.locale === "en");
    return { category, translation: translation ?? null };
  });
}

export async function listFilterableAttributes(locale: Locale) {
  const attributeRows = await db
    .select({
      attribute: attributes,
    })
    .from(attributes)
    .where(and(eq(attributes.status, "PUBLISHED"), eq(attributes.isFilterable, true)))
    .orderBy(asc(attributes.sortOrder), asc(attributes.code));
  const attributeIds = attributeRows.map(({ attribute }) => attribute.id);
  const translations = attributeIds.length
    ? await db.select().from(attributeTranslations).where(inArray(attributeTranslations.attributeId, attributeIds))
    : [];

  const allOptionRows = attributeIds.length
    ? await db
        .select({ id: attributeValues.id, attributeId: attributeValues.attributeId, code: attributeValues.code, sortOrder: attributeValues.sortOrder })
        .from(attributeValues)
        .where(inArray(attributeValues.attributeId, attributeIds))
        .orderBy(asc(attributeValues.sortOrder), asc(attributeValues.code))
    : [];
  const optionIds = allOptionRows.map((option) => option.id);
  const optionTranslations = optionIds.length
    ? await db.select().from(attributeValueTranslations).where(inArray(attributeValueTranslations.attributeValueId, optionIds))
    : [];

  const result = attributeRows.map(({ attribute }) => {
      const optionRows = allOptionRows.filter((option) => option.attributeId === attribute.id);
      const attributeCandidates = translations.filter((translation) => translation.attributeId === attribute.id);
      const attributeTranslation = attributeCandidates.find((translation) => translation.locale === locale) ?? attributeCandidates.find((translation) => translation.locale === "en");

      return {
        attributeId: attribute.id,
        attributeCode: attribute.code,
        attributeName: attributeTranslation?.name ?? attribute.code,
        options: optionRows.map((option) => ({
          valueId: option.id,
          valueCode: option.code,
          label: optionTranslations.find((translation) => translation.attributeValueId === option.id && translation.locale === locale)?.label
            ?? optionTranslations.find((translation) => translation.attributeValueId === option.id && translation.locale === "en")?.label
            ?? option.code,
        })),
      };
    });

  return result.filter((attribute) => attribute.options.length > 0);
}

export async function listProductAttributeSelections(productId: string, locale: Locale) {
  const rows = await db
    .select({
      attributeId: productAttributeValues.attributeId,
      valueId: productAttributeValues.attributeValueId,
      attributeCode: attributes.code,
      attributeName: attributeTranslations.name,
      valueCode: attributeValues.code,
      valueLabel: attributeValueTranslations.label,
    })
    .from(productAttributeValues)
    .innerJoin(attributes, eq(productAttributeValues.attributeId, attributes.id))
    .leftJoin(attributeValues, eq(productAttributeValues.attributeValueId, attributeValues.id))
    .leftJoin(attributeTranslations, and(eq(attributeTranslations.attributeId, attributes.id), eq(attributeTranslations.locale, locale)))
    .leftJoin(attributeValueTranslations, and(eq(attributeValueTranslations.attributeValueId, attributeValues.id), eq(attributeValueTranslations.locale, locale)))
    .where(eq(productAttributeValues.productId, productId));

  const attributeIds = rows.map((row) => row.attributeId).filter(Boolean);
  const valueIds = rows.map((row) => row.valueId).filter(Boolean) as string[];
  const fallbackAttributes = attributeIds.length
    ? await db.select().from(attributeTranslations).where(and(inArray(attributeTranslations.attributeId, attributeIds), eq(attributeTranslations.locale, "en")))
    : [];
  const fallbackValues = valueIds.length
    ? await db.select().from(attributeValueTranslations).where(and(inArray(attributeValueTranslations.attributeValueId, valueIds), eq(attributeValueTranslations.locale, "en")))
    : [];

  return rows
    .filter((row) => row.attributeId && row.valueId)
    .map((row) => ({
      attributeId: row.attributeId,
      valueId: row.valueId,
      attributeCode: row.attributeCode,
      attributeName: row.attributeName ?? fallbackAttributes.find((translation) => translation.attributeId === row.attributeId)?.name ?? row.attributeCode,
      valueCode: row.valueCode,
      label: row.valueLabel ?? fallbackValues.find((translation) => translation.attributeValueId === row.valueId)?.label ?? row.valueCode,
    }));
}

export async function listPublishedProductsPage(
  locale: Locale,
  options?: {
    categoryId?: string;
    search?: string;
    limit?: number;
    page?: number;
    filters?: Record<string, string[]>;
  },
) {
  const limit = Math.max(1, Math.min(24, options?.limit ?? 12));
  const page = Math.max(1, Number(options?.page ?? 1));
  const products = await listPublishedProducts(locale, {
    categoryId: options?.categoryId,
    search: options?.search,
    limit: 200,
  });

  const normalizedFilters = Object.entries(options?.filters ?? {}).reduce<Record<string, string[]>>((acc, [key, value]) => {
    const values = Array.isArray(value) ? value : [value];
    const cleaned = values.filter(Boolean);
    if (cleaned.length > 0) {
      acc[key] = cleaned;
    }
    return acc;
  }, {});

  const productIds = products.map((product) => product.id);
  const matchingSelections = productIds.length
    ? await db
        .select({
          productId: productAttributeValues.productId,
          attributeId: productAttributeValues.attributeId,
          attributeValueId: productAttributeValues.attributeValueId,
        })
        .from(productAttributeValues)
        .where(inArray(productAttributeValues.productId, productIds))
    : [];

  const productSelectionMap = new Map<string, Map<string, Set<string>>>();
  for (const selection of matchingSelections) {
    if (!selection.attributeValueId) continue;
    const productMap = productSelectionMap.get(selection.productId) ?? new Map<string, Set<string>>();
    const attributeValues = productMap.get(selection.attributeId) ?? new Set<string>();
    attributeValues.add(selection.attributeValueId);
    productMap.set(selection.attributeId, attributeValues);
    productSelectionMap.set(selection.productId, productMap);
  }

  const filtered = products.filter((product) => {
    for (const [attributeId, values] of Object.entries(normalizedFilters)) {
      const selections = values.map((value) => value.trim()).filter(Boolean);
      if (selections.length === 0) continue;

      const attributeValuesForProduct = productSelectionMap.get(product.id)?.get(attributeId) ?? new Set<string>();
      const matched = selections.some((selection) => attributeValuesForProduct.has(selection));
      if (!matched) {
        return false;
      }
    }

    return true;
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;
  const paginated = filtered.slice(start, start + limit);

  return {
    products: paginated,
    total,
    page: safePage,
    totalPages,
    limit,
  };
}

export async function listProductSpecifications(productId: string, locale: Locale) {
  const rows = await db
    .select({
      definition: specificationDefinitions,
      translation: specificationTranslations,
      value: productSpecifications,
    })
    .from(productSpecifications)
    .innerJoin(specificationDefinitions, eq(productSpecifications.specificationDefinitionId, specificationDefinitions.id))
    .leftJoin(specificationTranslations, and(eq(specificationTranslations.specificationDefinitionId, specificationDefinitions.id), eq(specificationTranslations.locale, locale)))
    .where(eq(productSpecifications.productId, productId))
    .orderBy(asc(specificationDefinitions.sortOrder), asc(specificationDefinitions.code));

  return rows.map(({ definition, translation, value }) => ({
    id: definition.id,
    code: definition.code,
    name: translation?.name ?? definition.code,
    value: value.valueText ?? value.valueNumeric?.toString() ?? (value.valueBoolean !== null ? String(value.valueBoolean) : "—"),
  }));
}
