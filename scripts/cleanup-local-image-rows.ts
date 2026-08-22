/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config({ path: '.env.local' });

// Products to check
const slugs = [
  'adivasi-oil',
  'cloth-piece',
  'fancy-suit',
  'pajama',
  '5-5m-measuring-tape-green',
  '5m-measuring-tape-green',
  '5m-measuring-tape-orange',
  '7-5m-measuring-tape-green',
];

async function run() {
  const { eq, inArray, asc } = await import('drizzle-orm');
  const { db } = await import('../src/db');
  const { products, productImages } = await import('../src/db/schema');

  for (const slug of slugs) {
    console.log(`\n--- Processing ${slug} ---`);
    const prod = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
    if (!prod[0]) {
      console.log(`Product not found: ${slug}`);
      continue;
    }
    const product = prod[0];
    const imgs = await db.select().from(productImages).where(eq(productImages.productId, product.id)).orderBy(asc(productImages.sortOrder), asc(productImages.createdAt));
    if (!imgs || imgs.length === 0) {
      console.log('  No images found, skipping');
      continue;
    }

    const r2Rows = imgs.filter((i) => typeof i.publicUrl === 'string' && /^https?:\/\//i.test(i.publicUrl));
    const localRows = imgs.filter((i) => !/^https?:\/\//i.test(String(i.publicUrl)));

    console.log(`  Found ${r2Rows.length} R2 rows and ${localRows.length} local rows`);

    if (r2Rows.length === 0) {
      console.log('  No R2 rows present; skipping deletion to avoid data loss');
      continue;
    }

    if (localRows.length > 0) {
      const idsToDelete = localRows.map((r) => r.id);
      console.log(`  Deleting ${idsToDelete.length} local rows: ${idsToDelete.join(', ')}`);
      await db.delete(productImages).where(inArray(productImages.id, idsToDelete));
    }

    // Re-fetch current rows for this product
    const remaining = await db.select().from(productImages).where(eq(productImages.productId, product.id)).orderBy(asc(productImages.sortOrder), asc(productImages.createdAt));

    // Ensure exactly one isPrimary
    const primaries = remaining.filter((r) => r.isPrimary);
    if (primaries.length === 0 && remaining.length > 0) {
      console.log('  No primary image found, setting first as primary');
      await db.update(productImages).set({ isPrimary: true }).where(eq(productImages.id, remaining[0].id));
    } else if (primaries.length > 1) {
      // keep the earliest primary, clear others
      const keep = primaries[0].id;
      const others = primaries.slice(1).map((r) => r.id);
      console.log(`  Multiple primaries found, keeping ${keep} and clearing ${others.join(', ')}`);
      for (const oid of others) {
        await db.update(productImages).set({ isPrimary: false }).where(eq(productImages.id, oid));
      }
    }

    // Normalize sort order
    const finalRows = await db.select().from(productImages).where(eq(productImages.productId, product.id)).orderBy(asc(productImages.sortOrder), asc(productImages.createdAt));
    for (let i = 0; i < finalRows.length; i++) {
      const desired = i + 1;
      if ((finalRows[i].sortOrder ?? 0) !== desired) {
        console.log(`  Updating sortOrder for ${finalRows[i].id} -> ${desired}`);
        await db.update(productImages).set({ sortOrder: desired }).where(eq(productImages.id, finalRows[i].id));
      }
    }

    console.log(`  Finished processing ${slug}`);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

export {};
