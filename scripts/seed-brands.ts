import { config } from "dotenv";
config({ path: ".env.local" });

import { readFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import sharp from "sharp";

const brandAssets = [
  ["Vaultex", "vaultex.png"],
  ["Workland", "workland.png"],
  ["Amul Comfy", "Amul_Comfy.png"],
  ["Dream City", "Dream_City.png"],
  ["Taurus", "Taurus.png"],
  ["Yokohama", "yokohama.png"],
] as const;

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

async function main() {
  const sql = postgres(process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL ?? "", { ssl: "require", prepare: false });
  await sql.unsafe("ALTER TABLE brands ADD COLUMN IF NOT EXISTS name varchar(255) NOT NULL DEFAULT ''");
  await sql.unsafe("ALTER TABLE brands ADD COLUMN IF NOT EXISTS logo_url text");
  await sql.unsafe("ALTER TABLE brands ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0");
  await sql.unsafe("ALTER TABLE brands ADD COLUMN IF NOT EXISTS enabled boolean NOT NULL DEFAULT true");

  const accountId = process.env.R2_ACCOUNT_ID;
  const bucket = process.env.R2_BUCKET_NAME;
  const publicBase = process.env.R2_PUBLIC_BASE_URL;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !bucket || !publicBase || !accessKeyId || !secretAccessKey) throw new Error("R2 configuration is incomplete");
  const s3 = new S3Client({ region: "auto", endpoint: `https://${accountId}.r2.cloudflarestorage.com`, credentials: { accessKeyId, secretAccessKey } });
  const created: string[] = [];

  try {
    for (const [[name, filename], sortOrder] of brandAssets.map((asset, index) => [asset, index] as const)) {
      const slug = slugify(name);
      const existing = await sql`select id, logo_url from brands where slug = ${slug} limit 1`;
      const id = existing[0]?.id ?? crypto.randomUUID();
      let logoUrl = existing[0]?.logo_url ?? null;
      if (!logoUrl) {
        const buffer = await readFile(path.join("catalogue", "Brands", filename));
        const metadata = await sharp(buffer).metadata();
        if (!metadata.width || metadata.width !== metadata.height || metadata.width < 256) throw new Error(`${filename} must be square and at least 256px`);
        const key = `brands/${id}/${filename}`;
        await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer, ContentType: "image/png" }));
        logoUrl = `${publicBase.replace(/\/$/, "")}/${key}`;
        created.push(key);
      }
      await sql`insert into brands (id, slug, name, logo_url, sort_order, enabled, status) values (${id}, ${slug}, ${name}, ${logoUrl}, ${sortOrder}, true, 'PUBLISHED') on conflict (slug) do update set name = excluded.name, logo_url = coalesce(brands.logo_url, excluded.logo_url), sort_order = excluded.sort_order, enabled = true, status = 'PUBLISHED'`;
    }
  } catch (error) {
    for (const key of created) await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key })).catch(() => undefined);
    throw error;
  } finally {
    await sql.end();
  }
  console.log(`Seeded ${brandAssets.length} homepage brands idempotently.`);
}

void main().catch((error) => { console.error(error); process.exit(1); });
