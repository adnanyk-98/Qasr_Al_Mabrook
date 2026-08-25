import { chromium } from "playwright";

const base = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const viewports = [
  { width: 1920, height: 1080 },
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
  { width: 430, height: 932 },
  { width: 390, height: 844 },
];

async function main() {
  const browser = await chromium.launch();
  for (const locale of ["en", "ar"] as const) {
    for (const viewport of viewports) {
      const page = await browser.newPage({ viewport });
      const errors: string[] = [];
      const dialogs: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
      page.on("dialog", (dialog) => { dialogs.push(dialog.type()); void dialog.dismiss(); });
      await page.goto(`${base}/${locale}/store-locator`, { waitUntil: "networkidle" });
      await page.waitForSelector("h1");
      await page.waitForSelector("[aria-label*='gallery'], [aria-label*='معرض']");
      const result = await page.evaluate(() => {
        const hero = document.querySelector("#store-locator-hero");
        const photos = Array.from(document.querySelectorAll("[aria-label*='gallery'] button, [aria-label*='معرض'] button"));
        const images = photos.map((photo) => photo.querySelector("img"));
        return {
          hasHeader: Boolean(document.querySelector("header")),
          hasHero: Boolean(hero),
          heroImageSources: hero ? Array.from(hero.querySelectorAll("img")).map((image) => image.currentSrc || image.src) : [],
          photoCount: photos.length,
          allImagesLoaded: images.every((image) => image?.complete && image.naturalWidth > 0),
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          direction: document.documentElement.dir,
          hasFooter: Boolean(document.querySelector("footer")),
        };
      });
      if (!result.hasHeader || !result.hasHero || result.photoCount !== 8 || !result.allImagesLoaded || result.scrollWidth !== result.clientWidth || !result.hasFooter || errors.length || dialogs.length) {
        throw new Error(`${locale} ${viewport.width}x${viewport.height}: ${JSON.stringify({ result, errors, dialogs })}`);
      }
      const photos = page.locator("[aria-label*='gallery'] button, [aria-label*='معرض'] button");
      for (let index = 0; index < result.photoCount; index += 1) {
        await photos.nth(index).click();
        await page.waitForSelector('[role="dialog"]');
        await page.keyboard.press("Escape");
        if (await page.locator('[role="dialog"]').count() !== 0) throw new Error(`${locale} ${viewport.width}x${viewport.height}: lightbox did not close for image ${index + 1}`);
      }
      await photos.first().click();
      await page.waitForSelector('[role="dialog"]');
      await page.keyboard.press("ArrowRight");
      const dialog = page.locator('[role="dialog"]');
      await dialog.locator("div.relative").dispatchEvent("pointerdown", { pointerId: 1, clientX: 300, clientY: 300, bubbles: true });
      await dialog.locator("div.relative").dispatchEvent("pointerup", { pointerId: 1, clientX: 100, clientY: 300, bubbles: true });
      if (await dialog.count() !== 1) throw new Error(`${locale} ${viewport.width}x${viewport.height}: lightbox swipe closed unexpectedly`);
      await page.keyboard.press("Escape");
      console.log(`${locale} ${viewport.width}x${viewport.height}: PASS photos=${result.photoCount} hero=${result.heroImageSources.join(" | ")} direction=${result.direction}`);
      await page.close();
    }
  }
  await browser.close();
}

void main().catch((error) => { console.error(error); process.exit(1); });
