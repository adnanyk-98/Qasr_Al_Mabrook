"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { serverEnv } from "@/config/env";

import {
  createAttribute,
  createAttributeTranslation,
  createAttributeValue,
  createBrand,
  updateBrand,
  deleteBrandById,
  createCategory,
  createCategoryAttribute,
  upsertCategoryTranslation,
  createHomepageSection,
  getHomepageSectionById,
  updateHomepageSection,
  createProductCategory,
  createProductImage,
  setProductPrimaryImage,
  createProductTranslation,
  saveProductWithDefaultTranslation,
  createSpecificationDefinition,
  createSpecificationTranslation,
  createVariantCombination,
  createVariantDefinition,
  updateProductImage,
} from "@/server/repositories/catalog-admin";
import { getProductById, updateCategory, getCategoryById, setCategoryImage } from "@/server/repositories/catalog-admin";
import { requireAdminSession } from "@/server/services/admin-auth";
import { siteConfig } from "@/config/site";
import { resolvePrimaryProductImageId } from "@/lib/product-image-primary";
import { invalidateBrandPublicCache, invalidateCategoryPublicCache, invalidateHomepagePublicCache, invalidateProductPublicCache } from "@/lib/public-cache";

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

    const updatedCategory = await updateCategory({
      id: categoryId,
      slug,
      parentId,
      status: statusToUse,
      sortOrder: sortOrderSchema.parse(formData.get("sortOrder") ?? 0),
    });
    // attempt to attach image metadata when provided
    const providedImageUrl = String(formData.get("imageUrl") ?? "").trim();
    if (providedImageUrl) {
      const objectKey = String(formData.get("objectKey") ?? providedImageUrl.split("/").pop() ?? "").trim();
      const width = Number(formData.get("width") ?? 0);
      const height = Number(formData.get("height") ?? 0);
      if (validateImageReference(providedImageUrl, objectKey, width, height)) {
        await setCategoryImage({ categoryId, objectKey, publicUrl: providedImageUrl, width, height });
      }
    }
    if (updatedCategory) await invalidateCategoryPublicCache(updatedCategory.id, updatedCategory.slug);
  } else {
    const created = await createCategory({
      slug,
      parentId,
      status: parsedStatus,
      sortOrder: sortOrderSchema.parse(formData.get("sortOrder") ?? 0),
    });

    const providedImageUrl = String(formData.get("imageUrl") ?? "").trim();
    if (providedImageUrl && created?.id) {
      const objectKey = String(formData.get("objectKey") ?? providedImageUrl.split("/").pop() ?? "").trim();
      const width = Number(formData.get("width") ?? 0);
      const height = Number(formData.get("height") ?? 0);
      if (validateImageReference(providedImageUrl, objectKey, width, height)) {
        await setCategoryImage({ categoryId: created.id, objectKey, publicUrl: providedImageUrl, width, height });
      }
    }
    if (created) await invalidateCategoryPublicCache(created.id, created.slug);
  }

  redirect("/admin/categories");
}

export async function upsertBrandAction(formData: FormData) {
  await authorizeAdminMutation();
  const name = String(formData.get("name") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? "")) || slugify(name);
  const brandId = String(formData.get("brandId") ?? "");
  const logoUrl = String(formData.get("logoUrl") ?? "").trim() || null;
  const sortOrder = sortOrderSchema.parse(formData.get("sortOrder") ?? 0);
  const enabled = String(formData.get("enabled") ?? "") === "on";
  if (!name || !slug || (enabled && !logoUrl)) redirect("/admin/brands");

  if (brandId) {
    if (!idSchema.safeParse(brandId).success) redirect("/admin/brands");
    const updatedBrand = await updateBrand({ id: brandId, name, slug, logoUrl, sortOrder, enabled });
    if (updatedBrand) await invalidateBrandPublicCache();
  } else {
    const createdBrand = await createBrand({ name, slug, logoUrl, sortOrder, enabled });
    if (createdBrand) await invalidateBrandPublicCache();
  }

  redirect("/admin/brands");
}

export async function deleteBrandAction(formData: FormData) {
  await authorizeAdminMutation();
  const brandId = String(formData.get("brandId") ?? "");
  if (!idSchema.safeParse(brandId).success) redirect("/admin/brands");
  const result = await deleteBrandById(brandId);
  if (!result.ok) redirect(`/admin/brands?error=${encodeURIComponent(result.reason)}`);
  await invalidateBrandPublicCache();
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

export type ProductActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[]>;
  productId?: string;
};

const productFormSchema = z.object({
  productId: z.string().uuid().optional().or(z.literal("")),
  name: z.string().trim().min(1, "Product name is required.").max(255, "Product name must be 255 characters or fewer."),
  shortDescription: z.string().trim().min(1, "Short description is required.").max(10000, "Short description must be 10,000 characters or fewer."),
  description: z.string().trim().min(1, "Long description is required.").max(50000, "Long description must be 50,000 characters or fewer."),
  slug: z.string().trim().max(255, "Slug must be 255 characters or fewer.").optional().default(""),
  brandId: z.string().uuid().optional().or(z.literal("")),
  defaultSku: z.string().trim().max(255, "SKU must be 255 characters or fewer.").optional().default(""),
  status: statusSchema,
  categoryId: z.string().uuid().optional().or(z.literal("")),
  isPrimaryCategory: z.boolean(),
});

