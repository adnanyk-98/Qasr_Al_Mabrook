import { NextResponse } from "next/server";

import { serverEnv } from "@/config/env";
import { generateR2PublicUrl, PUBLIC_MEDIA_CACHE_CONTROL, readOriginalProductImageMetadata, versionR2Filename } from "@/lib/catalogue-import";
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
  const rawFile = formData.get("imageFile");
  const role = String(formData.get("role") ?? "desktop") === "mobile" ? "mobile" : "desktop";

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

  const validation = validateHeroImageUpload({
    role,
    mimeType: rawFile.type,
    size: rawFile.size,
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

  const safeSlug = slugify(role === "mobile" ? "hero-mobile" : "hero-desktop");
  const originalName = rawFile.name || "hero";
  const safeFilename = originalName.trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9.\-_]/g, "");
  const key = `hero/${safeSlug}/${versionR2Filename(safeFilename)}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: rawFile.type || "application/octet-stream",
      CacheControl: PUBLIC_MEDIA_CACHE_CONTROL,
    }),
  );

  const publicUrl = generateR2PublicUrl(publicBase, key);

  return NextResponse.json({ success: true, publicUrl, width: validation.width, height: validation.height });
}
