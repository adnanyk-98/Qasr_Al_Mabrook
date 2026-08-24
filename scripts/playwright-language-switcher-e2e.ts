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
    const testIdLocator = page.locator('[data-testid="locale-switcher"]');

    // Helper: find a locale-switch anchor and click it via page.evaluate (robust to missing header)
    async function findAndClickLocale(targetLocale: string) {
      // prefer test id
      const hasTestId = await testIdLocator.count();
      if (hasTestId) {
        const loc = testIdLocator;
        await loc.waitFor({ state: 'visible', timeout: 15000 });
        return loc.click();
      }

      // fallback: find anchor whose href starts with the locale and whose text/aria matches
      const handle = await page.evaluateHandle((locale) => {
        const anchors = Array.from(document.querySelectorAll('a'));
        for (const a of anchors) {
          const href = a.getAttribute('href') || '';
          const txt = (a.textContent || '').trim().toUpperCase();
          const aria = (a.getAttribute('aria-label') || '').trim().toUpperCase();
          if ((href.startsWith('/' + locale) || href === '/' + locale || href === locale) && (txt === locale.toUpperCase() || aria === locale.toUpperCase())) {
            return a;
          }
        }
        return null;
      }, targetLocale);

      const element = handle.asElement();
      if (!element) throw new Error(`Locale switcher anchor for ${targetLocale} not found`);
      await page.evaluate((el) => (el as HTMLElement).click(), element);
      return;
    }

    // click AR
    await page.waitForFunction(() => true); // ensure page script context available
    await findAndClickLocale('ar');
    await page.waitForFunction(() => location.pathname.startsWith('/ar'));

    // verify switcher shows EN and RTL if exposed
    await page.waitForFunction(() => !!document.querySelector('[data-testid="locale-switcher"]') || Array.from(document.querySelectorAll('a')).some(a => ((a.textContent||'').trim().toUpperCase() === 'EN' || (a.getAttribute('aria-label')||'').toUpperCase() === 'EN')) , {}, { timeout: 15000 });
    const textAr = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="locale-switcher"]') || Array.from(document.querySelectorAll('a')).find(a => ((a.textContent||'').trim().toUpperCase() === 'EN' || (a.getAttribute('aria-label')||'').toUpperCase() === 'EN'));
      return el ? (el.textContent || (el.getAttribute('aria-label') || '')) .trim().toUpperCase() : null;
    });
    if (textAr !== 'EN') throw new Error(`Expected switcher text EN on /ar but got "${textAr}"`);
    const dir = await page.evaluate(() => document.documentElement.dir || document.body.dir || '');
    if (dir && dir !== 'rtl') {
      consoleMessages.push(`warning: expected rtl but found dir="${dir}"`);
    }

    // TEST 2: AR -> EN
    await findAndClickLocale('en');
    await page.waitForFunction(() => location.pathname.startsWith('/en'));
    await page.waitForFunction(() => !!document.querySelector('[data-testid="locale-switcher"]') || Array.from(document.querySelectorAll('a')).some(a => ((a.textContent||'').trim().toUpperCase() === 'AR' || (a.getAttribute('aria-label')||'').toUpperCase() === 'AR')) , {}, { timeout: 15000 });

    // TEST 3: PATH PRESERVATION (use about-us page to avoid DB-heavy routes)
    await page.goto(`${base}/en/about-us`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!document.querySelector('[data-testid="locale-switcher"]') || Array.from(document.querySelectorAll('a')).some(a => ((a.textContent||'').trim().toUpperCase() === 'AR' || (a.getAttribute('aria-label')||'').toUpperCase() === 'AR')) , {}, { timeout: 15000 });
    await findAndClickLocale('ar');
    await page.waitForFunction(() => location.pathname.startsWith('/ar/about-us'));
    // go back
    await page.waitForFunction(() => !!document.querySelector('[data-testid="locale-switcher"]') || Array.from(document.querySelectorAll('a')).some(a => ((a.textContent||'').trim().toUpperCase() === 'EN' || (a.getAttribute('aria-label')||'').toUpperCase() === 'EN')) , {}, { timeout: 15000 });
    await findAndClickLocale('en');
    await page.waitForFunction(() => location.pathname.startsWith('/en/about-us'));

    // TEST 4: QUERY PARAMETER PRESERVATION using about-us with query
    await page.goto(`${base}/en/about-us?utm=test`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!document.querySelector('[data-testid="locale-switcher"]') || Array.from(document.querySelectorAll('a')).some(a => ((a.textContent||'').trim().toUpperCase() === 'AR' || (a.getAttribute('aria-label')||'').toUpperCase() === 'AR')) , {}, { timeout: 15000 });
    await findAndClickLocale('ar');
    await page.waitForFunction(() => location.pathname.startsWith('/ar/about-us') && location.search.includes('utm=test'));
    await page.waitForFunction(() => !!document.querySelector('[data-testid="locale-switcher"]') || Array.from(document.querySelectorAll('a')).some(a => ((a.textContent||'').trim().toUpperCase() === 'EN' || (a.getAttribute('aria-label')||'').toUpperCase() === 'EN')) , {}, { timeout: 15000 });
    await findAndClickLocale('en');
    await page.waitForFunction(() => location.pathname.startsWith('/en/about-us') && location.search.includes('utm=test'));

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
