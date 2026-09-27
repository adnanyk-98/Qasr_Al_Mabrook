"use server";

import { z } from "zod";

import { invalidateCategoryPublicCache, invalidateProductPublicCache } from "@/lib/public-cache";
import {
  createCategoryTranslation,
  createProductTranslation,
  deleteCategoryTranslationById,
  deleteProductTranslationById,
  getCategoryById,
  getCategoryTranslationById,
  getCategoryTranslationForLocale,
  getProductById,
  getProductTranslationById,
  updateCategoryTranslationById,
  updateProductTranslationById,
} from "@/server/repositories/catalog-admin";
import { requireAdminSession } from "@/server/services/admin-auth";
import { siteConfig } from "@/config/site";

const idSchema = z.string().uuid();
const localeSchema = z.enum(["en", "ar"]);
const translationFields = {
  name: z.string().trim().min(1, "Name is required.").max(255, "Name must be 255 characters or fewer."),
  description: z.string().max(10000, "Description must be 10,000 characters or fewer.").optional().default(""),
};

const productTranslationSchema = z.object({
  translationId: idSchema.optional(),
  productId: idSchema,
  locale: localeSchema,
  name: translationFields.name,
  shortDescription: z.string().max(10000, "Short description must be 10,000 characters or fewer.").optional().default(""),
  description: translationFields.description,
});

const categoryTranslationSchema = z.object({
  translationId: idSchema.optional(),
  categoryId: idSchema,
  locale: localeSchema,
  name: translationFields.name,
  shortDescription: z.string().max(10000, "Short description must be 10,000 characters or fewer.").optional().default(""),
  description: translationFields.description,
});

const translationIdSchema = z.object({ translationId: idSchema });

type ActionResult = { ok: true; message: string } | { ok: false; message: string };

function validationMessage(error: z.ZodError) {
  return error.issues.map((issue) => issue.message).join(" ");
}

function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}

async function invalidateAfterMutation(operation: string, invalidate: () => Promise<void>) {
  try {
    await invalidate();
  } catch (error) {
    console.error(`Translation ${operation} succeeded but public cache invalidation failed`, error);
  }
}

export async function saveProductTranslation(input: unknown): Promise<ActionResult> {
  await requireAdminSession();
  const parsed = productTranslationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: validationMessage(parsed.error) };

  const values = parsed.data;
  try {
    if (values.locale === siteConfig.defaultLocale) {
      return { ok: false, message: "Manage the default product translation from the Product Create/Edit form." };
    }
    const product = await getProductById(values.productId);
    if (!product) return { ok: false, message: "The selected product no longer exists." };

    let translation;
    if (values.translationId) {
      const existing = await getProductTranslationById(values.translationId);
      if (!existing || existing.productId !== values.productId || existing.locale !== values.locale) {
        return { ok: false, message: "The selected translation does not match this product and locale." };
      }
      translation = await updateProductTranslationById(values.translationId, {
        name: values.name,
        shortDescription: values.shortDescription || null,
        description: values.description || null,
      });
    } else {
      translation = await createProductTranslation({
          productId: values.productId,
          locale: values.locale,
          name: values.name,
          shortDescription: values.shortDescription || null,
          description: values.description || null,
        });
    }

    if (!translation) {
      return values.translationId
        ? { ok: false, message: "This translation no longer exists. Refresh the page and try again." }
        : { ok: false, message: "A translation for this product and locale already exists. Edit the existing translation instead." };
    }

    await invalidateAfterMutation("save", () => invalidateProductPublicCache(product.id, product.slug));
    return { ok: true, message: values.translationId ? "Product translation updated." : "Product translation created." };
  } catch (error) {
    console.error("Failed to save product translation", { productId: values.productId, locale: values.locale, error });
    return { ok: false, message: "Could not save the product translation. Please try again." };
  }
}

export async function deleteProductTranslation(input: unknown): Promise<ActionResult> {
  await requireAdminSession();
  const parsed = translationIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: validationMessage(parsed.error) };

  try {
    const existing = await getProductTranslationById(parsed.data.translationId);
    if (!existing) return { ok: false, message: "This product translation no longer exists." };
    if (existing.locale === siteConfig.defaultLocale) {
      return { ok: false, message: "Manage the default product translation from the Product Edit form." };
    }
    const deleted = await deleteProductTranslationById(existing.id);
    if (!deleted) return { ok: false, message: "This product translation could not be found." };
    const product = await getProductById(existing.productId);
    await invalidateAfterMutation("delete", () => invalidateProductPublicCache(existing.productId, product?.slug));
    return { ok: true, message: "Product translation deleted." };
  } catch (error) {
    console.error("Failed to delete product translation", { translationId: parsed.data.translationId, error });
    return { ok: false, message: "Could not delete the product translation. Please try again." };
  }
}

export async function saveCategoryTranslation(input: unknown): Promise<ActionResult> {
  await requireAdminSession();
  const parsed = categoryTranslationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: validationMessage(parsed.error) };

  const values = parsed.data;
  try {
    const category = await getCategoryById(values.categoryId);
    if (!category) return { ok: false, message: "The selected category no longer exists." };

    let translation;
    if (values.translationId) {
      const existing = await getCategoryTranslationById(values.translationId);
      if (!existing || existing.categoryId !== values.categoryId || existing.locale !== values.locale) {
        return { ok: false, message: "The selected translation does not match this category and locale." };
      }
      translation = await updateCategoryTranslationById(values.translationId, {
        name: values.name,
        shortDescription: values.shortDescription || null,
        description: values.description || null,
      });
    } else {
      const existing = await getCategoryTranslationForLocale(values.categoryId, values.locale);
      if (existing) return { ok: false, message: "A translation for this category and locale already exists. Edit the existing translation instead." };
      translation = await createCategoryTranslation({
        categoryId: values.categoryId,
        locale: values.locale,
        name: values.name,
        shortDescription: values.shortDescription || null,
        description: values.description || null,
      });
    }

    if (!translation) return { ok: false, message: "This category translation could not be saved. Refresh the page and try again." };
    await invalidateAfterMutation("save", () => invalidateCategoryPublicCache(category.id, category.slug));
    return { ok: true, message: values.translationId ? "Category translation updated." : "Category translation created." };
  } catch (error) {
    if (!values.translationId && isUniqueViolation(error)) {
      return { ok: false, message: "A translation for this category and locale already exists. Refresh the page to edit it." };
    }
    console.error("Failed to save category translation", { categoryId: values.categoryId, locale: values.locale, error });
    return { ok: false, message: "Could not save the category translation. Please try again." };
  }
}

export async function deleteCategoryTranslation(input: unknown): Promise<ActionResult> {
  await requireAdminSession();
  const parsed = translationIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: validationMessage(parsed.error) };

  try {
    const existing = await getCategoryTranslationById(parsed.data.translationId);
    if (!existing) return { ok: false, message: "This category translation no longer exists." };
    const deleted = await deleteCategoryTranslationById(existing.id);
    if (!deleted) return { ok: false, message: "This category translation could not be found." };
    const category = await getCategoryById(existing.categoryId);
    await invalidateAfterMutation("delete", () => invalidateCategoryPublicCache(existing.categoryId, category?.slug));
    return { ok: true, message: "Category translation deleted." };
  } catch (error) {
    console.error("Failed to delete category translation", { translationId: parsed.data.translationId, error });
    return { ok: false, message: "Could not delete the category translation. Please try again." };
  }
}

export async function upsertAttributeTranslationAction(formData: FormData) {
  await requireAdminSession();
  const { upsertAttributeTranslationAction: save } = await import("@/server/services/admin-catalog");
  await save(formData);
}