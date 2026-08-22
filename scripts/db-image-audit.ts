require('dotenv').config({ path: '.env.local' });

async function run() {
  const { db } = await import('../src/db');
  const { eq } = await import('drizzle-orm');
  const { products, productImages } = await import('../src/db/schema');

  const prods = await db.select().from(products).where(eq(products.status, 'PUBLISHED'));
  const report: any[] = [];
  for (const p of prods) {
    const imgs = await db.select().from(productImages).where(eq(productImages.productId, p.id));
    const primaryCount = imgs.filter((i) => i.isPrimary).length;
    const relativeUrls = imgs.filter((i) => i.publicUrl && i.publicUrl.startsWith('/'));
    report.push({ id: p.id, slug: p.slug, images: imgs.length, primaryCount, relativeUrls: relativeUrls.map((r) => r.publicUrl) });
  }
  report.forEach((r) => console.log(r.slug, 'images=', r.images, 'primaryCount=', r.primaryCount, 'relativeUrls=', r.relativeUrls.length));
  const problems = report.filter((r) => r.images === 0 || r.primaryCount !== 1 || r.relativeUrls.length > 0);
  console.log('\nproblems:', problems.length);
  problems.forEach((p) => console.log(JSON.stringify(p)));
}

run().catch((e)=>{ console.error(e); process.exit(1); });
