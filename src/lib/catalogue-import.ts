import sharp from "sharp";

import type { DiscoveryReport, DiscoveredProduct } from "@/lib/catalogue-discovery";

export const localImportStatus = "PUBLISHED" as const;

export const catalogueCategoryMappings: Readonly<Record<
  string,
  { categoryId: string; legacySlugs: readonly string[] }
>> = {
  "adivasi oil": { categoryId: "9c63ae52-6468-4a21-b8a3-c08ae78c3d3d", legacySlugs: ["adivasi-oil"] },
  "cloth piece": { categoryId: "3703a065-d590-4335-80d3-fcebdaf5dd61", legacySlugs: ["cloth-piece"] },
  pajama: { categoryId: "a8d36d07-3881-410a-a8a5-cb81ba72dc00", legacySlugs: ["pajama"] },
  "measuring tape": { categoryId: "f4b74bfb-a999-416e-8402-f48bea7c3f36", legacySlugs: [] },
  "fancy suit": { categoryId: "fe12dc19-cd89-452b-83d0-f6aedd948386", legacySlugs: [] },
};

export async function readOriginalProductImageMetadata(source: Buffer | Uint8Array | ArrayBuffer) {
  const metadata = await sharp(source).metadata();
  return {
    width: metadata.width ?? null,
    height: metadata.height ?? null,
  };
}

export type CatalogueImportPlan = {
  stage: "local";
  status: typeof localImportStatus;
  categories: Array<{ sourceName: string; categoryId: string; legacySlugs: readonly string[] }>;
  products: Array<{
    category: string;
    name: string;
    slug: string;
    images: DiscoveredProduct["images"];
    primaryImage: string;
  }>;
  skippedUnresolvedImages: string[];
  skippedUnassignedImages: string[];
  totalImages: number;
  totalGalleryImages: number;
  totalMarketingImages: number;
};

export function resolveCatalogueCategoryIds(
  plannedCategories: CatalogueImportPlan["categories"],
  existingCategories: readonly { id: string; slug: string }[],
) {
  const categoriesById = new Map(existingCategories.map((category) => [category.id, category]));
  const categoryIdsBySourceName = new Map<string, string>();

  for (const category of plannedCategories) {
    const legacyConflict = existingCategories.find(
      (existing) =>
        existing.id !== category.categoryId &&
        category.legacySlugs.includes(existing.slug),
    );
    if (legacyConflict) {
      throw new Error(
        `Import conflict for source folder "${category.sourceName}": legacy slug "${legacyConflict.slug}" belongs to category ID "${legacyConflict.id}", not mapped ID "${category.categoryId}".`,
      );
    }

    if (!categoriesById.has(category.categoryId)) {
      throw new Error(
        `Mapped category ID "${category.categoryId}" for source folder "${category.sourceName}" does not exist; refusing to create a replacement category.`,
      );
    }
    categoryIdsBySourceName.set(category.sourceName, category.categoryId);
  }

  return categoryIdsBySourceName;
}

export function buildProductCategoryAssignments(
  products: readonly { productId: string; sourceCategory: string }[],
  categoryIdsBySourceName: ReadonlyMap<string, string>,
) {
  return products.map(({ productId, sourceCategory }) => {
    const categoryId = categoryIdsBySourceName.get(sourceCategory);
    if (!categoryId) {
      throw new Error(`No mapped category ID for product source folder "${sourceCategory}".`);
    }
    return { productId, categoryId, isPrimary: true };
  });
}

export function getMissingProductCategoryRelations(
  desired: readonly { productId: string; categoryId: string; isPrimary: boolean }[],
  existing: readonly { productId: string; categoryId: string }[],
) {
  const existingKeys = new Set(existing.map(({ productId, categoryId }) => `${productId}:${categoryId}`));
  const missingKeys = new Set<string>();

  return desired.filter(({ productId, categoryId }) => {
    const key = `${productId}:${categoryId}`;
    if (existingKeys.has(key) || missingKeys.has(key)) return false;
    missingKeys.add(key);
    return true;
  });
}

export async function resolveCatalogueCategoryIdsForImport(
  plannedCategories: CatalogueImportPlan["categories"],
  selectByIds: (ids: string[]) => Promise<Array<{ id: string; slug: string }>>,
  selectByLegacySlugs: (slugs: string[]) => Promise<Array<{ id: string; slug: string }>>,
) {
  if (!plannedCategories.length) return new Map<string, string>();
  const ids = plannedCategories.map((category) => category.categoryId);
  const legacySlugs = [...new Set(plannedCategories.flatMap((category) => category.legacySlugs))];
  const categories = await selectByIds(ids);
  const legacyCategories = legacySlugs.length ? await selectByLegacySlugs(legacySlugs) : [];
  return resolveCatalogueCategoryIds(plannedCategories, [...categories, ...legacyCategories]);
}

