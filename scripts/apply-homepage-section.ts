import { config } from 'dotenv';
config({ path: process.env.DOTENV_CONFIG_PATH ?? '.env.local' });

(async () => {
  const { createHomepageSection } = await import('@/server/repositories/catalog-admin');
  const imageUrl = process.argv[2];
  if (!imageUrl) {
    console.error('Usage: tsx scripts/apply-homepage-section.ts <imageUrl>');
    process.exit(1);
  }

  const section = await createHomepageSection({
    sectionType: 'hero',
    status: 'PUBLISHED',
    sortOrder: '0',
    configurationJson: {
      title: 'Uploaded hero',
      subtitle: 'Uploaded via test',
      description: 'Test upload',
      imageUrl,
      imageAlt: 'Test hero',
      ctaLabel: 'Browse Catalogue',
      ctaHref: '/en/products',
      enabled: true,
    },
  });

  console.log('Created section:', section);
  process.exit(0);
})();
