"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import {
  createAttribute,
  createAttributeTranslation,
  createAttributeValue,
  createBrand,
  createCategory,
  createCategoryAttribute,
  createCategoryTranslation,
  createHomepageSection,
  createProduct,
  getHomepageSectionById,
  updateHomepageSection,
  updateProduct,
  createProductCategory,
  createProductImage,
  createProductTranslation,
  createSpecificationDefinition,
  createSpecificationTranslation,
  createVariantCombination,
  createVariantDefinition,
  createVariantImage,
} from "@/server/repositories/catalog-admin";
import { getProductById, updateCategory, getCategoryById } from "@/server/repositories/catalog-admin";
import { requireAdminSession } from "@/server/services/admin-auth";
import { serverEnv } from "@/config/env";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { generateR2PublicUrl, readOriginalProductImageMetadata } from "@/lib/catalogue-import";
import { validateHeroImageUpload } from "@/lib/hero-media";

const idSchema = z.string().uuid();
const localeSchema = z.enum(["en", "ar"]);
const statusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
const sortOrderSchema = z.coerce.number().int().min(0).max(100000).default(0);

async function authorizeAdminMutation() {
  await requireAdminSession();
}

function validateImageReference(publicUrl: string, objectKey: string, width: number, height: number) {
  const parsedUrl = z.string().url().safeParse(publicUrl);
  if (!parsedUrl.success) return false;

  const url = new URL(publicUrl);
  const allowedOrigin = serverEnv.R2_PUBLIC_BASE_URL ? new URL(serverEnv.R2_PUBLIC_BASE_URL).origin : null;
  const isLocalDevelopment = serverEnv.NODE_ENV !== "production" && ["localhost", "127.0.0.1"].includes(url.hostname);
  if (url.protocol !== "https:" && !isLocalDevelopment) return false;
  if (allowedOrigin && url.origin !== allowedOrigin) return false;
  if (!/\.(?:avif|gif|jpe?g|png|webp)$/i.test(url.pathname)) return false;
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._/-]{0,511}$/.test(objectKey) || objectKey.includes("..")) return false;
  return Number.isInteger(width) && Number.isInteger(height) && width >= 1 && width <= 10000 && height >= 1 && height <= 10000;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function upsertCategoryAction(formData: FormData) {
  await authorizeAdminMutation();
  const slug = slugify(String(formData.get("slug") ?? "")) || slugify(String(formData.get("name") ?? ""));
  const parentId = String(formData.get("parentId") ?? "") || null;
  const categoryId = String(formData.get("categoryId") ?? "");
  const parsedStatus = statusSchema.parse(String(formData.get("status") ?? "DRAFT"));

  if (categoryId) {
    // preserve ARCHIVED status if admin didn't intentionally change it (form defaults to DRAFT)
    let statusToUse = parsedStatus;
    if (parsedStatus === "DRAFT") {
      const existing = await getCategoryById(categoryId);
      if (existing?.status === "ARCHIVED") {
        statusToUse = "ARCHIVED";
      }
    }

    await updateCategory({
      id: categoryId,
      slug,
      parentId,
      status: statusToUse,
      sortOrder: sortOrderSchema.parse(formData.get("sortOrder") ?? 0),
    });
  } else {
    await createCategory({
      slug,
      parentId,
      status: parsedStatus,
      sortOrder: sortOrderSchema.parse(formData.get("sortOrder") ?? 0),
    });
  }

  redirect("/admin/categories");
}

export async function upsertBrandAction(formData: FormData) {
  await authorizeAdminMutation();
  const slug = slugify(String(formData.get("slug") ?? "")) || slugify(String(formData.get("name") ?? ""));

  await createBrand({
    slug,
    status: statusSchema.parse(String(formData.get("status") ?? "DRAFT")),
  });

  redirect("/admin/brands");
}

export async function upsertAttributeAction(formData: FormData) {
  await authorizeAdminMutation();
  const code = String(formData.get("code") ?? "").trim();
  const dataType = (String(formData.get("dataType") ?? "TEXT") as "TEXT" | "NUMBER" | "BOOLEAN" | "SELECT" | "MULTI_SELECT" | "COLOR") || "TEXT";

  await createAttribute({
    code,
    dataType,
    isVariantDefining: String(formData.get("isVariantDefining") ?? "") === "on",
    isFilterable: String(formData.get("isFilterable") ?? "") === "on",
    isSearchable: String(formData.get("isSearchable") ?? "") === "on",
    sortOrder: sortOrderSchema.parse(formData.get("sortOrder") ?? 0),
    status: statusSchema.parse(String(formData.get("status") ?? "DRAFT")),
  });

  redirect("/admin/attributes");
}

export async function upsertAttributeValueAction(formData: FormData) {
  await authorizeAdminMutation();
  const attributeId = String(formData.get("attributeId") ?? "");
  const code = String(formData.get("code") ?? "").trim();

  if (!idSchema.safeParse(attributeId).success || !code || code.length > 255) {
    redirect("/admin/attributes");
  }

  await createAttributeValue({
    attributeId,
    code,
    rawValue: String(formData.get("rawValue") ?? "") || null,
    numericValue: String(formData.get("numericValue") ?? "") || null,
    sortOrder: sortOrderSchema.parse(formData.get("sortOrder") ?? 0),
  });

  redirect("/admin/attributes");
}

