/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config({ path: '.env.local' });
const pg = require('postgres');
(async () => {
  const url = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;
  if (!url) {
    console.error('No database URL set');
    process.exit(1);
  }
  const sql = pg(url, { ssl: 'require', max: 1, connect_timeout: 20 });
  try {
    const categorySlugs = ['adivasi-oil','cloth-piece','fancy-suit','measuring-tape','pajama'];
    const productSlugs = ['adivasi-oil','cloth-piece','fancy-suit','pajama','5-5m-measuring-tape-green','5m-measuring-tape-green','5m-measuring-tape-orange','7-5m-measuring-tape-green'];
    const cats = await sql`SELECT id,slug,status FROM categories WHERE slug IN (${sql(categorySlugs)}) ORDER BY slug`;
    const prods = await sql`SELECT id,slug,status,brand_id,default_sku FROM products WHERE slug IN (${sql(productSlugs)}) ORDER BY slug`;
    const ids = prods.map(p => p.id);
    const translations = ids.length ? await sql`SELECT product_id,locale,name FROM product_translations WHERE product_id IN (${sql(ids)}) ORDER BY product_id,locale` : [];
    const rel = ids.length ? await sql`SELECT pc.product_id,c.slug FROM product_categories pc JOIN categories c ON c.id = pc.category_id WHERE pc.product_id IN (${sql(ids)}) ORDER BY pc.product_id,c.slug` : [];
    const imgs = ids.length ? await sql`SELECT product_id,object_key,public_url,width,height,is_primary FROM product_images WHERE product_id IN (${sql(ids)}) ORDER BY product_id,sort_order,object_key` : [];
    const dupImg = ids.length ? await sql`SELECT product_id,object_key,COUNT(*)::int AS hits FROM product_images WHERE product_id IN (${sql(ids)}) GROUP BY product_id,object_key HAVING COUNT(*)>1` : [];
    const dupRel = ids.length ? await sql`SELECT product_id,category_id,COUNT(*)::int AS hits FROM product_categories WHERE product_id IN (${sql(ids)}) GROUP BY product_id,category_id HAVING COUNT(*)>1` : [];

    console.log(JSON.stringify({
      categoryCount: cats.length,
      categories: cats,
      productCount: prods.length,
      products: prods.map(p => ({ slug: p.slug, status: p.status, brandId: p.brand_id, defaultSku: p.default_sku })),
      englishTranslationCount: translations.filter(t => t.locale === 'en').length,
      nonEnglishTranslations: translations.filter(t => t.locale !== 'en').length,
      relationshipCount: rel.length,
      relationships: rel,
      imageCount: imgs.length,
      images: imgs.map(i => ({ productId: i.product_id, objectKey: i.object_key, publicUrl: i.public_url, width: i.width, height: i.height, primary: i.is_primary })),
      duplicateImageRows: dupImg,
      duplicateRelationshipRows: dupRel
    }, null, 2));
  } catch (e) {
    console.error('VERIFY_ERROR=' + e.message);
    process.exit(1);
  } finally {
    try { await sql.end({ timeout: 1 }); } catch {};
  }
})();
