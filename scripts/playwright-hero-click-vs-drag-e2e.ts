// @ts-nocheck
import { chromium, devices } from 'playwright';

async function dispatchPointerSequence(page, selector, seq) {
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

async function ensureClickableFlag(page, anchorSel) {
  await page.waitForSelector(anchorSel, { timeout: 20000 });
  await page.evaluate((sel) => {
    window.__heroClicked = 0;
    const a = document.querySelector(sel);
    if (!a) throw new Error('anchor not found');
    // capture clicks and prevent navigation so test can assert click
    a.addEventListener('click', (e) => {
      e.preventDefault();
      // increment counter
      // @ts-ignore
      window.__heroClicked = (window.__heroClicked || 0) + 1;
    }, { capture: true });
  }, anchorSel);
}

async function getClickCount(page) {
  return page.evaluate(() => (window.__heroClicked || 0));
}

async function runTest() {
  const base = process.env.BASE_URL ?? 'http://127.0.0.1:3000';
  // Mobile click vs swipe
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

  // find the first anchor inside first slide
  const firstAnchorSel = `${heroSel} .w-full.flex > div:nth-child(1) a[href]`;
  const hasAnchor = await page.$(firstAnchorSel);
  if (!hasAnchor) {
    console.warn('No clickable banner found in first slide; aborting');
    await browser.close();
    process.exit(0);
  }
  const href = await page.getAttribute(firstAnchorSel, 'href');

  // ensure click counter hooks are installed
  await ensureClickableFlag(page, firstAnchorSel);

  // get current slide
  const before = await activeIndicatorIndex(page, heroSel);

  // Test 1: Normal click (no movement) should trigger click and NOT change slide
  await page.click(firstAnchorSel);
  await page.waitForTimeout(150);
  const clickCount = await getClickCount(page);
  const afterClickSlide = await activeIndicatorIndex(page, heroSel);

  const normalClickPassed = clickCount === 1 && afterClickSlide === before;
  console.log('TEST Normal Click: clickCount', clickCount, 'before', before, 'after', afterClickSlide);

  // reset counter
  await page.evaluate(() => { window.__heroClicked = 0; });

  // Test 2: Mobile swipe should change slide and NOT trigger click
  const startX = Math.round(box.x + box.width * 0.75);
  const midY = Math.round(box.y + box.height * 0.5);
  const endX = Math.round(box.x + box.width * 0.25);
  const beforeSwipe = await activeIndicatorIndex(page, heroSel);
  await dispatchPointerSequence(page, containerSel, [
    { type: 'down', x: startX, y: midY, pointerType: 'touch', pointerId: 10, delay: 8 },
    { type: 'move', x: endX, y: midY, pointerType: 'touch', pointerId: 10, delay: 20 },
    { type: 'up', x: endX, y: midY, pointerType: 'touch', pointerId: 10, delay: 8 },
  ]);
  await page.waitForTimeout(300);
  const afterSwipe = await activeIndicatorIndex(page, heroSel);
  const clickCountAfterSwipe = await getClickCount(page);
  const mobileSwipePassed = afterSwipe !== beforeSwipe && clickCountAfterSwipe === 0;
  console.log('TEST Mobile Swipe: before', beforeSwipe, 'after', afterSwipe, 'clicks', clickCountAfterSwipe);

  // Test 3: Desktop drag should change slide and NOT trigger click
  // reopen page to reset state and ensure desktop context
  await page.close();
  await context.close();
  const browser2 = await chromium.launch();
  const context2 = await browser2.newContext({ viewport: { width: 1440, height: 900 }, locale: 'en-US' });
  const page2 = await context2.newPage();
  await page2.goto(`${base}/en`);
  await page2.waitForSelector(containerSel, { timeout: 20000 });
  const box2 = await page2.locator(heroSel).boundingBox();
  if (!box2) throw new Error('Hero bounding box not found');
  const firstAnchorSel2 = `${heroSel} .w-full.flex > div:nth-child(1) a[href]`;
  await ensureClickableFlag(page2, firstAnchorSel2);
  const beforeDrag = await activeIndicatorIndex(page2, heroSel);
  const sX = Math.round(box2.x + box2.width * 0.75);
  const mY = Math.round(box2.y + box2.height * 0.5);
  const eX = Math.round(box2.x + box2.width * 0.25);
  await dispatchPointerSequence(page2, containerSel, [
    { type: 'down', x: sX, y: mY, pointerType: 'mouse', pointerId: 11, delay: 8 },
    { type: 'move', x: eX, y: mY, pointerType: 'mouse', pointerId: 11, delay: 20 },
    { type: 'up', x: eX, y: mY, pointerType: 'mouse', pointerId: 11, delay: 8 },
  ]);
  await page2.waitForTimeout(300);
  const afterDrag = await activeIndicatorIndex(page2, heroSel);
  const clicksAfterDrag = await getClickCount(page2);
  const desktopDragPassed = afterDrag !== beforeDrag && clicksAfterDrag === 0;
  console.log('TEST Desktop Drag: before', beforeDrag, 'after', afterDrag, 'clicks', clicksAfterDrag);

  // Test 4: Small movement should not change slide and click should still work
  await page2.evaluate(() => { window.__heroClicked = 0; });
  const box3 = box2;
  const smallStart = Math.round(box3.x + box3.width * 0.5);
  await dispatchPointerSequence(page2, containerSel, [
    { type: 'down', x: smallStart, y: Math.round(box3.y + box3.height * 0.5), pointerType: 'mouse', pointerId: 12, delay: 8 },
    { type: 'move', x: smallStart + 5, y: Math.round(box3.y + box3.height * 0.5) + 2, pointerType: 'mouse', pointerId: 12, delay: 16 },
    { type: 'up', x: smallStart + 5, y: Math.round(box3.y + box3.height * 0.5) + 2, pointerType: 'mouse', pointerId: 12, delay: 8 },
  ]);
  await page2.waitForTimeout(200);
  // now click normally
  await page2.click(firstAnchorSel2);
  await page2.waitForTimeout(150);
  const clicksSmall = await getClickCount(page2);
  const afterSmallSlide = await activeIndicatorIndex(page2, heroSel);
  const smallMovePassed = clicksSmall === 1 && afterSmallSlide === afterDrag;
  console.log('TEST Small Movement: clicks', clicksSmall, 'slideAfter', afterSmallSlide);

  await browser2.close();

  return {
    normalClickPassed,
    mobileSwipePassed,
    desktopDragPassed,
    smallMovePassed,
    details: {
      normal: { before, clickCount, after: afterClickSlide },
      mobile: { before: beforeSwipe, after: afterSwipe, clicks: clickCountAfterSwipe },
      desktop: { before: beforeDrag, after: afterDrag, clicks: clicksAfterDrag },
      small: { clicksSmall, afterSmallSlide },
    },
  };
}

(async () => {
  try {
    const res = await runTest();
    console.log('RESULT', res);
    // enforce pass
    if (!res.normalClickPassed) {
      console.error('Normal click test failed');
      process.exit(2);
    }
    if (!res.mobileSwipePassed) {
      console.error('Mobile swipe test failed');
      process.exit(3);
    }
    if (!res.desktopDragPassed) {
      console.error('Desktop drag test failed');
      process.exit(4);
    }
    if (!res.smallMovePassed) {
      console.error('Small movement test failed');
      process.exit(5);
    }
    console.log('All banner click vs swipe/drag tests passed');
  } catch (e) {
    console.error('Error running test', e);
    process.exit(1);
  }
})();
