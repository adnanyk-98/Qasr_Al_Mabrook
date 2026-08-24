import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/server/services/admin-auth";
import { serverEnv } from "@/config/env";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getProductImageById, deleteProductImageById, listProductImagesForProduct, setProductImagePrimary, setProductPrimaryImage, clearProductPrimaryImage } from "@/server/repositories/catalog-admin";

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });

  let body: any;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const imageId = String(body?.imageId ?? "").trim();
  if (!imageId) return NextResponse.json({ success: false, error: "imageId required" }, { status: 400 });

  const img = await getProductImageById(imageId);
  if (!img) return NextResponse.json({ success: false, error: "image not found" }, { status: 404 });

  const productId = img.productId;
  const objectKey = img.objectKey;
  const wasPrimary = !!img.isPrimary;

  // Delete R2 object first
  const r2AccountId = serverEnv.R2_ACCOUNT_ID;
  const bucket = serverEnv.R2_BUCKET_NAME;
  if (!r2AccountId || !bucket) {
    return NextResponse.json({ success: false, error: "R2 not configured" }, { status: 500 });
  }

  const endpoint = `https://${r2AccountId}.r2.cloudflarestorage.com`;
  const s3 = new S3Client({ region: "auto", endpoint, credentials: { accessKeyId: serverEnv.R2_ACCESS_KEY_ID ?? "", secretAccessKey: serverEnv.R2_SECRET_ACCESS_KEY ?? "" } });

  try {
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: objectKey }));
  } catch (e: any) {
    // if object not found or other error, continue but surface error if critical
    // Cloudflare R2 DeleteObject succeeds even if missing; still allow proceeding
    console.error('R2 delete error', e?.message ?? e);
  }

  // Delete DB row
  const deleted = await deleteProductImageById(imageId);
  if (!deleted) return NextResponse.json({ success: false, error: "Failed to delete DB row" }, { status: 500 });

  // If deleted image was primary, choose a new primary per sortOrder or clear
  if (wasPrimary) {
    const remaining = await listProductImagesForProduct(productId);
    if (remaining.length === 0) {
      await clearProductPrimaryImage(productId);
      return NextResponse.json({ success: true, newPrimaryImageId: null });
    } else {
      const newPrimary = remaining[0];
      await setProductImagePrimary(productId, newPrimary.id);
      await setProductPrimaryImage(productId, newPrimary.id);
      return NextResponse.json({ success: true, newPrimaryImageId: newPrimary.id });
    }
  }

  return NextResponse.json({ success: true, newPrimaryImageId: null });
}
