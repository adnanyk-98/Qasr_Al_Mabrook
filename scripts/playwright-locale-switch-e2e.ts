import { chromium, type Page } from "playwright";

const base = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const viewports = [
  { width: 1920, height: 1080 },
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
  { width: 430, height: 932 },
  { width: 390, height: 844 },
];

type Locale = "en" | "ar";

async function verifyHomepage(page: Page, locale: Locale) {
  await page.waitForFunction(() => {
    const images = Array.from(document.querySelectorAll('[aria-label="homepage-hero"] img')) as HTMLImageElement[];
    return !document.querySelector('[role="progressbar"]') && images.length === 3 && images.every((image) => image.complete && image.naturalWidth > 0);
  }, undefined, { timeout: 30000 });

  const result = await page.evaluate(() => {
    const hero = document.querySelector('[aria-label="homepage-hero"]');
    const images = hero ? Array.from(hero.querySelectorAll("img")) : [];
    const mobileSources = hero ? Array.from(hero.querySelectorAll("source")).map((source) => source.srcset) : [];
    const html = document.documentElement;
    const categoryViewport = document.querySelector('[aria-label="Browse categories"], [aria-label="تصفح الفئات"]');
    const categoryTrack = categoryViewport?.firstElementChild;

    return {
      path: window.location.pathname,
      lang: html.lang,
      dir: html.dir,
      imageSources: images.map((image) => ({ src: image.currentSrc || image.src, loaded: image.complete && image.naturalWidth > 0 })),
      mobileSources,
      categoryCount: categoryTrack?.children.length ?? 0,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth || document.body.scrollWidth > document.body.clientWidth,
      loading: Boolean(document.querySelector('[role="progressbar"]')),
    };
  });

  const expectedDirection = locale === "ar" ? "rtl" : "ltr";
  if (
    result.path !== `/${locale}` ||
    result.lang !== locale ||
    result.dir !== expectedDirection ||
    result.imageSources.length !== 3 ||
    result.imageSources.some((image) => !image.src || !image.loaded) ||
    result.mobileSources.length !== 3 ||
    result.mobileSources.some((source) => !source) ||
    result.categoryCount < 2 ||
    result.overflow ||
    result.loading
  ) {
    throw new Error(`${locale}: ${JSON.stringify(result)}`);
  }
}

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" || /hydration|hydrate/i.test(message.text())) errors.push(message.text());
  });

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto(`${base}/ar`, { waitUntil: "networkidle" });
    await verifyHomepage(page, "ar");
    await page.reload({ waitUntil: "networkidle" });
    await verifyHomepage(page, "ar");

    await page.goto(`${base}/en`, { waitUntil: "networkidle" });
    await verifyHomepage(page, "en");

    for (const locale of ["ar", "en", "ar", "en", "ar"] as const) {
      await Promise.all([
        page.waitForURL(`**/${locale}`),
        page.getByTestId("locale-switcher").click(),
      ]);
      await verifyHomepage(page, locale);
    }

    console.log(`${viewport.width}x${viewport.height}: EN -> AR -> EN -> AR -> EN -> AR PASS`);
  }

  if (errors.length) throw new Error(`Browser errors: ${errors.join(" | ")}`);
  await context.close();
  await browser.close();
  console.log("Locale switching E2E checks passed");
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
