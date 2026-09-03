import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/server/services/admin-auth";
import { deleteProductById, getProductById } from "@/server/repositories/catalog-admin";
import { invalidateProductPublicCache } from "@/lib/public-cache";

type DeleteRequestBody = {
  productId?: string;
};

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });

  let body: DeleteRequestBody;
  try {
    body = (await request.json()) as DeleteRequestBody;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const productId = String(body?.productId ?? "").trim();
  if (!productId) return NextResponse.json({ success: false, error: "productId required" }, { status: 400 });

  const existing = await getProductById(productId);
  try {
    const deleted = await deleteProductById(productId);
    if (!deleted) return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    await invalidateProductPublicCache(productId, existing?.slug);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
