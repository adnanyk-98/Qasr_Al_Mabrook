require('dotenv').config({ path: '.env.local' });
import { chromium, devices } from 'playwright';
async function fetchPublishedProductsAndCategories() {
  const { db } = await import('../src/db');
  const { eq, asc } = await import('drizzle-orm');
  const { products, categories } = await import('../src/db/schema');

  const prods = await db.select().from(products).where(eq(products.status, 'PUBLISHED'));
  const cats = await db.select().from(categories).where(eq(categories.status, 'PUBLISHED'));

  return { products: prods, categories: cats };
}

function isR2Url(url: string | null | undefined) {
  if (!url) return false;
  return url.startsWith('https://');
}

async function checkPage(page: any, path: string) {
  const res = { path, status: null as number | null, consoleErrors: [] as string[], images: [] as any[], lang: null as string | null, dir: null as string | null, overflow: false };
  page.on('console', (msg: any) => {
    if (msg.type() === 'error') res.consoleErrors.push(msg.text());
  });
  const response = await page.goto(path, { waitUntil: 'networkidle' });
  res.status = response?.status() ?? null;
  res.lang = await page.evaluate(() => document.documentElement.lang || null);
  res.dir = await page.evaluate(() => document.documentElement.dir || null);
  // collect image srcs and check broken via naturalWidth
  const imgs = await page.$$eval('img', (els: any[]) => els.map((el: any) => ({ src: (el as HTMLImageElement).src, alt: (el as HTMLImageElement).alt, naturalWidth: (el as HTMLImageElement).naturalWidth })));
  res.images = imgs;
  // overflow
  res.overflow = await page.evaluate(() => {
    const html = document.documentElement;
    return html.scrollWidth > window.innerWidth + 4;
  });
  return res;
}

(async () => {
  const host = process.env.DEV_HOST ?? 'http://localhost:3000';
  const { products, categories } = await fetchPublishedProductsAndCategories();

  const routes = [
    '/en',
    '/ar',
    '/en/products',
    '/ar/products',
    '/en/categories',
    '/ar/categories',
    '/en/search?q=test',
    '/ar/search?q=test',
    '/en/request-quote',
    '/ar/request-quote',
    '/en/contact-us',
    '/ar/contact-us',
    '/en/about-us',
    '/ar/about-us',
  ];

  // add product pages
  for (const p of products) {
    routes.push(`/en/products/${p.slug}`);
    routes.push(`/ar/products/${p.slug}`);
  }
  // add category pages
  for (const c of categories) {
    routes.push(`/en/categories/${c.slug}`);
    routes.push(`/ar/categories/${c.slug}`);
  }

  const browser = await chromium.launch();
  const report: any[] = [];
  const viewports = [ { name: 'desktop', width: 1440, height: 900 }, { name: 'tablet', width: 768, height: 1024 }, { name: 'mobile', width: 390, height: 844 } ];

  for (const r of routes) {
    const full = host + r;
    for (const vp of viewports) {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();
      try {
        const res = await checkPage(page, full);
        report.push({ route: r, viewport: vp.name, ...res });
        console.log(`[${vp.name}] ${r} status=${res.status} images=${res.images.length} consoleErrors=${res.consoleErrors.length} lang=${res.lang} dir=${res.dir} overflow=${res.overflow}`);
      } catch (e) {
        console.error('Error checking', r, vp.name, e);
        report.push({ route: r, viewport: vp.name, error: String(e) });
      }
      await context.close();
    }
  }

  // product gallery interactions on a subset (first 5)
  const page = await browser.newPage();
  for (const p of products.slice(0, 8)) {
    const url = `${host}/en/products/${p.slug}`;
    try {
      await page.goto(url, { waitUntil: 'networkidle' });
      const mainImg = await page.locator('div.relative > img').first();
      const mainSrc = await mainImg.getAttribute('src');
      const thumbImgs = page.locator('button > div.relative > img');
      const count = await thumbImgs.count();
      console.log(`product ${p.slug} gallery: main=${mainSrc} thumbs=${count}`);
      // click second if exists
      if (count >= 2) {
        const src2 = await thumbImgs.nth(1).getAttribute('src');
        await thumbImgs.nth(1).click();
        await page.waitForTimeout(200);
        const newMain = await mainImg.getAttribute('src');
        console.log(`  clicked thumb 2 -> main now=${newMain} expected=${src2}`);
      }
    } catch (e) {
      console.error('gallery error for', p.slug, e);
    }
  }

  await browser.close();
  // summary
  const failures = report.filter((r) => (r.status && r.status >= 400) || (r.consoleErrors && r.consoleErrors.length > 0) || r.overflow);
  console.log('\n--- Audit Summary ---');
  console.log('routes checked:', routes.length, 'products:', products.length, 'categories:', categories.length);
  console.log('failures:', failures.length);
  failures.slice(0, 30).forEach((f) => console.log(JSON.stringify(f, null, 2)));

  // save brief report to file
  const fs = await import('fs');
  fs.writeFileSync('audit-report.json', JSON.stringify({ routes, products: products.map((p) => ({ id: p.id, slug: p.slug })), categories: categories.map((c) => ({ id: c.id, slug: c.slug })), report, failures }, null, 2));

  console.log('Wrote audit-report.json');
})();
