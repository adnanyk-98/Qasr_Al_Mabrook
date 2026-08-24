// @ts-nocheck
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const base = process.env.BASE_URL ?? 'http://127.0.0.1:3000';

async function captureFailure(page, name) {
  const dir = path.resolve(process.cwd(), 'tmp');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const png = path.join(dir, `lang-switcher-${name}.png`);
  const html = path.join(dir, `lang-switcher-${name}.html`);
  const log = path.join(dir, `lang-switcher-${name}.log`);
  await page.screenshot({ path: png, fullPage: true });
  const content = await page.content();
  fs.writeFileSync(html, content);
  return { png, html, log };
}

async function runViewport(viewport: { width: number; height: number } | null, label: string) {
  const browser = await chromium.launch();
  const context = await browser.newContext(viewport ? { viewport } : {});
  const page = await context.newPage();

  const consoleMessages: string[] = [];
  page.on('console', (m) => consoleMessages.push(`${m.type()}: ${m.text()}`));
  page.on('pageerror', (e) => consoleMessages.push(`pageerror: ${e.message}`));

  try {
    // TEST 1: EN -> AR
    await page.goto(`${base}/en`, { waitUntil: 'networkidle' });

    const switcherEn = (await page.getByTestId('locale-switcher').catch(() => null)) ?? page.getByRole('link', { name: 'AR', exact: true });
    await switcherEn.waitFor({ state: 'visible', timeout: 15000 });
    const text = (await switcherEn.innerText()).trim();
    if (text !== 'AR') throw new Error(`Expected switcher text AR on /en but got "${text}"`);

    const waitForAr = page.waitForFunction(() => location.pathname.startsWith('/ar'));
    await switcherEn.click();
    await waitForAr;

    // verify switcher shows EN and RTL if exposed
    const switcherAr = (await page.getByTestId('locale-switcher').catch(() => null)) ?? page.getByRole('link', { name: 'EN', exact: true });
    await switcherAr.waitFor({ state: 'visible', timeout: 15000 });
    const textAr = (await switcherAr.innerText()).trim();
    if (textAr !== 'EN') throw new Error(`Expected switcher text EN on /ar but got "${textAr}"`);
    const dir = await page.evaluate(() => document.documentElement.dir || document.body.dir || '');
    if (dir && dir !== 'rtl') {
      consoleMessages.push(`warning: expected rtl but found dir="${dir}"`);
    }

    // TEST 2: AR -> EN
    const waitForEn = page.waitForFunction(() => location.pathname.startsWith('/en'));
    await switcherAr.click();
    await waitForEn;
    const switcherBack = (await page.getByTestId('locale-switcher').catch(() => null)) ?? page.getByRole('link', { name: 'AR', exact: true });
    await switcherBack.waitFor({ state: 'visible', timeout: 15000 });

    // TEST 3: PATH PRESERVATION (use products listing page)
    await page.goto(`${base}/en/products`, { waitUntil: 'networkidle' });
    const switcherP = (await page.getByTestId('locale-switcher').catch(() => null)) ?? page.getByRole('link', { name: 'AR', exact: true });
    await switcherP.waitFor({ state: 'visible', timeout: 15000 });
    const waitForArProducts = page.waitForFunction(() => location.pathname.startsWith('/ar/products'));
    await switcherP.click();
    await waitForArProducts;
    // go back
    const switcherProductsAr = (await page.getByTestId('locale-switcher').catch(() => null)) ?? page.getByRole('link', { name: 'EN', exact: true });
    await switcherProductsAr.waitFor({ state: 'visible', timeout: 15000 });
    const waitForEnProducts = page.waitForFunction(() => location.pathname.startsWith('/en/products'));
    await switcherProductsAr.click();
    await waitForEnProducts;

    // TEST 4: QUERY PARAMETER PRESERVATION
    await page.goto(`${base}/en/products?category=test`, { waitUntil: 'networkidle' });
    const switcherQ = (await page.getByTestId('locale-switcher').catch(() => null)) ?? page.getByRole('link', { name: 'AR', exact: true });
    await switcherQ.waitFor({ state: 'visible', timeout: 15000 });
    const waitForArProductsWithQuery = page.waitForFunction(() => location.pathname.startsWith('/ar/products') && location.search.includes('category=test'));
    await switcherQ.click();
    await waitForArProductsWithQuery;
    const waitForEnProductsWithQuery = page.waitForFunction(() => location.pathname.startsWith('/en/products') && location.search.includes('category=test'));
    const switcherQBack = (await page.getByTestId('locale-switcher').catch(() => null)) ?? page.getByRole('link', { name: 'EN', exact: true });
    await switcherQBack.waitFor({ state: 'visible', timeout: 15000 });
    await switcherQBack.click();
    await waitForEnProductsWithQuery;

    await context.close();
    await browser.close();
    console.log(`Viewport ${label}: PASS`);
    return { success: true, label };
  } catch (err) {
    const files = await captureFailure(page, label.replace(/\s+/g, '-'));
    console.error(`Viewport ${label}: FAIL`, err.message);
    console.error('Saved artifacts:', files);
    await context.close();
    await browser.close();
    console.error('Console log snapshot:\n', consoleMessages.join('\n'));
    return { success: false, label, error: err.message, files, consoleMessages };
  }
}

async function runAll() {
  const desktop = { width: 1280, height: 800 };
  const mobile = { width: 390, height: 844 };

  // Run desktop then mobile
  const desktopResult = await runViewport(desktop, 'desktop');
  const mobileResult = await runViewport(mobile, 'mobile');

  if (!desktopResult.success || !mobileResult.success) process.exit(2);
  console.log('All viewports passed');
}

runAll().catch((e) => { console.error(e); process.exit(1); });
