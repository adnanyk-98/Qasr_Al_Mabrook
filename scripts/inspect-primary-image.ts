/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config({ path: '.env.local' });

async function run() {
  const { db } = await import('../src/db');
  const { products, productImages } = await import('../src/db/schema');
  const { eq } = await import('drizzle-orm');
  const pg = db; // drizzle db object

  const row = await pg.select().from(products).where(eq(products.slug, 'adivasi-oil'));
  if (!row || row.length === 0) {
    console.error('Product row not found for adivasi-oil');
    process.exit(1);
  }
  console.log('raw product row:', row[0]);
  const pid = row[0]?.primaryImageId;
  console.log('primaryImageId on product:', pid);
  if (pid) {
    const imgs = await pg.select().from(productImages).where(eq(productImages.id, pid));
    console.log('image by primaryImageId:', imgs[0]);
  }
  const all = await pg.select().from(productImages).where(eq(productImages.productId, row[0].id));
  console.log('all images for product:', all);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

export {};
