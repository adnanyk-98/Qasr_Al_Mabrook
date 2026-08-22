require('dotenv').config({ path: '.env.local' });

(async () => {
  const host = process.env.DEV_HOST ?? 'http://localhost:3000';
  const robots = await (await fetch(host + '/robots.txt')).text();
  const sitemap = await (await fetch(host + '/sitemap.xml')).text();
  console.log('robots.txt:\n', robots.slice(0, 1000));
  console.log('\n--- sitemap.xml snippet:\n', sitemap.slice(0, 1000));
})();
