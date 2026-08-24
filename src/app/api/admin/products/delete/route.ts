import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/server/services/admin-auth";
import { deleteProductById } from "@/server/repositories/catalog-admin";

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });

  let body: any;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const productId = String(body?.productId ?? "").trim();
  if (!productId) return NextResponse.json({ success: false, error: "productId required" }, { status: 400 });

  try {
    const deleted = await deleteProductById(productId);
    if (!deleted) return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ success: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}
