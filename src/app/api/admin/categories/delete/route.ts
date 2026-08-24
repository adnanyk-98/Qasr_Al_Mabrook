import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/server/services/admin-auth";
import { deleteCategoryById } from "@/server/repositories/catalog-admin";

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });

  let body: any;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const categoryId = String(body?.categoryId ?? "").trim();
  if (!categoryId) return NextResponse.json({ success: false, error: "categoryId required" }, { status: 400 });

  try {
    const result = await deleteCategoryById(categoryId);
    if (result && (result as any).ok === false) {
      return NextResponse.json({ success: false, error: (result as any).reason }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ success: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}
