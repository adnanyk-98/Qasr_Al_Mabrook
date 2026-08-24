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
  // write a placeholder log (caller may append console messages)
  fs.writeFileSync(log, `URL: ${page.url()}\n\n`);
  return { png, html, log };
}

async function runViewport(viewport: { width: number; height: number } | null, label: string) {
  const browser = await chromium.launch();
  const context = await browser.newContext(viewport ? { viewport } : {});
  const page = await context.newPage();

  const consoleMessages: string[] = [];
  page.on('console', (m) => consoleMessages.push(`${m.type()}: ${m.text()}`));
  page.on('pageerror', (e) => consoleMessages.push(`pageerror: ${e.message}`));
  const networkEvents: string[] = [];
  page.on('requestfailed', (req) => networkEvents.push(`requestfailed: ${req.url()} ${req.failure()?.errorText || ''}`));
  page.on('response', (res) => { if (res.status && res.status() >= 400) networkEvents.push(`response ${res.status()}: ${res.url()}`); });

  try {
    // TEST 1: EN -> AR (probe candidate pages until locale-switcher appears)
    // prefer the locale root first; avoid pages that sometimes render a NEXT_HTTP_ERROR_FALLBACK
    const candidates = [
      `${base}/en`,
      `${base}/en/about-us`,
      `${base}/about-us`,
      `${base}/`,
    ];
    let found = false;
    const testIdLocator = page.locator('[data-testid="locale-switcher"]');
    for (const c of candidates) {
      try {
        const resp = await page.goto(c, { waitUntil: 'networkidle' });
        // if server returned non-200, try next candidate
        if (resp && resp.status() !== 200) continue;
        // also ensure the server did not render a Next.js error fallback page
        const body = await page.content();
        if (body.includes('NEXT_HTTP_ERROR_FALLBACK') || body.includes('Page not found') || body.includes('next-error')) {
          continue;
        }
      } catch (e) {
        // ignore navigation errors and try next
        continue;
      }
      if (await waitForSwitcherPresence.call(null, 10000)) {
        found = true;
        break;
      }
    }
    if (!found) {
      // final attempt: go to canonical en root and wait longer
      await page.goto(`${base}/en`, { waitUntil: 'networkidle' });
    }

    async function waitForSwitcherPresence(maxMs = 20000) {
      const start = Date.now();
      while (Date.now() - start < maxMs) {
        const ok = await page.evaluate(() => !!document.querySelector('[data-testid="locale-switcher"]') || Array.from(document.querySelectorAll('a')).some(a => ((a.textContent||'').trim().toUpperCase() === 'AR' || (a.getAttribute('aria-label')||'').toUpperCase() === 'AR')));
        if (ok) return true;
        await new Promise((r) => setTimeout(r, 300));
      }
      return false;
    }

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

    // ensure switcher present then click AR
    const present = await waitForSwitcherPresence();
    if (!present) throw new Error('Locale switcher not found on page');
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
    // append console messages and error to the log file
    try {
      const logText = [
        `Error: ${err.message}`,
        `URL: ${page.url()}`,
        '',
        'Console messages:',
        ...consoleMessages,
        '',
        'Network events:',
        ...networkEvents,
      ].join('\n');
      fs.appendFileSync(files.log, logText);
    } catch (e) {
      // ignore logging errors
    }
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
