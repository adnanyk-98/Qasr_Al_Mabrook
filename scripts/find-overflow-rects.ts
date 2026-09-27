import { config } from 'dotenv';

config({ path: '.env.local' });
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
    const items = await page.evaluate(() => {
      const winW = window.innerWidth;
      const out: Array<{ selector: string; left: number; right: number; width: number }> = [];
      const all = Array.from(document.querySelectorAll('*')) as Element[];
      for (const el of all) {
        const rect = (el as HTMLElement).getBoundingClientRect?.();
        if (!rect) continue;
        if (rect.right > winW + 1 || rect.left < -1) {
          let s = el.tagName.toLowerCase();
          if (el.id) s += `#${el.id}`;
          if (el.className && typeof el.className === 'string') s += `.${el.className.split(' ').slice(0,3).join('.')}`;
          out.push({ selector: s, left: rect.left, right: rect.right, width: rect.width });
        }
      }
      return out.slice(0,30);
    });
    console.log(p, 'found elements:', items.length);
    items.forEach((it) => console.log(' -', it.selector, 'left=', it.left, 'right=', it.right, 'width=', it.width));
    await page.screenshot({ path: `overflow_${p.replace(/\W/g,'_')}.png`, fullPage: true });
    await context.close();
  }
  await browser.close();
})();
