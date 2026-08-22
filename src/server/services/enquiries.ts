"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { headers } from "next/headers";

import { revalidatePath } from "next/cache";
import { createQuoteRequest, updateQuoteRequestStatus } from "@/server/repositories/enquiries";
import { getProductBySlug, listVariantCombinationsForProduct } from "@/server/repositories/public-catalog";
import { requireAdminSession } from "@/server/services/admin-auth";
import { sendQuoteNotification } from "@/server/services/quote-notifications";
import { checkRateLimit, getRequestKey } from "@/server/rate-limit";

const quoteSchema = z.object({
  customerName: z.string().trim().min(2).max(255),
  customerEmail: z.string().trim().email().max(255),
  customerPhone: z.string().trim().min(5).max(255),
  companyName: z.string().trim().max(255).optional(),
  city: z.string().trim().max(255).optional(),
  country: z.string().trim().max(255).optional(),
  message: z.string().trim().max(5000).optional(),
  source: z.enum(["PRODUCT", "CONTACT"]),
  locale: z.enum(["en", "ar"]),
  returnPath: z.enum(["/request-quote", "/contact-us"]),
  productSlug: z.string().trim().optional(),
  variantId: z.string().trim().optional(),
  website: z.string().max(0).optional(),
});

export async function submitQuoteRequestAction(formData: FormData) {
  const requestHeaders = await headers();
  const ip = getRequestKey(requestHeaders.get("x-forwarded-for") ?? requestHeaders.get("x-real-ip"));
  const rateLimit = checkRateLimit(`enquiry:${ip}`, 5, 10 * 60 * 1000);
  if (!rateLimit.allowed) {
    redirect("/en/contact-us?error=rate-limit");
  }

  const source = String(formData.get("source") ?? "CONTACT");
  const locale = String(formData.get("locale") ?? "en");
  const returnPath = String(formData.get("returnPath") ?? (source === "PRODUCT" ? "/request-quote" : "/contact-us"));
  const parsed = quoteSchema.safeParse({
    customerName: formData.get("customerName"),
    customerEmail: formData.get("customerEmail"),
    customerPhone: formData.get("customerPhone"),
    companyName: formData.get("companyName") || undefined,
    city: formData.get("city") || undefined,
    country: formData.get("country") || undefined,
    message: formData.get("message") || undefined,
    source,
    locale,
    returnPath,
    productSlug: formData.get("productSlug") || undefined,
    variantId: formData.get("variantId") || undefined,
    website: formData.get("website") || undefined,
  });

  if (!parsed.success) {
    redirect(`/${locale === "ar" ? "ar" : "en"}${returnPath}?error=validation&source=${source === "PRODUCT" ? "PRODUCT" : "CONTACT"}`);
  }

  let product: { id: string; name: string; sku: string | null; variantId?: string | null } | undefined;
  if (parsed.data.productSlug) {
    const productRecord = await getProductBySlug("en", parsed.data.productSlug);
    if (!productRecord) {
      redirect(`/${parsed.data.locale}/request-quote?error=product-not-found`);
    }

    let sku = productRecord.defaultSku;
    if (parsed.data.variantId) {
      const variants = await listVariantCombinationsForProduct(productRecord.id);
      const variant = variants.find((candidate) => candidate.id === parsed.data.variantId);
      if (!variant) {
        redirect(`/${parsed.data.locale}/request-quote?error=variant-not-found&product=${encodeURIComponent(parsed.data.productSlug)}`);
      }
      sku = variant.sku;
    }
    product = { id: productRecord.id, name: productRecord.name, sku, variantId: parsed.data.variantId ?? null };
  }

  const request = await createQuoteRequest({
    customerName: parsed.data.customerName,
    customerEmail: parsed.data.customerEmail,
    customerPhone: parsed.data.customerPhone,
    companyName: parsed.data.companyName,
    city: parsed.data.city,
    country: parsed.data.country,
    message: parsed.data.message,
    source: parsed.data.source,
    product,
  });

  await sendQuoteNotification(request);
  redirect(`/${parsed.data.locale}${parsed.data.returnPath}?success=${encodeURIComponent(request.referenceNumber)}`);
}

export async function updateQuoteRequestStatusAction(formData: FormData) {
  await requireAdminSession();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "NEW") as "NEW" | "IN_PROGRESS" | "RESPONDED" | "CLOSED" | "SPAM";
  if (id) await updateQuoteRequestStatus(id, status);
  revalidatePath("/admin/enquiries");
}