// @ts-nocheck
import { chromium, devices } from 'playwright';

async function dispatchPointerSequence(page, selector, seq) {
  // seq: array of { type: 'down'|'move'|'up', x, y, pointerType, pointerId }
  await page.waitForSelector(selector, { timeout: 20000 });
  await page.evaluate(async ({ sel, s }) => {
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
  }, { sel: selector, s: seq });
}

function activeIndicatorIndex(page, heroSelector) {
  return page.evaluate((sel) => {
    const root = document.querySelector(sel);
    if (!root) return -1;
    const btns = Array.from(root.querySelectorAll('button')).filter((b) => {
      const al = (b.getAttribute('aria-label') || '').toLowerCase();
      return al.includes('go to slide') || al.includes('الانتقال') || al.includes('الشريحة');
    });
    for (let i = 0; i < btns.length; i++) {
      const b = btns[i];
      try { if ((b as HTMLElement).classList.contains('w-9')) return i; } catch {}
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
  const containerSel = `${heroSel} .relative.w-full.overflow-hidden`;
  await page.waitForSelector(containerSel, { timeout: 20000 });
  const box = await page.locator(heroSel).boundingBox();
  if (!box) throw new Error('Hero bounding box not found');
  const startX = Math.round(box.x + box.width * 0.75);
  const midY = Math.round(box.y + box.height * 0.5);
  const endX = Math.round(box.x + box.width * 0.25);

  const btnCount = await page.evaluate((sel) => {
    const root = document.querySelector(sel);
    if (!root) return 0;
    return root.querySelectorAll('button').length;
  }, heroSel);
  if (btnCount < 2) {
    console.warn('Not enough slides to test swipe (need >=2)');
    await browser.close();
    return { before: 0, after: 0, skipped: true };
  }

  const before = await activeIndicatorIndex(page, heroSel);
  await dispatchPointerSequence(page, containerSel, [
    { type: 'down', x: startX, y: midY, pointerType: 'touch', pointerId: 1, delay: 16 },
    { type: 'move', x: endX, y: midY, pointerType: 'touch', pointerId: 1, delay: 50 },
    { type: 'up', x: endX, y: midY, pointerType: 'touch', pointerId: 1, delay: 16 },
  ]);
  await page.waitForTimeout(300);
  const after = await activeIndicatorIndex(page, heroSel);
  console.log('Mobile swipe: before', before, 'after', after);
  // additional checks: swipe left again, then swipe right to return
  const before2 = after;
  await dispatchPointerSequence(page, containerSel, [
    { type: 'down', x: startX, y: midY, pointerType: 'touch', pointerId: 3, delay: 16 },
    { type: 'move', x: endX, y: midY, pointerType: 'touch', pointerId: 3, delay: 50 },
    { type: 'up', x: endX, y: midY, pointerType: 'touch', pointerId: 3, delay: 16 },
  ]);
  await page.waitForTimeout(300);
  const after2 = await activeIndicatorIndex(page, heroSel);
  console.log('Mobile swipe 2: before', before2, 'after', after2);
  // swipe right (reverse)
  const startRX = Math.round(box.x + box.width * 0.25);
  const endRX = Math.round(box.x + box.width * 0.75);
  await dispatchPointerSequence(page, containerSel, [
    { type: 'down', x: startRX, y: midY, pointerType: 'touch', pointerId: 4, delay: 16 },
    { type: 'move', x: endRX, y: midY, pointerType: 'touch', pointerId: 4, delay: 50 },
    { type: 'up', x: endRX, y: midY, pointerType: 'touch', pointerId: 4, delay: 16 },
  ]);
  await page.waitForTimeout(300);
  const after3 = await activeIndicatorIndex(page, heroSel);
  console.log('Mobile swipe right result:', after3);
  // small movement -> no slide change
  const smallStart = Math.round(box.x + box.width * 0.5);
  await dispatchPointerSequence(page, containerSel, [
    { type: 'down', x: smallStart, y: midY, pointerType: 'touch', pointerId: 5, delay: 8 },
    { type: 'move', x: smallStart + 10, y: midY + 2, pointerType: 'touch', pointerId: 5, delay: 16 },
    { type: 'up', x: smallStart + 10, y: midY + 2, pointerType: 'touch', pointerId: 5, delay: 8 },
  ]);
  await page.waitForTimeout(300);
  const afterSmall = await activeIndicatorIndex(page, heroSel);
  console.log('Mobile small-move result:', afterSmall);
  // vertical move -> no slide change
  await dispatchPointerSequence(page, containerSel, [
    { type: 'down', x: smallStart, y: midY, pointerType: 'touch', pointerId: 6, delay: 8 },
    { type: 'move', x: smallStart + 10, y: midY + 200, pointerType: 'touch', pointerId: 6, delay: 16 },
    { type: 'up', x: smallStart + 10, y: midY + 200, pointerType: 'touch', pointerId: 6, delay: 8 },
  ]);
  await page.waitForTimeout(300);
  const afterVertical = await activeIndicatorIndex(page, heroSel);
  console.log('Mobile vertical-move result:', afterVertical);
  await browser.close();
  return { before, after };
}

async function runDesktopDragTest(base) {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${base}/en`);
  const heroSel = '#homepage-hero';
  const containerSel = `${heroSel} .relative.w-full.overflow-hidden`;
  await page.waitForSelector(containerSel, { timeout: 20000 });
  const box = await page.locator(heroSel).boundingBox();
  if (!box) throw new Error('Hero bounding box not found');
  const startX = Math.round(box.x + box.width * 0.75);
  const midY = Math.round(box.y + box.height * 0.5);
  const endX = Math.round(box.x + box.width * 0.25);

  const btnCount = await page.evaluate((sel) => {
    const root = document.querySelector(sel);
    if (!root) return 0;
    return root.querySelectorAll('button').length;
  }, heroSel);
  if (btnCount < 2) {
    console.warn('Not enough slides to test drag (need >=2)');
    await browser.close();
    return { before: 0, after: 0, skipped: true };
  }

  const before = await activeIndicatorIndex(page, heroSel);
  // dispatch pointer events for mouse to the container so pointer handlers run
  await dispatchPointerSequence(page, containerSel, [
    { type: 'down', x: startX, y: midY, pointerType: 'mouse', pointerId: 2, delay: 8 },
    { type: 'move', x: Math.round((startX + endX) / 2), y: midY, pointerType: 'mouse', pointerId: 2, delay: 16 },
    { type: 'move', x: endX, y: midY, pointerType: 'mouse', pointerId: 2, delay: 16 },
    { type: 'up', x: endX, y: midY, pointerType: 'mouse', pointerId: 2, delay: 8 },
  ]);
  await page.waitForTimeout(300);
  const after = await activeIndicatorIndex(page, heroSel);
  console.log('Desktop drag: before', before, 'after', after);
  // desktop: small move should not change
  const smallStart = Math.round(box.x + box.width * 0.5);
  await dispatchPointerSequence(page, containerSel, [
    { type: 'down', x: smallStart, y: midY, pointerType: 'mouse', pointerId: 7, delay: 8 },
    { type: 'move', x: smallStart + 10, y: midY + 2, pointerType: 'mouse', pointerId: 7, delay: 16 },
    { type: 'up', x: smallStart + 10, y: midY + 2, pointerType: 'mouse', pointerId: 7, delay: 8 },
  ]);
  await page.waitForTimeout(300);
  const afterSmall = await activeIndicatorIndex(page, heroSel);
  console.log('Desktop small-move result:', afterSmall);
  // desktop: swipe right to return if needed
  const startRX = Math.round(box.x + box.width * 0.25);
  const endRX = Math.round(box.x + box.width * 0.75);
  await dispatchPointerSequence(page, containerSel, [
    { type: 'down', x: startRX, y: midY, pointerType: 'mouse', pointerId: 8, delay: 8 },
    { type: 'move', x: endRX, y: midY, pointerType: 'mouse', pointerId: 8, delay: 16 },
    { type: 'up', x: endRX, y: midY, pointerType: 'mouse', pointerId: 8, delay: 8 },
  ]);
  await page.waitForTimeout(300);
  const afterRight = await activeIndicatorIndex(page, heroSel);
  console.log('Desktop swipe right result:', afterRight);
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
