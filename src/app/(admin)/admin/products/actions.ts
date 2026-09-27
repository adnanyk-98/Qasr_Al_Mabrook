"use server";

import {
  upsertProductCategoryAction as upsertProductCategory,
  upsertProductTranslationAction as upsertProductTranslation,
} from "@/server/services/admin-catalog";
import type { ProductActionState } from "@/server/services/admin-catalog";
import { upsertProductAction as saveProduct } from "@/server/services/admin-catalog";

export async function upsertProductAction(_previousState: ProductActionState, formData: FormData): Promise<ProductActionState> {
  return saveProduct(formData);
}

export async function upsertProductCategoryAction(formData: FormData) {
  await upsertProductCategory(formData);
}

export async function upsertProductTranslationAction(formData: FormData) {
  await upsertProductTranslation(formData);
}
