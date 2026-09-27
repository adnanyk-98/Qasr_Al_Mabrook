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
    const overflows = await page.evaluate(() => {
      const winW = window.innerWidth;
      const nodes: Array<{ selector: string; width: number; tag: string }> = [];
      const all = Array.from(document.querySelectorAll('*')) as Element[];
      for (const el of all) {
        const r = (el as HTMLElement).getBoundingClientRect?.();
        if (!r) continue;
        if (r.width > winW + 2) {
          let s = el.tagName.toLowerCase();
          if (el.id) s += `#${el.id}`;
          if (el.className && typeof el.className === 'string') s += `.${el.className.split(' ').slice(0,3).join('.')}`;
          nodes.push({ selector: s, width: r.width, tag: el.tagName });
        }
      }
      return nodes.slice(0, 20);
    });
    console.log(p, 'overflows:', overflows.length);
    overflows.forEach((o) => console.log(' -', o.selector, 'width=', o.width));
    await page.screenshot({ path: `screenshot${p.replace(/\W/g,'_')}.png`, fullPage: true });
    await context.close();
  }
  await browser.close();
})();