export function slugifyCatalogueValue(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\./g, "-")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildCatalogueImportPlan(report: DiscoveryReport): CatalogueImportPlan {
  const categoryNames = [...new Set(report.products.map((product) => product.category))];
  const categories = categoryNames.map((sourceName) => {
    const mapping = catalogueCategoryMappings[sourceName.trim().toLowerCase()];
    if (!mapping) {
      throw new Error(
        `Unsupported catalogue category folder "${sourceName}". Add an explicit category ID mapping before importing.`,
      );
    }
    return { sourceName, categoryId: mapping.categoryId, legacySlugs: mapping.legacySlugs };
  });
  const mappedIds = new Map<string, string>();
  for (const category of categories) {
    const existingSourceName = mappedIds.get(category.categoryId);
    if (existingSourceName && existingSourceName !== category.sourceName) {
      throw new Error(
        `Multiple source directories map to category ID "${category.categoryId}": "${existingSourceName}" and "${category.sourceName}".`,
      );
    }
    mappedIds.set(category.categoryId, category.sourceName);
  }

  const products = report.products.map((product) => ({
    category: product.category,
    name: product.name,
    slug: slugifyCatalogueValue(product.name),
    images: product.images,
    primaryImage: product.primaryImage,
  }));

  return {
    stage: "local",
    status: localImportStatus,
    categories,
    products,
    skippedUnresolvedImages: report.ambiguousImages,
    skippedUnassignedImages: report.unassignedImages,
    totalImages: products.reduce((total, product) => total + product.images.length, 0),
    totalGalleryImages: products.reduce(
      (total, product) =>
        total + product.images.filter((image) => image.role === "gallery").length,
      0,
    ),
    totalMarketingImages: products.reduce(
      (total, product) =>
        total + product.images.filter((image) => image.role === "marketing").length,
      0,
    ),
  };
}

export function generateR2ObjectKey(productSlug: string, filename: string, version = crypto.randomUUID()) {
  const safeSlug = encodeURIComponent(productSlug.toLowerCase().trim().replace(/\s+/g, "-"));
  const safeFilename = versionR2Filename(filename, version);
  return `catalogue/${safeSlug}/${safeFilename}`;
}

export const PUBLIC_MEDIA_CACHE_CONTROL = "public, max-age=31536000, immutable";

export function versionR2Filename(filename: string, version = crypto.randomUUID()) {
  const safeFilename = filename.trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9.\-_%]/g, "") || "image";
  const extensionIndex = safeFilename.lastIndexOf(".");
  if (extensionIndex <= 0) return `${safeFilename}-${version}`;
  return `${safeFilename.slice(0, extensionIndex)}-${version}${safeFilename.slice(extensionIndex)}`;
}

export function generateR2PublicUrl(r2PublicBaseUrl: string, objectKey: string) {
  return `${r2PublicBaseUrl.replace(/\/$/, "")}/${objectKey}`;
}

export async function cleanupCatalogueImportObjects(
  objectKeys: Iterable<string>,
  dependencies: {
    isOwnedByImport: (objectKey: string) => Promise<boolean>;
    isReferenced: (objectKey: string) => Promise<boolean>;
    deleteObject: (objectKey: string) => Promise<void>;
  },
) {
  const deletedKeys: string[] = [];
  const skippedKeys: string[] = [];
  const failures: Array<{ objectKey: string; error: unknown }> = [];

  for (const objectKey of objectKeys) {
    try {
      if (!(await dependencies.isOwnedByImport(objectKey))) {
        skippedKeys.push(objectKey);
        continue;
      }
      if (await dependencies.isReferenced(objectKey)) {
        skippedKeys.push(objectKey);
        continue;
      }
      await dependencies.deleteObject(objectKey);
      deletedKeys.push(objectKey);
    } catch (error) {
      failures.push({ objectKey, error });
    }
  }

  return { deletedKeys, skippedKeys, failures };
}

export async function runCatalogueImportWithCleanup<T>(
  operation: () => Promise<T>,
  objectKeys: Set<string>,
  dependencies: {
    isOwnedByImport: (objectKey: string) => Promise<boolean>;
    isReferenced: (objectKey: string) => Promise<boolean>;
    deleteObject: (objectKey: string) => Promise<void>;
    reportCleanupFailure?: (objectKey: string, error: unknown) => void;
    reportCleanupSkipped?: (objectKey: string) => void;
  },
) {
  try {
    return await operation();
  } catch (importError) {
    const cleanup = await cleanupCatalogueImportObjects(objectKeys, dependencies);

    for (const { objectKey, error } of cleanup.failures) {
      if (dependencies.reportCleanupFailure) {
        dependencies.reportCleanupFailure(objectKey, error);
      } else {
        console.error(`Failed to clean up R2 object "${objectKey}" after catalogue import failure.`, error);
      }
    }
    for (const objectKey of cleanup.skippedKeys) {
      if (dependencies.reportCleanupSkipped) {
        dependencies.reportCleanupSkipped(objectKey);
      } else {
        console.warn(
          `Skipped cleanup of R2 object "${objectKey}" because it is not owned by this import or is still referenced.`,
        );
      }
    }
    throw importError;
  }
}

export function validateLocalImportMode(stage: string, confirmed: boolean, databaseUrl?: string) {
  if (stage !== "local")
    return { ok: false, message: "Catalogue mutation is restricted to --stage=local." };

  if (!databaseUrl) {
    return { ok: false, message: "Refusing local import: DATABASE_URL is not set in environment." };
  }

  try {
    // Basic validation: DATABASE_URL must be a valid URL (we don't restrict hostnames here)
    // to allow development targets such as Supabase-hosted dev DBs.
    // Keep secrets out of messages by not echoing the URL.
    new URL(databaseUrl);
  } catch {
    return { ok: false, message: "Refusing local import: DATABASE_URL is malformed." };
  }

  return { ok: true as const };
}

export function isLocalDatabaseUrl(databaseUrl?: string) {
  if (!databaseUrl) return false;
  try {
    const parsed = new URL(databaseUrl);
    const hostname = parsed.hostname;
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}
