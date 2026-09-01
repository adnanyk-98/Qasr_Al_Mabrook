import { chromium } from 'playwright';

const locales = ['en', 'ar'];
const viewports = [ { width: 430, height: 932 }, { width: 412, height: 915 }, { width: 390, height: 844 } ];

async function inspect(locale: string, viewport: { width: number; height: number }) {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();

  const errors: Array<{ kind: string; message: string }> = [];
  page.on('pageerror', (e) => errors.push({ kind: 'pageerror', message: String(e) }));
  page.on('console', (c) => { if (c.type() === 'error') errors.push({ kind: 'console', message: c.text() }); });

  const url = `http://127.0.0.1:3000/${locale}`;
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForSelector('header');
  await page.waitForSelector('#homepage-hero');

  const headerRectBefore = await page.$eval('header', (el) => {
    const r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top) };
  });

  const heroBefore = await page.$eval('#homepage-hero', (el) => {
    const r = el.getBoundingClientRect();
    return { top: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) };
  });

  // ensure no horizontal overflow initially
  const overflowBefore = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }));

  // open mobile menu (click summary)
  const summary = await page.$('header details summary');
  if (!summary) throw new Error('mobile summary not found');
  await summary.click();
  await page.waitForTimeout(200);

  // measure menu
  const menuRect = await page.$eval('header details nav', (el) => {
    const r = el.getBoundingClientRect();
    return { top: Math.round(r.top), left: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height) };
  }).catch(() => null);

  // elementFromPoint check: pick a point within menu (left+10, top+10) and ensure topmost element is inside nav
  const menuPointCheck = await page.evaluate(() => {
    const nav = document.querySelector('header details nav');
    if (!nav) return { ok: false, reason: 'no-nav' };
    const r = nav.getBoundingClientRect();
    const x = Math.max(1, Math.floor(r.left + 10));
    const y = Math.max(1, Math.floor(r.top + 10));
    const top = document.elementFromPoint(x, y) as HTMLElement | null;
    return { ok: !!top && nav.contains(top), tag: top ? top.tagName : null };
  }).catch(() => ({ ok: false }));

  const heroAfter = await page.$eval('#homepage-hero', (el) => {
    const r = el.getBoundingClientRect();
    return { top: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) };
  });

  const overflowAfter = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }));

  // close menu
  await summary.click();
  await page.waitForTimeout(100);

  await browser.close();
  return { locale, viewport, headerRectBefore, heroBefore, overflowBefore, menuRect, menuPointCheck, heroAfter, overflowAfter, errors };
}

(async () => {
  const results: Array<Awaited<ReturnType<typeof inspect>>> = [];
  for (const locale of locales) {
    for (const vp of viewports) {
      results.push(await inspect(locale, vp));
    }
  }
  console.log(JSON.stringify(results, null, 2));
  process.exit(0);
})();
