"use server";

import { upsertCategoryAction as upsertCategory } from "@/server/services/admin-catalog";

export async function upsertCategoryAction(formData: FormData) {
  await upsertCategory(formData);
}