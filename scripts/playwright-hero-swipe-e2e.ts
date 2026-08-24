import { chromium, devices } from 'playwright';

async function dispatchPointerSequence(page, selector, seq) {
  // seq: array of { type: 'down'|'move'|'up', x, y, pointerType, pointerId }
  await page.waitForSelector(selector, { timeout: 20000 });
  await page.evaluate(async (sel, s) => {
    const el = document.querySelector(sel);
    if (!el) throw new Error('element not found');
    for (const ev of s) {
      const init: any = {
        clientX: ev.x,
        clientY: ev.y,
        pointerId: ev.pointerId ?? 1,
        pointerType: ev.pointerType ?? 'touch',
        bubbles: true,
        cancelable: true,
      };
      let eventName = 'pointermove';
      if (ev.type === 'down') eventName = 'pointerdown';
      if (ev.type === 'up') eventName = 'pointerup';
      const pe = new PointerEvent(eventName, init);
      el.dispatchEvent(pe);
      // small pause to allow handlers
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, ev.delay ?? 16));
    }
  }, selector, seq);
}

function activeIndicatorIndex(page, heroSelector) {
  return page.evaluate((sel) => {
    const root = document.querySelector(sel);
    if (!root) return -1;
    const btns = Array.from(root.querySelectorAll('button'))
      .filter((b) => b.getAttribute('aria-label')?.startsWith('Go to slide') || b.getAttribute('aria-label')?.includes('الشريحة'));
    for (let i = 0; i < btns.length; i++) {
      const b = btns[i];
      if (b.classList.contains('w-9')) return i;
    }
    return -1;
  }, heroSelector);
}

async function runMobileSwipeTest(base) {
  const iPhone = devices['iPhone 12'];
  const browser = await chromium.launch();
  const context = await browser.newContext({ ...iPhone, locale: 'en-US' });
  const page = await context.newPage();
  await page.goto(`${base}/en`);
  const heroSel = '#homepage-hero';
  await page.waitForSelector(heroSel, { timeout: 20000 });
  const box = await page.locator(heroSel).boundingBox();
  if (!box) throw new Error('Hero bounding box not found');
  const startX = Math.round(box.x + box.width * 0.75);
  const midY = Math.round(box.y + box.height * 0.5);
  const endX = Math.round(box.x + box.width * 0.25);

  const before = await activeIndicatorIndex(page, heroSel);
  await dispatchPointerSequence(page, heroSel, [
    { type: 'down', x: startX, y: midY, pointerType: 'touch', pointerId: 1, delay: 16 },
    { type: 'move', x: endX, y: midY, pointerType: 'touch', pointerId: 1, delay: 50 },
    { type: 'up', x: endX, y: midY, pointerType: 'touch', pointerId: 1, delay: 16 },
  ]);
  await page.waitForTimeout(300);
  const after = await activeIndicatorIndex(page, heroSel);
  console.log('Mobile swipe: before', before, 'after', after);
  await browser.close();
  return { before, after };
}

async function runDesktopDragTest(base) {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${base}/en`);
  const heroSel = '#homepage-hero';
  await page.waitForSelector(heroSel, { timeout: 20000 });
  const box = await page.locator(heroSel).boundingBox();
  if (!box) throw new Error('Hero bounding box not found');
  const startX = Math.round(box.x + box.width * 0.75);
  const midY = Math.round(box.y + box.height * 0.5);
  const endX = Math.round(box.x + box.width * 0.25);

  const before = await activeIndicatorIndex(page, heroSel);
  // use mouse events
  await page.mouse.move(startX, midY);
  await page.mouse.down();
  await page.mouse.move(endX, midY, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(300);
  const after = await activeIndicatorIndex(page, heroSel);
  console.log('Desktop drag: before', before, 'after', after);
  await browser.close();
  return { before, after };
}

async function main() {
  const base = process.env.BASE_URL ?? 'http://127.0.0.1:3000';
  console.log('Running mobile swipe test...');
  const m = await runMobileSwipeTest(base);
  console.log('Mobile result', m);
  console.log('Running desktop drag test...');
  const d = await runDesktopDragTest(base);
  console.log('Desktop result', d);
  // basic assertions
  if (typeof m.before !== 'number' || typeof m.after !== 'number') process.exit(2);
  if (m.after === m.before) {
    console.error('Mobile swipe did not change slide');
    process.exit(3);
  }
  if (d.after === d.before) {
    console.error('Desktop drag did not change slide');
    process.exit(4);
  }
  console.log('Hero swipe/drag basic tests passed');
}

void main();
