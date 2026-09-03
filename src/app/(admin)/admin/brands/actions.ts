"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { invalidateBrandPublicCache } from "@/lib/public-cache";
import { createBrand, getBrandById, updateBrand } from "@/server/repositories/catalog-admin";
import { requireAdminSession } from "@/server/services/admin-auth";

const idSchema = z.string().uuid();
const sortOrderSchema = z.coerce.number().int().min(0).max(100000).default(0);

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function authorizeAdminMutation() {
  await requireAdminSession();
}

export async function upsertBrandAction(formData: FormData) {
  await authorizeAdminMutation();
  const name = String(formData.get("name") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? "")) || slugify(name);
  const brandId = String(formData.get("brandId") ?? "");
  let logoUrl = String(formData.get("logoUrl") ?? "").trim() || null;
  const sortOrder = sortOrderSchema.parse(formData.get("sortOrder") ?? 0);
  const enabled = String(formData.get("enabled") ?? "") === "on";

  if (brandId) {
    if (!idSchema.safeParse(brandId).success) redirect("/admin/brands");
    if (!logoUrl) logoUrl = (await getBrandById(brandId))?.logoUrl ?? null;
  }

  if (!name || !slug || (enabled && !logoUrl)) redirect("/admin/brands");

  if (brandId) {
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

  const { deleteBrandById } = await import("@/server/repositories/catalog-admin");
  const result = await deleteBrandById(brandId);
  if (!result.ok) redirect(`/admin/brands?error=${encodeURIComponent(result.reason)}`);
    await invalidateBrandPublicCache();
  redirect("/admin/brands");
}
