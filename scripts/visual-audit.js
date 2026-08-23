const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const baseDir = path.join(process.cwd(), 'audit');
fs.mkdirSync(baseDir, { recursive: true });

const pages = [
  { name: 'home-en-390', url: 'http://127.0.0.1:3000/en', viewport: { width: 390, height: 844 }, title: 'Home EN mobile' },
  { name: 'home-en-768', url: 'http://127.0.0.1:3000/en', viewport: { width: 768, height: 1024 }, title: 'Home EN tablet' },
  { name: 'home-en-1280', url: 'http://127.0.0.1:3000/en', viewport: { width: 1280, height: 800 }, title: 'Home EN desktop small' },
  { name: 'home-en-1440', url: 'http://127.0.0.1:3000/en', viewport: { width: 1440, height: 900 }, title: 'Home EN desktop' },
  { name: 'home-ar-1440', url: 'http://127.0.0.1:3000/ar', viewport: { width: 1440, height: 900 }, title: 'Home AR desktop' },
  { name: 'products-en-1280', url: 'http://127.0.0.1:3000/en/products', viewport: { width: 1280, height: 800 }, title: 'Products EN' },
  { name: 'products-ar-1280', url: 'http://127.0.0.1:3000/ar/products', viewport: { width: 1280, height: 800 }, title: 'Products AR' },
  { name: 'product-detail-1280', url: 'http://127.0.0.1:3000/en/products/adivasi-oil', viewport: { width: 1280, height: 800 }, title: 'Product detail' },
  { name: 'category-list-768', url: 'http://127.0.0.1:3000/en/categories', viewport: { width: 768, height: 1024 }, title: 'Category list' },
  { name: 'category-detail-1440', url: 'http://127.0.0.1:3000/en/categories/adivasi-oil', viewport: { width: 1440, height: 900 }, title: 'Category detail' },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const item of pages) {
    const page = await browser.newPage({ viewport: item.viewport, deviceScaleFactor: 1 });
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));

    const response = await page.goto(item.url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(800);

    const metrics = await page.evaluate(() => {
      const body = document.body;
      const doc = document.documentElement;
      const imgs = Array.from(document.querySelectorAll('img')).slice(0, 18).map((img) => {
        const style = getComputedStyle(img);
        const parent = img.parentElement;
        const parentStyle = parent ? getComputedStyle(parent) : null;
        return {
          src: (img.currentSrc || img.src).split('/').slice(-2).join('/'),
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          clientWidth: img.clientWidth,
          clientHeight: img.clientHeight,
          objectFit: style.objectFit,
          objectPosition: style.objectPosition,
          parentOverflow: parentStyle ? parentStyle.overflow : null,
          parentClassName: parent ? parent.className : '',
        };
      });
      return {
        pageWidth: Math.max(body.scrollWidth, doc.scrollWidth, body.offsetWidth),
        pageHeight: Math.max(body.scrollHeight, doc.scrollHeight, body.offsetHeight),
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        imgs,
      };
    });

    const pngPath = path.join(baseDir, `${item.name}.png`);
    await page.screenshot({ path: pngPath, fullPage: false });
    results.push({
      page: item.name,
      title: item.title,
      status: response.status(),
      errors,
      metrics,
      image: pngPath,
    });
    console.log(JSON.stringify({ page: item.name, status: response.status(), errors, metrics }, null, 2));
    await page.close();
  }
  await browser.close();
  fs.writeFileSync(path.join(baseDir, 'audit-summary.json'), JSON.stringify(results, null, 2));
})();
