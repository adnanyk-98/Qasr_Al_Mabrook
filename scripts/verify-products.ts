/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config({ path: '.env.local' });

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
  const { db } = await import('../src/db');
  const { eq, asc } = await import('drizzle-orm');
  const { products, productImages } = await import('../src/db/schema');

  for (const slug of slugs) {
    console.log(`\n--- ${slug} ---`);
    const p = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
    if (!p[0]) {
      console.log('  NOT FOUND');
      continue;
    }
    const product = p[0];
    console.log('  product id:', product.id, 'status:', product.status, 'primaryImageId:', product.primaryImageId);
    const imgs = await db.select().from(productImages).where(eq(productImages.productId, product.id)).orderBy(asc(productImages.sortOrder), asc(productImages.createdAt));
    console.log('  images count:', imgs.length);
    imgs.forEach((img) => {
      console.log('   -', img.id, img.publicUrl, 'isPrimary=', img.isPrimary, 'sortOrder=', img.sortOrder);
    });
  }
}

run().catch((err) => { console.error(err); process.exit(1); });

export {};
