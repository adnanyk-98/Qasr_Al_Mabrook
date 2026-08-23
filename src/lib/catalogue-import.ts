import sharp from "sharp";

import type { DiscoveryReport, DiscoveredProduct } from "@/lib/catalogue-discovery";

export const localImportStatus = "PUBLISHED" as const;

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
  categories: Array<{ name: string; slug: string }>;
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
    categories: report.categories.map((name) => ({
      name,
      slug: slugifyCatalogueValue(name),
    })),
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

export function generateR2ObjectKey(productSlug: string, filename: string) {
  const safeSlug = encodeURIComponent(productSlug.toLowerCase().trim().replace(/\s+/g, "-"));
  const safeFilename = filename.trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9.\-_%]/g, "");
  return `catalogue/${safeSlug}/${safeFilename}`;
}

export function generateR2PublicUrl(r2PublicBaseUrl: string, objectKey: string) {
  return `${r2PublicBaseUrl.replace(/\/$/, "")}/${objectKey}`;
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
    // eslint-disable-next-line no-new
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
