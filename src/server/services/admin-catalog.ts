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
  const configurationJson: Record<string, unknown> = {
    title: String(formData.get("title") ?? ""),
    subtitle: String(formData.get("subtitle") ?? ""),
    description: String(formData.get("description") ?? ""),
    imageUrl: String(formData.get("imageUrl") ?? ""),
    imageAlt: String(formData.get("imageAlt") ?? ""),
    ctaLabel: String(formData.get("ctaLabel") ?? ""),
    ctaHref: String(formData.get("ctaHref") ?? ""),
    enabled: String(formData.get("enabled") ?? "") === "on",
  };

  // Support direct file upload for hero/banner images via FormData field `imageFile`.
  const file = formData.get("imageFile") as File | null;
  if (file && file.size > 0 && file.name) {
    const r2AccountId = serverEnv.R2_ACCOUNT_ID;
    const bucket = serverEnv.R2_BUCKET_NAME;
    const publicBase = serverEnv.R2_PUBLIC_BASE_URL;

    if (!r2AccountId || !bucket || !publicBase) {
      // R2 not configured — skip upload and rely on imageUrl field.
    } else {
      const endpoint = `https://${r2AccountId}.r2.cloudflarestorage.com`;
      const s3 = new S3Client({ region: "auto", endpoint, credentials: { accessKeyId: serverEnv.R2_ACCESS_KEY_ID ?? "", secretAccessKey: serverEnv.R2_SECRET_ACCESS_KEY ?? "" } });

      // sanitize filename and object key
      const safeFilename = file.name.trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9.\-_%]/g, "");
      const key = `catalogue/banners/${safeFilename}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      // Upload to R2
      try {
        await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer, ContentType: file.type }));
        const publicUrl = generateR2PublicUrl(publicBase, key);

        // try to read dimensions (if sharp available)
        try {
          const dims = await readOriginalProductImageMetadata(buffer as Buffer);
          configurationJson.imageWidth = dims.width;
          configurationJson.imageHeight = dims.height;
        } catch (err) {
          // ignore metadata errors
        }

        configurationJson.imageUrl = publicUrl;
        configurationJson.imageObjectKey = key;
      } catch (err) {
        // upload failed; continue without interrupting admin flow
      }
    }
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
