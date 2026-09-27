import fs from "node:fs/promises";
import path from "node:path";
import mime from "mime";
import { config } from "dotenv";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

config({ path: ".env.local" });

const desktopFile = "FANCY SUIT-Web Banner.jpg";
const mobileFile = "FANCY SUIT-Web Banner-Mobile.jpg";

async function upload(buffer: Buffer, filename: string) {
  const { serverEnv } = await import("@/config/env");
  const { generateR2PublicUrl } = await import("@/lib/catalogue-import");
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${serverEnv.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: serverEnv.R2_ACCESS_KEY_ID ?? "", secretAccessKey: serverEnv.R2_SECRET_ACCESS_KEY ?? "" },
  });
  const safeFilename = filename.trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9.\-_]/g, "");
  const key = `hero/${safeFilename}`;
  await client.send(new PutObjectCommand({ Bucket: serverEnv.R2_BUCKET_NAME, Key: key, Body: buffer, ContentType: mime.getType(filename) ?? "application/octet-stream" }));
  return generateR2PublicUrl(serverEnv.R2_PUBLIC_BASE_URL ?? "", key);
}

async function main() {
  const { readOriginalProductImageMetadata } = await import("@/lib/catalogue-import");
  const { createHomepageSection, listHomepageSections, updateHomepageSection } = await import("@/server/repositories/catalog-admin");
  const root = path.join(process.cwd(), "catalogue", "Banner");
  const desktopBuffer = await fs.readFile(path.join(root, desktopFile));
  const mobileBuffer = await fs.readFile(path.join(root, "Mobile", mobileFile));
  const desktopDimensions = await readOriginalProductImageMetadata(desktopBuffer);
  const mobileDimensions = await readOriginalProductImageMetadata(mobileBuffer);
  if (desktopDimensions.width !== 1920 || desktopDimensions.height !== 720) throw new Error(`Fancy Suit desktop must be 1920 x 720, got ${desktopDimensions.width} x ${desktopDimensions.height}`);
  if (mobileDimensions.width !== 1080 || mobileDimensions.height !== 1200) throw new Error(`Fancy Suit mobile must be 1080 x 1200, got ${mobileDimensions.width} x ${mobileDimensions.height}`);

  const sections = await listHomepageSections();
  const existing = sections.find((section) => {
    const configuration = (section.configurationJson ?? {}) as Record<string, unknown>;
    return String(configuration.imageAlt ?? "").toLowerCase() === "fancy suit"
      || String(configuration.desktopImageUrl ?? "").toLowerCase().includes("fancy-suit");
  });
  const desktopImageUrl = await upload(desktopBuffer, desktopFile);
  const mobileImageUrl = await upload(mobileBuffer, mobileFile);
  const configurationJson = {
    ...((existing?.configurationJson ?? {}) as Record<string, unknown>),
    desktopImageUrl,
    mobileImageUrl,
    imageAlt: "Fancy Suit",
    enabled: true,
  };

  if (existing) {
    await updateHomepageSection({ id: existing.id, sectionType: "hero", status: "PUBLISHED", sortOrder: "4", configurationJson });
    console.log(JSON.stringify({ action: "updated", id: existing.id, sortOrder: 4, desktopImageUrl, mobileImageUrl }, null, 2));
  } else {
    const created = await createHomepageSection({ sectionType: "hero", status: "PUBLISHED", sortOrder: "4", configurationJson });
    console.log(JSON.stringify({ action: "created", id: created?.id, sortOrder: 4, desktopImageUrl, mobileImageUrl }, null, 2));
  }

  const { db } = await import("@/db");
  await (db as typeof db & { $client: { end: () => Promise<void> } }).$client.end();
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});