export async function upsertProductAction(formData: FormData): Promise<ProductActionState> {
  await authorizeAdminMutation();
  const parsed = productFormSchema.safeParse({
    productId: String(formData.get("productId") ?? ""),
    name: String(formData.get("name") ?? ""),
    shortDescription: String(formData.get("shortDescription") ?? ""),
    description: String(formData.get("description") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    brandId: String(formData.get("brandId") ?? ""),
    defaultSku: String(formData.get("defaultSku") ?? ""),
    status: String(formData.get("status") ?? "DRAFT"),
    categoryId: String(formData.get("categoryId") ?? ""),
    isPrimaryCategory: String(formData.get("isPrimaryCategory") ?? "") === "on",
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please correct the highlighted product fields.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const values = parsed.data;
  const productId = values.productId || undefined;
  const slug = slugify(values.slug) || slugify(values.name);
  const existingProduct = productId ? await getProductById(productId) : null;
  if (productId && !existingProduct) {
    return { status: "error", message: "The product being edited no longer exists. Refresh the page and try again." };
  }

  let statusToUse = values.status;
  if (statusToUse === "DRAFT" && existingProduct?.status === "ARCHIVED") statusToUse = "ARCHIVED";

  let saved;
  try {
    saved = await saveProductWithDefaultTranslation({
      id: productId,
      slug,
      brandId: values.brandId || null,
      status: statusToUse,
      defaultSku: values.defaultSku || null,
      locale: siteConfig.defaultLocale,
      name: values.name,
      shortDescription: values.shortDescription,
      description: values.description,
      categoryId: values.categoryId || null,
      isPrimaryCategory: values.isPrimaryCategory,
    });
  } catch (error) {
    console.error("Failed to save product and default translation", { productId, slug, error });
    return { status: "error", message: "Could not save the product. No product translation was committed; please try again." };
  }
  if (!saved) return { status: "error", message: "The product could not be saved. Refresh the page and try again." };

  const createdOrUpdatedProductId = saved.product.id;

  // If client uploaded an image to R2, create a product_images row and mark it primary
  // Support multiple uploaded images. Client includes repeated fields: imageUrl, objectKey, width, height
  const imageUrls = formData.getAll("imageUrl").map((v) => String(v ?? "").trim()).filter(Boolean);
  let imageSaveWarning: string | null = null;
  try {
    if (imageUrls.length && createdOrUpdatedProductId) {
    const objectKeys = formData.getAll("objectKey").map((v) => String(v ?? "").trim());
    const widths = formData.getAll("width").map((v) => Number(v ?? 0));
    const heights = formData.getAll("height").map((v) => Number(v ?? 0));
    const sortOrders = formData.getAll("sortOrder").map((v) => Number(v ?? 0));
    const primaryObjectKey = String(formData.get("primaryObjectKey") ?? "").trim();
    const imageIds = formData.getAll("imageId").map((v) => String(v ?? "").trim());
    const currentProduct = await getProductById(createdOrUpdatedProductId);
    let primaryImageId: string | null = currentProduct?.primaryImageId ?? null;

    for (let i = 0; i < imageUrls.length; i++) {
      const providedImageUrl = imageUrls[i];
      const objectKey = objectKeys[i] ?? providedImageUrl.split("/").pop() ?? "";
      const width = Number.isFinite(widths[i]) ? widths[i] : 0;
      const height = Number.isFinite(heights[i]) ? heights[i] : 0;
      const imageId = imageIds[i] ?? "";
      const sortOrder = Number.isFinite(sortOrders[i]) ? sortOrders[i] : i;
      if (!validateImageReference(providedImageUrl, objectKey, width, height)) continue;

      const isPrimarySelection = Boolean(primaryObjectKey ? primaryObjectKey === objectKey : i === 0);

      if (imageId) {
        const updatedImage = await updateProductImage({ id: imageId, productId: createdOrUpdatedProductId, sortOrder, isPrimary: isPrimarySelection });
        if (updatedImage && isPrimarySelection) {
          primaryImageId = resolvePrimaryProductImageId({
            currentPrimaryImageId: primaryImageId,
            candidateImageId: imageId,
            isPrimaryChecked: true,
          });
        }
          if (updatedImage) await invalidateProductPublicCache(createdOrUpdatedProductId, slug);
        continue;
      }

      const img = await createProductImage({
        productId: createdOrUpdatedProductId,
        objectKey,
        publicUrl: providedImageUrl,
        width: Number.isInteger(width) ? width : undefined,
        height: Number.isInteger(height) ? height : undefined,
        sortOrder,
        isPrimary: isPrimarySelection,
      });

      if (img?.id && isPrimarySelection) {
        primaryImageId = resolvePrimaryProductImageId({
          currentPrimaryImageId: primaryImageId,
          candidateImageId: img.id,
          isPrimaryChecked: true,
        });
      }
      if (img) await invalidateProductPublicCache(createdOrUpdatedProductId, slug);
    }

    if (primaryImageId) {
      await setProductPrimaryImage(createdOrUpdatedProductId, primaryImageId);
    }
      await invalidateProductPublicCache(createdOrUpdatedProductId, slug);
    }
  } catch (error) {
    console.error("Product and default translation saved, but image associations failed", { productId: createdOrUpdatedProductId, slug, error });
    imageSaveWarning = " The product was saved, but its image association could not be completed.";
  }

  try {
    await invalidateProductPublicCache(createdOrUpdatedProductId, slug);
  } catch (error) {
    console.error("Product saved but public cache invalidation failed", { productId: createdOrUpdatedProductId, slug, error });
  }

  return {
    status: "success",
    message: `${productId ? "Product updated." : "Product created with its default translation."}${imageSaveWarning ?? ""}`,
    productId: createdOrUpdatedProductId,
  };
}

export async function upsertProductTranslationAction(formData: FormData) {
  await authorizeAdminMutation();
  const productId = String(formData.get("productId") ?? "");
  if (!idSchema.safeParse(productId).success) {
    redirect("/admin/translations");
  }

  const createdTranslation = await createProductTranslation({
    productId,
    locale: localeSchema.parse(String(formData.get("locale") ?? "en")),
    name: String(formData.get("name") ?? "").trim(),
    shortDescription: String(formData.get("shortDescription") ?? "") || null,
    description: String(formData.get("description") ?? "") || null,
    seoTitle: String(formData.get("seoTitle") ?? "") || null,
    seoDescription: String(formData.get("seoDescription") ?? "") || null,
  });
  if (createdTranslation) await invalidateProductPublicCache(productId);

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
  const isPrimary = String(formData.get("isPrimary") ?? "") === "on";

  if (!idSchema.safeParse(productId).success || !publicUrl || !validateImageReference(publicUrl, objectKey, width, height)) {
    redirect("/admin/images");
  }

  const created = await createProductImage({
    productId,
    objectKey,
    publicUrl,
    altTextEn: String(formData.get("altTextEn") ?? "") || null,
    altTextAr: String(formData.get("altTextAr") ?? "") || null,
    width,
    height,
    sortOrder: Number(formData.get("sortOrder") ?? 0),
    isPrimary,
  });

  if (created?.id && isPrimary) {
    await setProductPrimaryImage(productId, created.id);
  }

  redirect("/admin/images");
}

export { resolvePrimaryProductImageId };

export async function upsertCategoryTranslationAction(formData: FormData) {
  await authorizeAdminMutation();
  const categoryId = String(formData.get("categoryId") ?? "");
  if (!idSchema.safeParse(categoryId).success) {
    redirect("/admin/translations");
  }

  const input = {
    categoryId,
    locale: localeSchema.parse(String(formData.get("locale") ?? "en")),
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "") || null,
    seoTitle: String(formData.get("seoTitle") ?? "") || null,
    seoDescription: String(formData.get("seoDescription") ?? "") || null,
  };
  const updatedTranslation = await upsertCategoryTranslation(input);
  if (updatedTranslation) {
    const category = await getCategoryById(categoryId);
    if (category) await invalidateCategoryPublicCache(category.id, category.slug);
  }

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
    const updatedSection = await updateHomepageSection({
      id: sectionId,
      sectionType: sectionType || undefined,
      status: statusSchema.safeParse(status).success ? (status as "DRAFT" | "PUBLISHED" | "ARCHIVED") : "DRAFT",
      sortOrder,
      configurationJson,
    });
    if (updatedSection) await invalidateHomepagePublicCache();
    redirect("/admin/homepage");
  }

  if (!sectionType) {
    redirect("/admin/homepage");
  }

  const createdSection = await createHomepageSection({
    sectionType,
    status,
    sortOrder,
    configurationJson,
  });
  if (createdSection) await invalidateHomepagePublicCache();

  redirect("/admin/homepage");
}

export async function setHomepageSectionStatusAction(formData: FormData) {
  await authorizeAdminMutation();
  const sectionId = String(formData.get("sectionId") ?? "").trim();
  const status = String(formData.get("status") ?? "DRAFT");

  if (!sectionId || !statusSchema.safeParse(status).success) {
    redirect("/admin/homepage");
  }

  const updatedSection = await updateHomepageSection({
    id: sectionId,
    status: status as "DRAFT" | "PUBLISHED" | "ARCHIVED",
  });
  if (updatedSection) await invalidateHomepagePublicCache();

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

  const createdRelation = await createProductCategory({
    productId,
    categoryId,
    isPrimary: String(formData.get("isPrimary") ?? "") === "on",
  });
  if (createdRelation) {
    await invalidateProductPublicCache(productId);
    await invalidateCategoryPublicCache(categoryId);
  }

  redirect("/admin/products");
}
