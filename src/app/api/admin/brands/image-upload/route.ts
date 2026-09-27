import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

import { serverEnv } from "@/config/env";
import { generateR2PublicUrl, PUBLIC_MEDIA_CACHE_CONTROL, readOriginalProductImageMetadata, versionR2Filename } from "@/lib/catalogue-import";
import { validateBrandLogoUpload } from "@/lib/brand-media";
import { getCurrentAdmin } from "@/server/services/admin-auth";

function safeFilename(value: string) {
  return value.trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "") || "logo";
}

export async function POST(request: Request) {
  if (!await getCurrentAdmin()) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  const formData = await request.formData();
  const file = formData.get("imageFile");
  const brandId = String(formData.get("brandId") ?? crypto.randomUUID());
  if (!file || typeof file !== "object" || !("arrayBuffer" in file) || !(file as File).name) return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });

  const buffer = Buffer.from(await (file as File).arrayBuffer());
  const dimensions = await readOriginalProductImageMetadata(buffer);
  const metadata = await sharp(buffer).metadata();
  const decodedMimeType = metadata.format ? `image/${metadata.format === "jpg" ? "jpeg" : metadata.format}` : null;
  const validation = validateBrandLogoUpload({ mimeType: decodedMimeType, size: buffer.byteLength, width: dimensions.width ?? undefined, height: dimensions.height ?? undefined });
  if (!validation.ok) return NextResponse.json({ success: false, error: validation.error }, { status: 400 });

  const { R2_ACCOUNT_ID: accountId, R2_BUCKET_NAME: bucket, R2_PUBLIC_BASE_URL: publicBase, R2_ACCESS_KEY_ID: accessKeyId, R2_SECRET_ACCESS_KEY: secretAccessKey } = serverEnv;
  if (!accountId || !bucket || !publicBase || !accessKeyId || !secretAccessKey) return NextResponse.json({ success: false, error: "R2 is not configured" }, { status: 500 });
  const key = `brands/${brandId}/${versionR2Filename(safeFilename((file as File).name))}`;
  const s3 = new S3Client({ region: "auto", endpoint: `https://${accountId}.r2.cloudflarestorage.com`, credentials: { accessKeyId, secretAccessKey } });
  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer, ContentType: validation.mimeType, CacheControl: PUBLIC_MEDIA_CACHE_CONTROL }));
  return NextResponse.json({ success: true, publicUrl: generateR2PublicUrl(publicBase, key), objectKey: key, width: validation.width, height: validation.height, filename: (file as File).name });
}