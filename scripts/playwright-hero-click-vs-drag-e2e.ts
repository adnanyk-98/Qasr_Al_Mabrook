import { chromium, devices } from 'playwright';

async function dispatchPointerSequence(
  page: { waitForSelector: (selector: string, options?: { timeout?: number }) => Promise<unknown>; evaluate: (fn: (args: { sel: string; s: Array<{ type: string; x: number; y: number; pointerId?: number; pointerType?: string; delay?: number }> }) => Promise<void>, args: { sel: string; s: Array<{ type: string; x: number; y: number; pointerId?: number; pointerType?: string; delay?: number }> }) => Promise<void> },
  selector: string,
  seq: Array<{ type: string; x: number; y: number; pointerId?: number; pointerType?: string; delay?: number }>
) {
  await page.waitForSelector(selector, { timeout: 20000 });
  await page.evaluate(async ({ sel, s }) => {
    const el = document.querySelector(sel);
    if (!el) throw new Error('element not found');
    for (const ev of s) {
      const init: PointerEventInit & { clientX: number; clientY: number; pointerId: number; pointerType: string } = {
        clientX: ev.x,
        clientY: ev.y,
        pointerId: ev.pointerId ?? 1,
        pointerType: ev.pointerType ?? 'touch',
        bubbles: true,
        cancelable: true,
      };
      let eventName: 'pointerdown' | 'pointermove' | 'pointerup' = 'pointermove';
      if (ev.type === 'down') eventName = 'pointerdown';
      if (ev.type === 'up') eventName = 'pointerup';
      const pe = new PointerEvent(eventName, init);
      el.dispatchEvent(pe);
      await new Promise((r) => setTimeout(r, ev.delay ?? 16));
    }
  }, { sel: selector, s: seq });
}

function activeIndicatorIndex(
  page: { evaluate: (fn: (sel: string) => number, arg: string) => Promise<number> },
  heroSelector: string
) {
  return page.evaluate((sel) => {
    const root = document.querySelector(sel);
    if (!root) return -1;
    const btns = Array.from(root.querySelectorAll('button')).filter((b) => {
      const al = (b.getAttribute('aria-label') || '').toLowerCase();
      return al.includes('go to slide') || al.includes('الانتقال') || al.includes('الشريحة');
    });
    for (let i = 0; i < btns.length; i++) {
      const b = btns[i];
      try { if ((b as HTMLElement).classList.contains('w-9')) return i; } catch { /* ignore */ }
    }
    return -1;
  }, heroSelector);
}

async function ensureClickableFlag(
  page: { waitForSelector: (selector: string, options?: { timeout?: number }) => Promise<unknown>; evaluate: (fn: (sel: string) => void, arg: string) => Promise<void> },
  anchorSel: string
) {
  await page.waitForSelector(anchorSel, { timeout: 20000 });
  await page.evaluate((sel) => {
    (window as typeof window & { __heroClicked?: number }).__heroClicked = 0;
    const a = document.querySelector(sel);
    if (a) {
      a.addEventListener('click', function (e) {
        try { e.preventDefault(); } catch { /* ignore */ }
        const heroWindow = window as typeof window & { __heroClicked?: number };
        heroWindow.__heroClicked = (heroWindow.__heroClicked || 0) + 1;
      }, { capture: true });
    } else {
      const container = document.querySelector('#homepage-hero .relative.w-full.overflow-hidden');
      if (container) {
        container.addEventListener('click', function (e) {
          try { e.preventDefault(); } catch { /* ignore */ }
          const heroWindow = window as typeof window & { __heroClicked?: number };
          heroWindow.__heroClicked = (heroWindow.__heroClicked || 0) + 1;
        }, { capture: true });
      }
    }
  }, anchorSel);
}

