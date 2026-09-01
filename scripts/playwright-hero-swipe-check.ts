import { chromium, type Page } from 'playwright';

const locales = ['en', 'ar'] as const;
const viewports = [
  { width: 1920, height: 1080 },
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
  { width: 430, height: 932 },
  { width: 390, height: 844 },
];

async function activeIndex(page: Page, heroSelector = '#homepage-hero') {
  const idx = await page.$$eval(`${heroSelector} button`, (btns) => {
    for (let i = 0; i < btns.length; i++) {
      const cls = (btns[i] as HTMLButtonElement).className;
      if (String(cls).includes('w-9')) return i;
    }
    return null;
  });
  return idx;
}

async function swipeOn(page: Page, selector: string, startX: number, startY: number, endX: number, endY: number) {
  await page.dispatchEvent(selector, 'pointerdown', { clientX: startX, clientY: startY, pointerId: 1 });
  // few moves
  const steps = 5;
  for (let i = 1; i <= steps; i++) {
    const x = startX + ((endX - startX) * i) / steps;
    const y = startY + ((endY - startY) * i) / steps;
    await page.dispatchEvent(selector, 'pointermove', { clientX: x, clientY: y, pointerId: 1 });
    await page.waitForTimeout(10);
  }
  await page.dispatchEvent(selector, 'pointerup', { clientX: endX, clientY: endY, pointerId: 1 });
}

(async () => {
  const browser = await chromium.launch();
  const results: Array<{ locale: string; viewport: { width: number; height: number }; before: number | null; afterNext: number | null; afterPrev: number | null; afterSmall: number | null; imgSrc: string }> = [];
  for (const locale of locales) {
    for (const vp of viewports) {
      const context = await browser.newContext({ viewport: vp });
      const page = await context.newPage();
      const url = `http://127.0.0.1:3000/${locale}`;
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.waitForSelector('#homepage-hero');
      const heroBox = await page.$eval('#homepage-hero', (el) => el.getBoundingClientRect());
      const start = { x: Math.floor(heroBox.x + heroBox.width * 0.8), y: Math.floor(heroBox.y + heroBox.height / 2) };
      const end = { x: Math.floor(heroBox.x + heroBox.width * 0.2), y: start.y };

      const before = await activeIndex(page);
      // swipe left -> next
      await swipeOn(page, '#homepage-hero', start.x, start.y, end.x, end.y);
      await page.waitForTimeout(300);
      const afterNext = await activeIndex(page);

      // swipe right -> prev
      await swipeOn(page, '#homepage-hero', end.x, start.y, start.x, start.y);
      await page.waitForTimeout(300);
      const afterPrev = await activeIndex(page);

      // small movement should not change
      const smallStart = { x: Math.floor(heroBox.x + heroBox.width * 0.5), y: start.y };
      await swipeOn(page, '#homepage-hero', smallStart.x, smallStart.y, smallStart.x + 10, smallStart.y + 2);
      await page.waitForTimeout(200);
      const afterSmall = await activeIndex(page);

      // record img src for first slide (mobile/desktop behavior)
      const imgSrc = await page.$eval('#homepage-hero img', (img) => (img as HTMLImageElement).currentSrc || (img as HTMLImageElement).src);

      results.push({ locale, viewport: vp, before, afterNext, afterPrev, afterSmall, imgSrc });
      await context.close();
    }
  }
  await browser.close();
  console.log(JSON.stringify(results, null, 2));
  process.exit(0);
})();
