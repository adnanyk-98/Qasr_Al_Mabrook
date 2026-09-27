import { NextResponse } from "next/server";

import { serverEnv } from "@/config/env";
import { generateR2PublicUrl, generateR2ObjectKey, PUBLIC_MEDIA_CACHE_CONTROL, readOriginalProductImageMetadata } from "@/lib/catalogue-import";
import { validateSquareImageUpload } from "@/lib/image-media";
import { getCurrentAdmin } from "@/server/services/admin-auth";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });

  const formData = await request.formData();
  const rawFile = formData.get("imageFile");
  const slug = String(formData.get("slug") ?? "product");

  if (!(rawFile instanceof File)) {
    return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
  }

  const r2AccountId = serverEnv.R2_ACCOUNT_ID;
  const bucket = serverEnv.R2_BUCKET_NAME;
  const publicBase = serverEnv.R2_PUBLIC_BASE_URL;

  if (!r2AccountId || !bucket || !publicBase) {
    return NextResponse.json({ success: false, error: "R2 is not configured" }, { status: 500 });
  }

  const buffer = Buffer.from(await rawFile.arrayBuffer());
  const dims = await readOriginalProductImageMetadata(buffer);

  const validation = validateSquareImageUpload({ mimeType: rawFile.type, size: rawFile.size, width: dims.width ?? undefined, height: dims.height ?? undefined });
  if (!validation.ok) return NextResponse.json({ success: false, error: validation.error }, { status: 400 });

  const endpoint = `https://${r2AccountId}.r2.cloudflarestorage.com`;
  const s3 = new S3Client({ region: "auto", endpoint, credentials: { accessKeyId: serverEnv.R2_ACCESS_KEY_ID ?? "", secretAccessKey: serverEnv.R2_SECRET_ACCESS_KEY ?? "" } });

  const originalName = rawFile.name || "image";
  const key = generateR2ObjectKey(slug, originalName);

  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer, ContentType: rawFile.type || "application/octet-stream", CacheControl: PUBLIC_MEDIA_CACHE_CONTROL }));

  const publicUrl = generateR2PublicUrl(publicBase, key);
  return NextResponse.json({ success: true, publicUrl, objectKey: key, width: validation.width, height: validation.height });
}
