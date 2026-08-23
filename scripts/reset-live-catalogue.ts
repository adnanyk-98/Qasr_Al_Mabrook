import { config } from 'dotenv';
import { DeleteObjectsCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import postgres from 'postgres';

config({ path: '.env.local' });

const dbUrl = process.env.DATABASE_URL ?? process.env.DIRECT_DATABASE_URL;
if (!dbUrl) throw new Error('DATABASE_URL or DIRECT_DATABASE_URL is not configured.');

console.log(`Using database URL host: ${new URL(dbUrl).hostname}`);
const sql = postgres(dbUrl, { ssl: 'require', max: 1 });

async function deleteImportedCatalogueData() {
  console.log('Deleting imported catalogue rows from Supabase...');

  await sql`DELETE FROM product_categories`;
  await sql`DELETE FROM product_images`;
  await sql`DELETE FROM product_translations`;
  await sql`DELETE FROM products`;
  await sql`DELETE FROM category_translations`;
  await sql`DELETE FROM categories`;

  console.log('Supabase catalogue rows deleted.');
}

async function deleteStaleR2CatalogObjects() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const bucket = process.env.R2_BUCKET_NAME;
  const keyId = process.env.R2_ACCESS_KEY_ID;
  const secret = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !bucket || !keyId || !secret) {
    throw new Error('Incomplete Cloudflare R2 credentials for stale-object cleanup.');
  }

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: keyId,
      secretAccessKey: secret,
    },
  });

  const reservedPrefixes = ['catalogue/banners/', 'catalogue/brand/', 'catalogue/logo/', 'catalogue/logos/'];
  const keys: string[] = [];
  let continuationToken: string | undefined;

  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: 'catalogue/',
        ContinuationToken: continuationToken,
      }),
    );

    for (const item of response.Contents ?? []) {
      const objectKey = item.Key ?? '';
      if (!objectKey) continue;
      const isReserved = reservedPrefixes.some((prefix) => objectKey.startsWith(prefix));
      if (!isReserved) keys.push(objectKey);
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  if (keys.length === 0) {
    console.log('No stale product catalogue objects found in R2.');
    return;
  }

  console.log(`Deleting ${keys.length} stale product objects from R2...`);

  for (let index = 0; index < keys.length; index += 1000) {
    const chunk = keys.slice(index, index + 1000);
    await client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: {
          Objects: chunk.map((Key) => ({ Key })),
        },
      }),
    );
  }

  console.log('Stale product catalogue objects deleted from R2.');
}

async function main() {
  try {
    await deleteImportedCatalogueData();
    await deleteStaleR2CatalogObjects();
    console.log('Live catalogue reset complete.');
  } finally {
    await sql.end();
  }
}

void main();
