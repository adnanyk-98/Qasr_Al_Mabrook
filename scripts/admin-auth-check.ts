import 'dotenv/config';
import { chromium } from 'playwright';

(async () => {
  const host = process.env.DEV_HOST ?? 'http://localhost:3000';
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const urls = ['/admin', '/admin/products', '/admin/categories'];
  for (const u of urls) {
    const res = await page.goto(host + u, { waitUntil: 'networkidle' });
    console.log(u, 'status=', res?.status(), 'url=', page.url());
    // simple check for login form presence
    const hasLogin = await page.$('form[action*="/admin/login"]') !== null;
    console.log('  hasLoginForm=', hasLogin);
  }
  await browser.close();
})();
