import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/server/services/admin-auth";
import { deleteProductById } from "@/server/repositories/catalog-admin";

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

  try {
    const deleted = await deleteProductById(productId);
    if (!deleted) return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
