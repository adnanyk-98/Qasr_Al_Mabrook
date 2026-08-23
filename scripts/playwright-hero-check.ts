import { chromium } from 'playwright';

const locales = ['en', 'ar'];
const desktopViewports = [ { width: 1920, height: 1080 }, { width: 1440, height: 900 }, { width: 1024, height: 768 } ];
const mobileViewports = [ { width: 430, height: 932 }, { width: 390, height: 844 } ];

async function inspect(locale: string, viewport: { width: number; height: number }) {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const url = `http://127.0.0.1:3000/${locale}`;
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForSelector('#homepage-hero');

  const slideCount = await page.$$eval('#homepage-hero .min-w-full', els => els.length);
  const imgs = await page.$$eval('#homepage-hero .min-w-full img', nodes => nodes.map(n => ({ currentSrc: (n as HTMLImageElement).currentSrc, naturalWidth: (n as HTMLImageElement).naturalWidth, naturalHeight: (n as HTMLImageElement).naturalHeight })));

  const heroRect = await page.$eval('#homepage-hero', (el) => {
    const r = (el as HTMLElement).getBoundingClientRect();
    return { width: Math.round(r.width), height: Math.round(r.height) };
  }).catch(() => null);
  const metrics = await page.evaluate(() => {
    const dpr = window.devicePixelRatio;
    const vvs = (window as any).visualViewport ? (window as any).visualViewport.scale ?? null : null;
    const hero = document.querySelector('#homepage-hero') as HTMLElement | null;
    const heroStyle = hero ? getComputedStyle(hero) : null;
    const aspectBox = hero ? hero.querySelector('[class*="aspect-"]') as HTMLElement | null : null;
    const aspectRect = aspectBox ? aspectBox.getBoundingClientRect() : null;
    return {
      devicePixelRatio: dpr,
      visualViewportScale: vvs,
      heroComputed: heroStyle ? { width: heroStyle.width, height: heroStyle.height, paddingTop: heroStyle.paddingTop, paddingBottom: heroStyle.paddingBottom } : null,
      aspectRect: aspectRect ? { width: Math.round(aspectRect.width), height: Math.round(aspectRect.height) } : null,
    };
  }).catch(() => null);

  const diagnostics = await page.evaluate(() => {
    const root = document.getElementById('homepage-hero');
    const flex = root ? root.querySelector('.flex') as HTMLElement | null : null;
    const firstSlide = root ? root.querySelector('.min-w-full') as HTMLElement | null : null;
    const aspectBox = firstSlide ? firstSlide.querySelector('[class*="aspect-"]') as HTMLElement | null : null;
    return {
      flexRect: flex ? { w: Math.round(flex.getBoundingClientRect().width), h: Math.round(flex.getBoundingClientRect().height) } : null,
      flexStyleWidth: flex ? getComputedStyle(flex).width : null,
      slideRect: firstSlide ? { w: Math.round(firstSlide.getBoundingClientRect().width), h: Math.round(firstSlide.getBoundingClientRect().height) } : null,
      slideStyleWidth: firstSlide ? getComputedStyle(firstSlide).width : null,
      aspectBoxHtml: aspectBox ? aspectBox.outerHTML.slice(0,400) : null,
    };
  }).catch(() => null);

  // determine active image by checking which image has naturalWidth>0 and is visible via getBoundingClientRect
  const active = await page.evaluate(() => {
    const slides = Array.from(document.querySelectorAll('#homepage-hero .min-w-full'));
    for (let i = 0; i < slides.length; i++) {
      const el = slides[i] as HTMLElement;
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) return i;
    }
    return 0;
  });

  const firstImg = await page.$('#homepage-hero .min-w-full img');
  const firstSrc = firstImg ? await firstImg.evaluate((n: HTMLImageElement) => ({ currentSrc: n.currentSrc, naturalWidth: n.naturalWidth, naturalHeight: n.naturalHeight })) : null;

  // click next and observe change
  const nextBtn = await page.$('#homepage-hero button[aria-label*="Next"]') || await page.$('#homepage-hero button:has-text("›")');
  let afterNextSrc = null;
  if (nextBtn) {
    await nextBtn.click();
    await page.waitForTimeout(600);
    const img = await page.$('#homepage-hero .min-w-full img');
    afterNextSrc = img ? await img.evaluate((n: HTMLImageElement) => n.currentSrc) : null;
  }

  await browser.close();
  return { locale, viewport, slideCount, imgs, heroRect, metrics, diagnostics, active, firstSrc, afterNextSrc };
}

(async () => {
  const results: any[] = [];
  for (const locale of locales) {
    for (const vp of desktopViewports) {
      results.push(await inspect(locale, vp));
    }
    for (const vp of mobileViewports) {
      results.push(await inspect(locale, vp));
    }
  }
  console.log(JSON.stringify(results, null, 2));
  process.exit(0);
})();
