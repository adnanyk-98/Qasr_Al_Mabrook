import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/server/services/admin-auth";
import { deleteCategoryById, getCategoryById } from "@/server/repositories/catalog-admin";
import { invalidateCategoryPublicCache } from "@/lib/public-cache";

type DeleteRequestBody = {
  categoryId?: string;
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

  const categoryId = String(body?.categoryId ?? "").trim();
  if (!categoryId) return NextResponse.json({ success: false, error: "categoryId required" }, { status: 400 });

  const existing = await getCategoryById(categoryId);
  try {
    const result = await deleteCategoryById(categoryId);
    if (result && typeof result === "object" && "ok" in result && result.ok === false) {
      const failure = result as { reason?: string };
      return NextResponse.json({ success: false, error: String(failure.reason ?? "Delete failed") }, { status: 400 });
    }
      if (result) await invalidateCategoryPublicCache(categoryId, existing?.slug);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
