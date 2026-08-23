import { NextResponse } from "next/server";

import { serverEnv } from "@/config/env";
import { generateR2PublicUrl, readOriginalProductImageMetadata } from "@/lib/catalogue-import";
import { validateHeroImageUpload } from "@/lib/hero-media";
import { getCurrentAdmin } from "@/server/services/admin-auth";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("imageFile");

  if (!file || typeof file !== "object" || !("arrayBuffer" in file) || !(file as any).name) {
    return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
  }

  const r2AccountId = serverEnv.R2_ACCOUNT_ID;
  const bucket = serverEnv.R2_BUCKET_NAME;
  const publicBase = serverEnv.R2_PUBLIC_BASE_URL;

  if (!r2AccountId || !bucket || !publicBase) {
    return NextResponse.json({ success: false, error: "R2 is not configured" }, { status: 500 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const dims = await readOriginalProductImageMetadata(buffer);

  // Validate exact 1920x1080 requirement
  if (dims.width !== 1920 || dims.height !== 1080) {
    return NextResponse.json({ success: false, error: `Image must be exactly 1920×1080, got ${dims.width}×${dims.height}` }, { status: 400 });
  }

  const validation = validateHeroImageUpload({
    mimeType: (file as any).type,
    size: (file as any).size,
    width: dims.width ?? undefined,
    height: dims.height ?? undefined,
  });

  if (!validation.ok) {
    return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
  }

  const endpoint = `https://${r2AccountId}.r2.cloudflarestorage.com`;
  const s3 = new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId: serverEnv.R2_ACCESS_KEY_ID ?? "",
      secretAccessKey: serverEnv.R2_SECRET_ACCESS_KEY ?? "",
    },
  });

  const safeSlug = slugify("hero");
  const originalName = (file as any).name || "hero";
  const safeFilename = originalName.trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9.\-_]/g, "");
  const key = `hero/${safeSlug}/${safeFilename}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: (file as any).type || "application/octet-stream",
    }),
  );

  const publicUrl = generateR2PublicUrl(publicBase, key);

  return NextResponse.json({ success: true, publicUrl, width: validation.width, height: validation.height });
}
