import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/server/services/admin-auth";
import { deleteHomepageSectionById } from "@/server/repositories/catalog-admin";
import { invalidateHomepagePublicCache } from "@/lib/public-cache";

type DeleteRequestBody = {
  sectionId?: string;
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

  const sectionId = String(body?.sectionId ?? "").trim();
  if (!sectionId) return NextResponse.json({ success: false, error: "sectionId required" }, { status: 400 });

  try {
    const deleted = await deleteHomepageSectionById(sectionId);
    if (!deleted) return NextResponse.json({ success: false, error: "Section not found" }, { status: 404 });
    await invalidateHomepagePublicCache();
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
