import 'dotenv/config';

import { chromium, type Page } from 'playwright';

async function fetchPublishedProductsAndCategories() {
  const { db } = await import('../src/db');
  const { eq } = await import('drizzle-orm');
  const { products, categories } = await import('../src/db/schema');

  const prods = await db.select().from(products).where(eq(products.status, 'PUBLISHED'));
  const cats = await db.select().from(categories).where(eq(categories.status, 'PUBLISHED'));

  return { products: prods, categories: cats };
}

type CheckImage = { src: string; alt: string; naturalWidth: number };
type CheckPageResult = {
  path: string;
  status: number | null;
  consoleErrors: string[];
  images: CheckImage[];
  lang: string | null;
  dir: string | null;
  overflow: boolean;
};

type ReportItem = Record<string, unknown>;

async function checkPage(page: Page, path: string): Promise<CheckPageResult> {
  const res: CheckPageResult = {
    path,
    status: null,
    consoleErrors: [],
    images: [],
    lang: null,
    dir: null,
    overflow: false,
  };
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      res.consoleErrors.push(msg.text());
    }
  });
  const response = await page.goto(path, { waitUntil: 'networkidle' });
  res.status = response?.status() ?? null;
  res.lang = await page.evaluate(() => document.documentElement.lang || null);
  res.dir = await page.evaluate(() => document.documentElement.dir || null);
  const imgs = await page.$$eval('img', (els: HTMLImageElement[]) =>
    els.map((el) => ({ src: el.src, alt: el.alt, naturalWidth: el.naturalWidth })),
  );
  res.images = imgs;
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

  for (const p of products) {
    routes.push(`/en/products/${p.slug}`);
    routes.push(`/ar/products/${p.slug}`);
  }
  for (const c of categories) {
    routes.push(`/en/categories/${c.slug}`);
    routes.push(`/ar/categories/${c.slug}`);
  }

  const browser = await chromium.launch();
  const report: ReportItem[] = [];
  const viewports = [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 390, height: 844 },
  ] as const;

  for (const r of routes) {
    const full = host + r;
    for (const vp of viewports) {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();
      try {
        const res = await checkPage(page, full);
        report.push({ route: r, viewport: vp.name, ...res });
        console.log(`[${vp.name}] ${r} status=${res.status} images=${res.images.length} consoleErrors=${res.consoleErrors.length} lang=${res.lang} dir=${res.dir} overflow=${res.overflow}`);
      } catch (error) {
        console.error('Error checking', r, vp.name, error);
        report.push({ route: r, viewport: vp.name, error: String(error) });
      }
      await context.close();
    }
  }

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
      if (count >= 2) {
        const src2 = await thumbImgs.nth(1).getAttribute('src');
        await thumbImgs.nth(1).click();
        await page.waitForTimeout(200);
        const newMain = await mainImg.getAttribute('src');
        console.log(`  clicked thumb 2 -> main now=${newMain} expected=${src2}`);
      }
    } catch (error) {
      console.error('gallery error for', p.slug, error);
    }
  }

  await browser.close();
  const failures = report.filter((r) => {
    const status = typeof r.status === 'number' ? Number(r.status) : null;
    const consoleErrors = Array.isArray(r.consoleErrors) ? r.consoleErrors : [];
    return (status !== null && status >= 400) || consoleErrors.length > 0 || Boolean(r.overflow);
  });
  console.log('\n--- Audit Summary ---');
  console.log('routes checked:', routes.length, 'products:', products.length, 'categories:', categories.length);
  console.log('failures:', failures.length);
  failures.slice(0, 30).forEach((f) => console.log(JSON.stringify(f, null, 2)));

  const fs = await import('fs');
  fs.writeFileSync('audit-report.json', JSON.stringify({
    routes,
    products: products.map((p) => ({ id: p.id, slug: p.slug })),
    categories: categories.map((c) => ({ id: c.id, slug: c.slug })),
    report,
    failures,
  }, null, 2));

  console.log('Wrote audit-report.json');
})();
