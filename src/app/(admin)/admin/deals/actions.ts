"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { invalidateHomepagePublicCache } from "@/lib/public-cache";
import {
  createHomepageDeal,
  deactivateHomepageDeal,
  getHomepageDealById,
  getHomepageDealByProductId,
  getProductById,
  listHomepageDeals,
  updateHomepageDeal,
} from "@/server/repositories/catalog-admin";
import { requireAdminSession } from "@/server/services/admin-auth";

const idSchema = z.string().uuid();
const dealDiscountSchema = z.coerce.number().int().min(1).max(100);
const dealPositionSchema = z.coerce.number().int().min(1).max(3);

function redirectWithDealError(message: string): never {
  redirect(`/admin/deals?error=${encodeURIComponent(message)}`);
}

async function authorizeAdminMutation() {
  await requireAdminSession();
}

export async function upsertHomepageDealAction(formData: FormData) {
  await authorizeAdminMutation();
  const dealId = String(formData.get("dealId") ?? "").trim();
  const productId = String(formData.get("productId") ?? "").trim();
  const isActive = String(formData.get("isActive") ?? "") === "on";

  if (dealId && !idSchema.safeParse(dealId).success) redirectWithDealError("Invalid deal.");
  if (!idSchema.safeParse(productId).success) redirectWithDealError("Select an existing product.");

  let discountPercent: number;
  let position: number;
  try {
    discountPercent = dealDiscountSchema.parse(formData.get("discountPercent"));
    position = dealPositionSchema.parse(formData.get("position"));
  } catch {
    redirectWithDealError("Discount must be 1-100 and position must be 1-3.");
  }

  const product = await getProductById(productId);
  if (!product || product.status !== "PUBLISHED") redirectWithDealError("Select an existing published product.");

  const existingForProduct = await getHomepageDealByProductId(productId);
  if (existingForProduct && existingForProduct.id !== dealId) redirectWithDealError("This product already has a deal.");

  const existingDeal = dealId ? await getHomepageDealById(dealId) : null;
  if (dealId && !existingDeal) redirectWithDealError("Deal not found.");

  const allDeals = await listHomepageDeals();
  if (isActive) {
    const activeCount = allDeals.filter((deal) => deal.isActive && deal.id !== dealId).length;
    if (activeCount >= 3) redirectWithDealError("A maximum of three active homepage deals is allowed.");
    const occupiedPosition = allDeals.some((deal) => deal.isActive && deal.id !== dealId && deal.sortOrder === position - 1);
    if (occupiedPosition) redirectWithDealError("Active deal positions must be unique from 1 to 3.");
  }

  const input = { productId, discountPercent, isActive, sortOrder: position - 1 };
  const savedDeal = existingDeal
    ? await updateHomepageDeal({ id: existingDeal.id, ...input })
    : await createHomepageDeal(input);
  if (savedDeal) await invalidateHomepagePublicCache();

  redirect("/admin/deals?saved=1");
}

export async function deactivateHomepageDealAction(formData: FormData) {
  await authorizeAdminMutation();
  const dealId = String(formData.get("dealId") ?? "").trim();
  if (!idSchema.safeParse(dealId).success) redirectWithDealError("Invalid deal.");
  const deactivatedDeal = await deactivateHomepageDeal(dealId);
  if (deactivatedDeal) await invalidateHomepagePublicCache();
  redirect("/admin/deals?saved=1");
}