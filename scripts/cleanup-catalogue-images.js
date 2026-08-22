/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const pg = require('postgres');
const { S3Client, HeadObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
// Require helper; support running under plain node or tsx environment
let generateR2ObjectKey;
try {
  ({ generateR2ObjectKey } = require('../src/lib/catalogue-import'));
} catch (err) {
  ({ generateR2ObjectKey } = require('../src/lib/catalogue-import.ts'));
}

const productSlugs = [
  'adivasi-oil',
  'cloth-piece',
  'fancy-suit',
  'pajama',
  '5-5m-measuring-tape-green',
  '5m-measuring-tape-green',
  '5m-measuring-tape-orange',
  '7-5m-measuring-tape-green',
];

async function main() {
  const dbUrl = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('No database URL configured (DIRECT_DATABASE_URL or DATABASE_URL)');
    process.exit(2);
  }

  const sql = pg(dbUrl, { ssl: 'require', max: 1, connect_timeout: 20 });

  const r2Account = process.env.R2_ACCOUNT_ID;
  const r2Bucket = process.env.R2_BUCKET_NAME;
  const r2PublicBase = process.env.R2_PUBLIC_BASE_URL;
  if (!r2Account || !r2Bucket || !r2PublicBase) {
    console.error('R2 not configured');
    process.exit(2);
  }
  const s3 = new S3Client({ region: 'auto', endpoint: `https://${r2Account}.r2.cloudflarestorage.com`, credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY } });

  const results = {
    localRowsRemoved: 0,
    r2RowsRetained: 0,
    r2Uploads: 0,
    productsUpdated: 0,
    filesRemoved: 0,
  };

  for (const slug of productSlugs) {
    // find product id
    const prod = await sql`SELECT id FROM products WHERE slug = ${slug} LIMIT 1`;
    if (!prod[0]) {
      console.log(`Product not found: ${slug}`);
      continue;
    }
    const productId = prod[0].id;

    const images = await sql`SELECT * FROM product_images WHERE product_id = ${productId} ORDER BY sort_order NULLS LAST, created_at DESC`;
    if (!images || images.length === 0) {
      console.log(`No images for product ${slug}`);
      continue;
    }

    // Map local images (publicUrl contains '/catalogue/') and r2 images (publicUrl starts with R2 public base)
    const localImages = images.filter(i => i.public_url && i.public_url.includes('/catalogue/') && !i.public_url.startsWith('http'))
      .concat(images.filter(i => i.public_url && i.public_url.includes('/catalogue/') && !i.public_url.startsWith(r2PublicBase)));
    const r2Images = images.filter(i => i.public_url && String(i.public_url).startsWith(r2PublicBase));

    if (localImages.length === 0) {
      console.log(`No local images to remove for ${slug}`);
      continue;
    }

    let updatedThisProduct = false;

    for (const local of localImages) {
      const url = local.public_url || '';
      // extract filename
      const filename = path.basename(url);
      const objectKey = generateR2ObjectKey(slug, filename);
      const expectedPublicUrl = `${r2PublicBase.replace(/\/$/, '')}/${objectKey}`;

      // check if R2 object exists
      let exists = false;
      try {
        await s3.send(new HeadObjectCommand({ Bucket: r2Bucket, Key: objectKey }));
        exists = true;
      } catch (e) {
        exists = false;
      }

      if (!exists) {
        // Try to upload from public/catalogue/<Category>/<filename>
        // Determine candidate file paths under public/catalogue
        const candidates = [];
        const publicCatalogue = path.join(process.cwd(), 'public', 'catalogue');
        // Recursively search for matching filename
        function walk(dir) {
          for (const name of fs.readdirSync(dir)) {
            const p = path.join(dir, name);
            if (fs.statSync(p).isDirectory()) walk(p);
            else {
              if (path.basename(p).toLowerCase() === filename.toLowerCase()) candidates.push(p);
            }
          }
        }
        try { walk(publicCatalogue); } catch (e) { /* ignore */ }

        if (candidates.length > 0) {
          // upload first candidate
          const filePath = candidates[0];
          const body = fs.readFileSync(filePath);
          try {
            await s3.send(new PutObjectCommand({ Bucket: r2Bucket, Key: objectKey, Body: body }));
            results.r2Uploads += 1;
            exists = true;
          } catch (e) {
            console.error(`Failed to upload ${filePath} to R2: ${e.message}`);
            continue; // skip deletion
          }
        } else {
          console.log(`R2 object missing and no local file found for ${filename} (product ${slug})`);
          continue; // do not delete local row
        }
      }

      // find R2 row in DB matching objectKey
      const r2Row = images.find(i => i.object_key === objectKey || (i.public_url && i.public_url === expectedPublicUrl));
      if (r2Row) {
        // transfer ordering/primary if needed
        const updates = {};
        let needUpdate = false;
        if ((r2Row.sort_order === null || r2Row.sort_order === undefined) && (local.sort_order !== null && local.sort_order !== undefined)) {
          updates.sort_order = local.sort_order;
          needUpdate = true;
        }
        if (!r2Row.is_primary && local.is_primary) {
          updates.is_primary = true;
          needUpdate = true;
        }
        if (needUpdate) {
          await sql`UPDATE product_images SET ${sql(updates)} WHERE id = ${r2Row.id}`;
          updatedThisProduct = true;
        }

        // delete local row
        await sql`DELETE FROM product_images WHERE id = ${local.id}`;
        results.localRowsRemoved += 1;
        results.r2RowsRetained += 1;

      } else {
        // No R2 DB row exists; create one pointing to R2 public URL
        const sizes = { width: local.width, height: local.height };
        const insert = await sql`INSERT INTO product_images (product_id, object_key, public_url, width, height, sort_order, is_primary, alt_text_en, alt_text_ar, created_at) VALUES (${productId}, ${objectKey}, ${expectedPublicUrl}, ${sizes.width}, ${sizes.height}, ${local.sort_order}, ${local.is_primary}, ${local.alt_text_en}, ${local.alt_text_ar}, now()) RETURNING id`;
        results.r2RowsRetained += 1;
        // delete local row
        await sql`DELETE FROM product_images WHERE id = ${local.id}`;
        results.localRowsRemoved += 1;
        updatedThisProduct = true;
      }

      // remove public/catalogue file if it matches candidate and we uploaded or r2 exists
      try {
        const publicCatalogue = path.join(process.cwd(), 'public', 'catalogue');
        function findFile(dir) {
          for (const name of fs.readdirSync(dir)) {
            const p = path.join(dir, name);
            if (fs.statSync(p).isDirectory()) {
              const res = findFile(p);
              if (res) return res;
            } else if (path.basename(p).toLowerCase() === filename.toLowerCase()) return p;
          }
          return null;
        }
        const found = findFile(publicCatalogue);
        if (found && exists) {
          fs.unlinkSync(found);
          results.filesRemoved += 1;
          console.log(`Removed local file: ${found}`);
        }
      } catch (e) {
        console.error('Error while removing local file: '+e.message);
      }
    }

    if (updatedThisProduct) results.productsUpdated += 1;
  }

  await sql.end({ timeout: 1 });
  console.log('RESULTS:'+JSON.stringify(results, null, 2));
}

main().catch(err => { console.error('ERROR:'+err.message); process.exit(1); });
