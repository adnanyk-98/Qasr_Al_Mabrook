// @ts-nocheck
import { chromium } from 'playwright';

async function getSwitcherText(page) {
  await page.waitForSelector('header');
  const btn = await page.$('header a[aria-label]');
  if (!btn) return null;
  return (await btn.innerText()).trim();
}

async function clickSwitcher(page) {
  const btn = await page.$('header a[aria-label]');
  if (!btn) throw new Error('Locale switcher not found');
  await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), btn.click()]);
}

async function run() {
  const base = process.env.BASE_URL ?? 'http://127.0.0.1:3000';
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Test EN -> AR on homepage
  await page.goto(`${base}/en`, { waitUntil: 'load' });
  const text1 = await getSwitcherText(page);
  console.log('Locale switcher label on /en:', text1);
  if (text1 !== 'AR') {
    console.error('Expected AR on /en but got', text1);
    await browser.close();
    process.exit(2);
  }
  await clickSwitcher(page);
  if (!page.url().startsWith(`${base}/ar`)) {
    console.error('Navigation to /ar failed, url:', page.url());
    await browser.close();
    process.exit(3);
  }
  const text2 = await getSwitcherText(page);
  console.log('Locale switcher label on /ar:', text2);
  if (text2 !== 'EN') {
    console.error('Expected EN on /ar but got', text2);
    await browser.close();
    process.exit(4);
  }

  // Test route preservation for products and categories with query
  await page.goto(`${base}/en/products?category=suits`, { waitUntil: 'load' });
  const labelP = await getSwitcherText(page);
  if (labelP !== 'AR') { console.error('Expected AR on /en/products'); await browser.close(); process.exit(5); }
  await clickSwitcher(page);
  if (!page.url().includes('/ar/products')) { console.error('Products route not preserved:', page.url()); await browser.close(); process.exit(6); }
  if (!page.url().includes('category=suits')) { console.error('Query not preserved on products:', page.url()); await browser.close(); process.exit(7); }

  await page.goto(`${base}/ar/categories?foo=1`, { waitUntil: 'load' });
  const labelC = await getSwitcherText(page);
  if (labelC !== 'EN') { console.error('Expected EN on /ar/categories'); await browser.close(); process.exit(8); }
  await clickSwitcher(page);
  if (!page.url().includes('/en/categories')) { console.error('Categories route not preserved:', page.url()); await browser.close(); process.exit(9); }
  if (!page.url().includes('foo=1')) { console.error('Query not preserved on categories:', page.url()); await browser.close(); process.exit(10); }

  await browser.close();
  console.log('Language switcher E2E passed');
}

run().catch((e) => { console.error(e); process.exit(1); });
