import { chromium } from 'playwright';

const host = process.env.DEV_HOST ?? 'http://localhost:3000';

async function checkProduct(slug: string) {
  const url = `${host}/en/products/${slug}`;
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });

  // Find main image (the Image component uses img[data-testid=main-image]? not present)
  // We'll query the visible large image by looking for div with relative class and img inside
  const mainImg = await page.locator('div.relative > img').first();
  const mainSrc = await mainImg.getAttribute('src');
  console.log(`${slug} main image initial: ${mainSrc}`);

  // thumbnails: buttons with images inside
  const thumbs = page.locator('button > div.relative > img');
  const count = await thumbs.count();
  console.log(`${slug} thumbnails count: ${count}`);
  if (count < 2) {
    console.log('  Not enough thumbnails to test interactions');
    await browser.close();
    return;
  }

  // click second thumbnail (index 1)
  const thumb1 = thumbs.nth(1);
  const thumb1src = await thumb1.getAttribute('src');
  await thumb1.click();
  await page.waitForTimeout(250);
  const mainAfter1 = await mainImg.getAttribute('src');
  console.log(`  clicked thumb 2 src=${thumb1src} main now=${mainAfter1}`);

  // click third if exists
  if (count >= 3) {
    const thumb2 = thumbs.nth(2);
    const thumb2src = await thumb2.getAttribute('src');
    await thumb2.click();
    await page.waitForTimeout(250);
    const mainAfter2 = await mainImg.getAttribute('src');
    console.log(`  clicked thumb 3 src=${thumb2src} main now=${mainAfter2}`);
  }

  // hover second thumb
  await thumbs.nth(1).hover();
  await page.waitForTimeout(150);
  const mainAfterHover = await mainImg.getAttribute('src');
  console.log(`  after hover main=${mainAfterHover}`);

  // ensure no /catalogue local urls
  const pageHtml = await page.content();
  const hasLocal = /src=\"\/(catalogue)\//.test(pageHtml);
  console.log(`  hasLocalUrls=${hasLocal}`);

  await browser.close();
}

(async () => {
  const slugs = ['5-5m-measuring-tape-green','adivasi-oil','cloth-piece','fancy-suit','pajama'];
  for (const s of slugs) {
    try {
      await checkProduct(s);
    } catch (e) {
      console.error('Error checking', s, e);
    }
  }
  // check homepage
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`${host}/en`, { waitUntil: 'networkidle' });
  const html = await page.content();
  const r2count = (html.match(/https:\/\/media\.qasralmabrook\.com/g) || []).length;
  const localcount = (html.match(/src=\"\/(catalogue)\//g) || []).length;
  console.log(`/en r2_count=${r2count} local_count=${localcount}`);
  await browser.close();
})();
