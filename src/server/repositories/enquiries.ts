import { and, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { quoteRequestItems, quoteRequestNotifications, quoteRequests, siteSettings } from "@/db/schema";

export type QuoteRequestInput = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName?: string | null;
  city?: string | null;
  country?: string | null;
  message?: string | null;
  source: "PRODUCT" | "CONTACT";
  product?: {
    id: string;
    name: string;
    sku?: string | null;
    variantId?: string | null;
  };
};

function createReferenceNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `QAM-${timestamp}-${suffix}`;
}

export async function createQuoteRequest(input: QuoteRequestInput) {
  return db.transaction(async (transaction) => {
    const [request] = await transaction
      .insert(quoteRequests)
      .values({
        referenceNumber: createReferenceNumber(),
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        companyName: input.companyName ?? null,
        city: input.city ?? null,
        country: input.country ?? null,
        message: input.message ?? null,
        source: input.source,
        status: "NEW",
      })
      .returning();

    if (!request) {
      throw new Error("Quote request could not be created.");
    }

    if (input.product) {
      await transaction.insert(quoteRequestItems).values({
        quoteRequestId: request.id,
        productId: input.product.id,
        variantCombinationId: input.product.variantId ?? null,
        productNameSnapshot: input.product.name,
        skuSnapshot: input.product.sku ?? null,
        quantity: 1,
      });
    }

    await transaction.insert(quoteRequestNotifications).values({
      quoteRequestId: request.id,
      channel: "EMAIL",
      status: "PENDING",
      payloadJson: JSON.stringify({ referenceNumber: request.referenceNumber }),
    });

    return request;
  });
}

export async function listQuoteRequestsWithItems() {
  const requests = await db.select().from(quoteRequests).orderBy(desc(quoteRequests.createdAt));
  const requestIds = requests.map((request) => request.id);
  const items = requestIds.length
    ? await db.select().from(quoteRequestItems).where(inArray(quoteRequestItems.quoteRequestId, requestIds))
    : [];
  const itemMap = new Map<string, typeof items>();

  for (const item of items) {
    const current = itemMap.get(item.quoteRequestId) ?? [];
    current.push(item);
    itemMap.set(item.quoteRequestId, current);
  }

  return requests.map((request) => ({ ...request, items: itemMap.get(request.id) ?? [] }));
}

export async function updateQuoteRequestStatus(id: string, status: "NEW" | "IN_PROGRESS" | "RESPONDED" | "CLOSED" | "SPAM") {
  const [request] = await db.update(quoteRequests).set({ status, updatedAt: new Date() }).where(eq(quoteRequests.id, id)).returning();
  return request ?? null;
}

export async function getPublicContactSettings() {
  const rows = await db
    .select({ key: siteSettings.key, valueJson: siteSettings.valueJson })
    .from(siteSettings)
    .where(and(inArray(siteSettings.key, ["business_phone", "business_email", "whatsapp_number"])))
    .limit(3);

  return Object.fromEntries(rows.map((row) => [row.key, typeof row.valueJson === "object" && row.valueJson && "value" in row.valueJson ? String(row.valueJson.value ?? "") : ""]));
}