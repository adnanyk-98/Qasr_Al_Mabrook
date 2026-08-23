import { chromium } from 'playwright';

const locales = ['en', 'ar'];
const viewports = [
  { width: 1920, height: 1080 },
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
  { width: 430, height: 932 },
  { width: 412, height: 915 },
  { width: 390, height: 844 },
];

const selectors = [
  { name: 'body', sel: 'body' },
  { name: 'header', sel: 'header' },
  { name: 'first-h1', sel: 'h1' },
  { name: 'first-button', sel: 'button' },
  { name: 'footer', sel: 'footer' },
];

async function inspect(locale: string, viewport: { width: number; height: number }) {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const url = `http://127.0.0.1:3000/${locale}`;
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(250);

  const results: any = { locale, viewport, url, fonts: {} };
  for (const s of selectors) {
    const exists = await page.$(s.sel);
    if (!exists) {
      results.fonts[s.name] = null;
      continue;
    }
    const fontFamily = await page.$eval(s.sel, (el) => {
      const cs = window.getComputedStyle(el as Element);
      return cs.fontFamily;
    });
    results.fonts[s.name] = fontFamily;
  }

  await browser.close();
  return results;
}

(async () => {
  const out: any[] = [];
  for (const locale of locales) {
    for (const vp of viewports) {
      try {
        out.push(await inspect(locale, vp));
      } catch (e) {
        out.push({ locale, viewport: vp, error: String(e) });
      }
    }
  }
  console.log(JSON.stringify(out, null, 2));
  process.exit(0);
})();
