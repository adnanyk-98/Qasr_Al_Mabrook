// @ts-nocheck
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const base = process.env.BASE_URL ?? 'http://127.0.0.1:3000';

function mkDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function run() {
  const dir = path.resolve(process.cwd(), 'tmp');
  mkDir(dir);
  const ts = Date.now();
  const jsonPath = path.join(dir, `locale-diagnostic-${ts}.json`);
  const pngPath = path.join(dir, `locale-diagnostic-${ts}.png`);
  const htmlPath = path.join(dir, `locale-diagnostic-${ts}.html`);

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const events: any[] = [];

  page.on('request', (req) => {
    events.push({ type: 'request', time: Date.now(), url: req.url(), method: req.method(), resourceType: req.resourceType() });
  });

  page.on('response', async (res) => {
    try {
      const url = res.url();
      const status = res.status();
      const ct = (res.headers()['content-type'] || '').toLowerCase();
      let body = null;
      // only capture bodies for HTML, JSON, or RSC (text/x-component)
      if (ct.includes('text/html') || ct.includes('application/json') || ct.includes('text/x-component') || url.includes('/en/about-us')) {
        try { body = await res.text(); } catch (e) { body = `<unreadable: ${e.message}>`; }
      }
      events.push({ type: 'response', time: Date.now(), url, status, contentType: ct, bodySummary: body ? (body.slice(0, 5000)) : null });
    } catch (e) {
      events.push({ type: 'response', time: Date.now(), error: e.message });
    }
  });

  page.on('requestfailed', (req) => {
    events.push({ type: 'requestfailed', time: Date.now(), url: req.url(), failure: req.failure()?.errorText });
  });

  const consoleMessages: string[] = [];
  page.on('console', (msg) => { consoleMessages.push(`${msg.type()}: ${msg.text()}`); events.push({ type: 'console', time: Date.now(), text: msg.text(), severity: msg.type() }); });
  page.on('pageerror', (err) => { consoleMessages.push(`pageerror: ${err.message}`); events.push({ type: 'pageerror', time: Date.now(), message: err.message, stack: err.stack }); });

  // Navigate to /en/about-us and record
  const target = `${base}/en/about-us`;
  const startTs = Date.now();
  let mainResp = null;
  try {
    mainResp = await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 30000 });
    events.push({ type: 'navigation', time: Date.now(), url: target, status: mainResp ? mainResp.status() : null });
  } catch (e) {
    events.push({ type: 'navigation_error', time: Date.now(), url: target, error: e.message });
  }

  // capture snapshot & HTML
  try { await page.screenshot({ path: pngPath, fullPage: true }); } catch (e) { /* ignore */ }
  try { const content = await page.content(); fs.writeFileSync(htmlPath, content); } catch (e) { /* ignore */ }

  // reload and do a client-side navigation to simulate app behavior
  try {
    await page.reload({ waitUntil: 'domcontentloaded' });
    events.push({ type: 'reload', time: Date.now() });
  } catch (e) {
    events.push({ type: 'reload_error', time: Date.now(), error: e.message });
  }

  // attempt a client-side navigation: navigate to /en then click about-us link if present
  try {
    await page.goto(`${base}/en`, { waitUntil: 'domcontentloaded' });
    // try to find an anchor to about-us and click
    const handle = await page.$('a[href$="/about-us"]');
    if (handle) {
      await Promise.all([page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 5000 }), handle.click()]);
      events.push({ type: 'client_nav', time: Date.now(), url: page.url() });
    } else {
      events.push({ type: 'client_nav_skipped', time: Date.now(), reason: 'no-about-us-link' });
    }
  } catch (e) {
    events.push({ type: 'client_nav_error', time: Date.now(), error: e.message });
  }

  // write diagnostic JSON including console messages
  const out = { startedAt: startTs, base, events, consoleMessages };
  fs.writeFileSync(jsonPath, JSON.stringify(out, null, 2));

  await context.close();
  await browser.close();

  console.log('Diagnostic saved:', { jsonPath, pngPath, htmlPath });
}

run().catch((e) => { console.error(e); process.exit(1); });
