import 'dotenv/config';
import { chromium } from 'playwright';

(async () => {
  const host = process.env.DEV_HOST ?? 'http://localhost:3000';
  const pages = ['/ar/request-quote', '/ar/contact-us'];
  const browser = await chromium.launch();
  for (const p of pages) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const url = host + p;
    await page.goto(url, { waitUntil: 'networkidle' });
    const vals = await page.evaluate(() => ({ innerWidth: window.innerWidth, scrollWidth: document.documentElement.scrollWidth, bodyScrollWidth: document.body.scrollWidth }));
    console.log(p, vals);
    await context.close();
  }
  await browser.close();
})();