export async function upsertProductAction(formData: FormData) {
  await authorizeAdminMutation();
  const slug = slugify(String(formData.get("slug") ?? "")) || slugify(String(formData.get("name") ?? ""));

  const productId = String(formData.get("productId") ?? "");
  if (productId) {
    // edit existing product without changing ARCHIVED status unintentionally
    const parsedStatus = statusSchema.parse(String(formData.get("status") ?? "DRAFT"));
    let statusToUse = parsedStatus;
    if (parsedStatus === "DRAFT") {
      const existing = await getProductById(productId);
      if (existing?.status === "ARCHIVED") {
        statusToUse = "ARCHIVED";
      }
    }

    await updateProduct({
      id: productId,
      slug,
      brandId: String(formData.get("brandId") ?? "") || null,
      status: statusToUse,
      defaultSku: String(formData.get("defaultSku") ?? "") || null,
    });
  } else {
    await createProduct({
      slug,
      brandId: String(formData.get("brandId") ?? "") || null,
      status: statusSchema.parse(String(formData.get("status") ?? "DRAFT")),
      defaultSku: String(formData.get("defaultSku") ?? "") || null,
    });
  }

  redirect("/admin/products");
}

export async function upsertProductTranslationAction(formData: FormData) {
  await authorizeAdminMutation();
  const productId = String(formData.get("productId") ?? "");
  if (!idSchema.safeParse(productId).success) {
    redirect("/admin/translations");
  }

  await createProductTranslation({
    productId,
    locale: localeSchema.parse(String(formData.get("locale") ?? "en")),
    name: String(formData.get("name") ?? "").trim(),
    shortDescription: String(formData.get("shortDescription") ?? "") || null,
    description: String(formData.get("description") ?? "") || null,
    seoTitle: String(formData.get("seoTitle") ?? "") || null,
    seoDescription: String(formData.get("seoDescription") ?? "") || null,
  });

  redirect("/admin/translations");
}

export async function upsertVariantAction(formData: FormData) {
  await authorizeAdminMutation();
  const productId = String(formData.get("productId") ?? "");
  const attributeId = String(formData.get("attributeId") ?? "");

  if (!idSchema.safeParse(productId).success || !idSchema.safeParse(attributeId).success) {
    redirect("/admin/variants");
  }

  await createVariantDefinition({
    productId,
    attributeId,
    sortOrder: sortOrderSchema.parse(formData.get("sortOrder") ?? 0),
  });

  redirect("/admin/variants");
}

export async function upsertVariantCombinationAction(formData: FormData) {
  await authorizeAdminMutation();
  const productId = String(formData.get("productId") ?? "");
  const sku = String(formData.get("sku") ?? "").trim();

  if (!idSchema.safeParse(productId).success || !sku || sku.length > 255) {
    redirect("/admin/variants");
  }

  await createVariantCombination({
    productId,
    sku,
    status: statusSchema.parse(String(formData.get("status") ?? "DRAFT")),
  });

  redirect("/admin/variants");
}

export async function upsertSpecificationAction(formData: FormData) {
  await authorizeAdminMutation();
  const code = String(formData.get("code") ?? "").trim();

  await createSpecificationDefinition({
    code,
    dataType: (String(formData.get("dataType") ?? "TEXT") as "TEXT" | "NUMBER" | "BOOLEAN") || "TEXT",
    status: statusSchema.parse(String(formData.get("status") ?? "DRAFT")),
    sortOrder: sortOrderSchema.parse(formData.get("sortOrder") ?? 0),
  });

  redirect("/admin/specifications");
}

export async function upsertSpecificationTranslationAction(formData: FormData) {
  await authorizeAdminMutation();
  const specificationDefinitionId = String(formData.get("specificationDefinitionId") ?? "");
  if (!idSchema.safeParse(specificationDefinitionId).success) {
    redirect("/admin/specifications");
  }

  await createSpecificationTranslation({
    specificationDefinitionId,
    locale: localeSchema.parse(String(formData.get("locale") ?? "en")),
    name: String(formData.get("name") ?? "").trim(),
  });

  redirect("/admin/specifications");
}

export async function upsertImageAction(formData: FormData) {
  await authorizeAdminMutation();
  const productId = String(formData.get("productId") ?? "");
  const publicUrl = String(formData.get("publicUrl") ?? "").trim();
  const objectKey = String(formData.get("objectKey") ?? publicUrl.split("/").pop() ?? "image").trim();
  const width = Number(formData.get("width") ?? 0);
  const height = Number(formData.get("height") ?? 0);

  if (!idSchema.safeParse(productId).success || !publicUrl || !validateImageReference(publicUrl, objectKey, width, height)) {
    redirect("/admin/images");
  }

  await createProductImage({
    productId,
    objectKey,
    publicUrl,
    altTextEn: String(formData.get("altTextEn") ?? "") || null,
    altTextAr: String(formData.get("altTextAr") ?? "") || null,
    width,
    height,
    sortOrder: Number(formData.get("sortOrder") ?? 0),
    isPrimary: String(formData.get("isPrimary") ?? "") === "on",
  });

  redirect("/admin/images");
}

