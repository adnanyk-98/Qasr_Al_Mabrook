/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config({ path: '.env.local' });

async function run() {
  const { listPublishedProducts, getProductBySlug, listProductImagesForPublic } = await import('../src/server/repositories/public-catalog');
  const locale = 'en';
  console.log('Fetching featured products...');
  const featured = await listPublishedProducts(locale, { limit: 20 });
  const product = featured.find((p) => p.slug === 'adivasi-oil');
  console.log('Featured product shape:', product);

  console.log('\nFetching product by slug...');
  const detail = await getProductBySlug(locale, 'adivasi-oil');
  if (!detail) {
    console.error('Product detail not found for adivasi-oil');
    process.exit(1);
  }
  console.log('Product detail shape:', detail);

  console.log('\nListing product images (public)');
  const images = await listProductImagesForPublic(detail.id);
  console.log('Product images for public:', images);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

export {};