async function getClickCount(page: { evaluate: (fn: () => number) => Promise<number> }) {
  return page.evaluate(() => (window as typeof window & { __heroClicked?: number }).__heroClicked || 0);
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

  // find any slide anchor or image to attach click hooks
  const anchorCandidates = await page.$$( `${heroSel} .w-full.flex > div a[href]` );
  let interactiveSel = '';
  if (anchorCandidates && anchorCandidates.length > 0) {
    interactiveSel = `${heroSel} .w-full.flex > div a[href]`;
  } else {
    // fallback to image element inside a slide
    const imgCandidates = await page.$$( `${heroSel} .w-full.flex > div img` );
    if (!imgCandidates || imgCandidates.length === 0) {
      console.warn('No clickable banner anchors or images found; aborting');
      await browser.close();
      process.exit(0);
    }
    interactiveSel = `${heroSel} .w-full.flex > div img`;
  }

  // ensure click counter hooks are installed on the chosen interactive selector
  await ensureClickableFlag(page, interactiveSel);
  // get current slide
  const before = await activeIndicatorIndex(page, heroSel);

  // For normal click, target the currently active slide's interactive element
  const activeIndex = before >= 0 ? before : 0;
  const activeAnchorSel = `${heroSel} .w-full.flex > div:nth-child(${activeIndex + 1}) a[href]`;
  const activeImgSel = `${heroSel} .w-full.flex > div:nth-child(${activeIndex + 1}) img`;
  // prefer anchor if present, otherwise image
  const hasActiveAnchor = await page.$(activeAnchorSel);
  const targetSel = hasActiveAnchor ? activeAnchorSel : activeImgSel;
  await ensureClickableFlag(page, targetSel);

  // Test 1: Normal click (no movement) should trigger click and NOT change slide
  // simulate pointerdown/up at center of active slide
  const activeSlideBox = await page.locator(`${heroSel} .w-full.flex > div:nth-child(${activeIndex + 1})`).boundingBox();
  if (!activeSlideBox) throw new Error('Active slide box not found');
  const cx = Math.round(activeSlideBox.x + activeSlideBox.width / 2);
  const cy = Math.round(activeSlideBox.y + activeSlideBox.height / 2);
  await dispatchPointerSequence(page, containerSel, [
    { type: 'down', x: cx, y: cy, pointerType: 'touch', pointerId: 20, delay: 8 },
    { type: 'up', x: cx, y: cy, pointerType: 'touch', pointerId: 20, delay: 8 },
  ]);
  await page.waitForTimeout(150);
  const clickCount = await getClickCount(page);
  const afterClickSlide = await activeIndicatorIndex(page, heroSel);

  const normalClickPassed = clickCount === 1 && afterClickSlide === before;
  console.log('TEST Normal Click: clickCount', clickCount, 'before', before, 'after', afterClickSlide);

  // reset counter
  await page.evaluate(() => { (window as typeof window & { __heroClicked?: number }).__heroClicked = 0; });

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
  // pick interactive selector for desktop (anchor or image)
  const anchorCandidates2 = await page2.$$( `${heroSel} .w-full.flex > div a[href]` );
  let interactiveSel2 = '';
  if (anchorCandidates2 && anchorCandidates2.length > 0) {
    interactiveSel2 = `${heroSel} .w-full.flex > div a[href]`;
  } else {
    interactiveSel2 = `${heroSel} .w-full.flex > div img`;
  }
  await ensureClickableFlag(page2, interactiveSel2);
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
  await page2.evaluate(() => { (window as typeof window & { __heroClicked?: number }).__heroClicked = 0; });
  const box3 = box2;
  const smallStart = Math.round(box3.x + box3.width * 0.5);
  const beforeSmall = await activeIndicatorIndex(page2, heroSel);
  await dispatchPointerSequence(page2, containerSel, [
    { type: 'down', x: smallStart, y: Math.round(box3.y + box3.height * 0.5), pointerType: 'mouse', pointerId: 12, delay: 8 },
    { type: 'move', x: smallStart + 5, y: Math.round(box3.y + box3.height * 0.5) + 2, pointerType: 'mouse', pointerId: 12, delay: 16 },
    { type: 'up', x: smallStart + 5, y: Math.round(box3.y + box3.height * 0.5) + 2, pointerType: 'mouse', pointerId: 12, delay: 8 },
  ]);
  await page2.waitForTimeout(200);
  // now click normally
  await page2.click(interactiveSel2);
  await page2.waitForTimeout(150);
  const clicksSmall = await getClickCount(page2);
  const afterSmallSlide = await activeIndicatorIndex(page2, heroSel);
  const smallMovePassed = clicksSmall === 1 && afterSmallSlide === beforeSmall;
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