export async function upsertCategoryTranslationAction(formData: FormData) {
  await authorizeAdminMutation();
  const categoryId = String(formData.get("categoryId") ?? "");
  if (!idSchema.safeParse(categoryId).success) {
    redirect("/admin/translations");
  }

  await createCategoryTranslation({
    categoryId,
    locale: localeSchema.parse(String(formData.get("locale") ?? "en")),
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "") || null,
    seoTitle: String(formData.get("seoTitle") ?? "") || null,
    seoDescription: String(formData.get("seoDescription") ?? "") || null,
  });

  redirect("/admin/translations");
}

export async function upsertAttributeTranslationAction(formData: FormData) {
  await authorizeAdminMutation();
  const attributeId = String(formData.get("attributeId") ?? "");
  if (!idSchema.safeParse(attributeId).success) {
    redirect("/admin/translations");
  }

  await createAttributeTranslation({
    attributeId,
    locale: localeSchema.parse(String(formData.get("locale") ?? "en")),
    name: String(formData.get("name") ?? "").trim(),
  });

  redirect("/admin/translations");
}

export async function upsertHomepageSectionAction(formData: FormData) {
  await authorizeAdminMutation();
  const sectionId = String(formData.get("sectionId") ?? "").trim();
  const sectionType = String(formData.get("sectionType") ?? "").trim();
  const status = String(formData.get("status") ?? "DRAFT");
  const sortOrder = String(formData.get("sortOrder") ?? "0");
  // Do not accept binary files in Server Actions; the client must upload to the hero-upload route and supply `imageUrl`.

  let existingImageUrl = "";
  if (sectionId) {
    const current = await getHomepageSectionById(sectionId);
    const currentConfig = (current?.configurationJson ?? {}) as Record<string, unknown>;
    existingImageUrl = typeof currentConfig.imageUrl === "string" ? currentConfig.imageUrl : "";
  }

  const configurationJson: Record<string, unknown> = {
    title: String(formData.get("title") ?? ""),
    subtitle: String(formData.get("subtitle") ?? ""),
    description: String(formData.get("description") ?? ""),
    imageUrl: existingImageUrl,
    imageAlt: String(formData.get("imageAlt") ?? ""),
    ctaLabel: String(formData.get("ctaLabel") ?? ""),
    ctaHref: String(formData.get("ctaHref") ?? ""),
    enabled: String(formData.get("enabled") ?? "") === "on",
  };

  // Server Action accepts only small textual fields. Use imageUrl provided by the client after uploading to R2.
  const providedImageUrl = String(formData.get("imageUrl") ?? "").trim();
  if (providedImageUrl) {
    configurationJson.imageUrl = providedImageUrl;
  }

  if (sectionId) {
    await updateHomepageSection({
      id: sectionId,
      sectionType: sectionType || undefined,
      status: statusSchema.safeParse(status).success ? (status as "DRAFT" | "PUBLISHED" | "ARCHIVED") : "DRAFT",
      sortOrder,
      configurationJson,
    });
    redirect("/admin/homepage");
  }

  if (!sectionType) {
    redirect("/admin/homepage");
  }

  await createHomepageSection({
    sectionType,
    status,
    sortOrder,
    configurationJson,
  });

  redirect("/admin/homepage");
}

export async function setHomepageSectionStatusAction(formData: FormData) {
  await authorizeAdminMutation();
  const sectionId = String(formData.get("sectionId") ?? "").trim();
  const status = String(formData.get("status") ?? "DRAFT");

  if (!sectionId || !statusSchema.safeParse(status).success) {
    redirect("/admin/homepage");
  }

  await updateHomepageSection({
    id: sectionId,
    status: status as "DRAFT" | "PUBLISHED" | "ARCHIVED",
  });

  redirect("/admin/homepage");
}

export async function upsertCategoryAttributeAction(formData: FormData) {
  await authorizeAdminMutation();
  const categoryId = String(formData.get("categoryId") ?? "");
  const attributeId = String(formData.get("attributeId") ?? "");

  if (!idSchema.safeParse(categoryId).success || !idSchema.safeParse(attributeId).success) {
    redirect("/admin/attributes");
  }

  await createCategoryAttribute({
    categoryId,
    attributeId,
    isRequired: String(formData.get("isRequired") ?? "") === "on",
    sortOrder: sortOrderSchema.parse(formData.get("sortOrder") ?? 0),
  });

  redirect("/admin/attributes");
}

export async function upsertProductCategoryAction(formData: FormData) {
  await authorizeAdminMutation();
  const productId = String(formData.get("productId") ?? "");
  const categoryId = String(formData.get("categoryId") ?? "");

  if (!idSchema.safeParse(productId).success || !idSchema.safeParse(categoryId).success) {
    redirect("/admin/products");
  }

  await createProductCategory({
    productId,
    categoryId,
    isPrimary: String(formData.get("isPrimary") ?? "") === "on",
  });

  redirect("/admin/products");
}
