import { chromium, type Page } from "playwright";

const base = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const viewports = [
  { width: 1920, height: 1080 },
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
  { width: 430, height: 932 },
  { width: 390, height: 844 },
];

function isKnownUnlocalizedCategoryPrefetch(response: { url: string; resourceType: string }) {
  const url = new URL(response.url);
  return response.resourceType === "fetch"
    && /^\/categories\/[^/]+$/.test(url.pathname)
    && url.searchParams.has("_rsc");
}

async function checkPage(page: Page, locale: "en" | "ar", route: string) {
  const result = await page.evaluate(() => {
    const html = document.documentElement;
    const images = Array.from(document.querySelectorAll("main img")) as HTMLImageElement[];
    return {
      lang: html.lang,
      dir: html.dir,
      h1: document.querySelector("main h1")?.textContent?.trim() ?? "",
      images: images.length,
      loadedImages: images.filter((image) => image.complete && image.naturalWidth > 0).length,
      hasPlaceholder: /No summary available|No detailed description is available|لا يوجد ملخص|لا يوجد وصف تفصيلي/.test(document.body.innerText),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth || document.body.scrollWidth > document.body.clientWidth,
    };
  });

  if (result.lang !== locale || result.dir !== (locale === "ar" ? "rtl" : "ltr") || result.hasPlaceholder || result.overflow) {
    throw new Error(`${route}: ${JSON.stringify(result)}`);
  }

  return result;
}

async function checkFancySuitHero(page: Page, locale: "en" | "ar", viewport: { width: number; height: number }) {
  await page.goto(`${base}/${locale}`, { waitUntil: "networkidle" });
  const indicators = page.locator("#homepage-hero button[aria-label^='Go to slide'], #homepage-hero button[aria-label^='الانتقال إلى الشريحة']");
  if (await indicators.count() !== 4) throw new Error(`${locale} ${viewport.width}x${viewport.height}: expected exactly four hero slides`);

  await page.waitForFunction(() => {
    const firstIndicator = document.querySelector("#homepage-hero button.w-9");
    return Boolean(firstIndicator);
  });
  await indicators.nth(3).click();
  await page.waitForFunction(() => {
    const indicators = Array.from(document.querySelectorAll("#homepage-hero button[aria-label^='Go to slide'], #homepage-hero button[aria-label^='الانتقال إلى الشريحة']"));
    return indicators[3]?.className.includes("w-9") ?? false;
  }, undefined, { timeout: 5000, polling: 50 });
  const fancyImage = page.locator('#homepage-hero img[alt="Fancy Suit"]');
  await page.waitForFunction(() => {
    const hero = document.querySelector("#homepage-hero");
    if (!hero) return false;
    const heroBox = hero.getBoundingClientRect();
    const image = hero.querySelector('img[alt="Fancy Suit"]') as HTMLImageElement | null;
    const slide = image?.closest(".min-w-full");
    if (!slide) return false;
    const slideBox = slide.getBoundingClientRect();
    return Math.abs(slideBox.left - heroBox.left) <= 1 && Math.abs(slideBox.right - heroBox.right) <= 1;
  }, undefined, { timeout: 5000, polling: 50 });
  await fancyImage.waitFor({ state: "visible" });
  const result = await fancyImage.evaluate((element) => {
    const image = element as HTMLImageElement;
    return {
    currentSrc: image.currentSrc,
    complete: image.complete,
    naturalWidth: image.naturalWidth,
    naturalHeight: image.naturalHeight,
    visible: image.getBoundingClientRect().width > 0 && image.getBoundingClientRect().height > 0,
    source: image.closest("picture")?.querySelector("source")?.getAttribute("srcset") ?? null,
    };
  });

  const expectedName = viewport.width < 768 ? "FANCY-SUIT-Web-Banner-Mobile.jpg" : "FANCY-SUIT-Web-Banner.jpg";
  if (!result || !result.currentSrc.includes(expectedName) || !result.complete || result.naturalWidth <= 0 || result.naturalHeight <= 0 || !result.visible) {
    throw new Error(`${locale} ${viewport.width}x${viewport.height}: Fancy Suit source mismatch ${JSON.stringify(result)}`);
  }

  for (let index = 0; index < 4; index += 1) {
    await indicators.nth(index).click();
    await page.waitForTimeout(700);
    const slide = await page.locator("#homepage-hero").evaluate((hero) => {
      const heroBox = hero.getBoundingClientRect();
      const image = Array.from(hero.querySelectorAll("img")).find((candidate) => {
        const box = candidate.getBoundingClientRect();
        return box.width > 0 && box.height > 0 && box.right > heroBox.left && box.left < heroBox.right;
      });
      return image ? { src: image.currentSrc, complete: image.complete, width: image.naturalWidth, height: image.naturalHeight } : null;
    });
    if (!slide || !slide.complete || slide.width <= 0 || slide.height <= 0) {
      throw new Error(`${locale} ${viewport.width}x${viewport.height}: hero slide ${index + 1} is not loaded and visible ${JSON.stringify(slide)}`);
    }
  }
}

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors: string[] = [];
  const notFoundResponses: Array<{ url: string; resourceType: string; page: string }> = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    const text = message.text();
    if (/Failed to load resource: the server responded with a status of 404 \(Not Found\)/.test(text)) {
      return;
    }
    if (message.type() === "error" || /hydration|hydrate/i.test(text)) errors.push(text);
  });
  page.on("response", (response) => {
    if (response.status() === 404) {
      notFoundResponses.push({ url: response.url(), resourceType: response.request().resourceType(), page: page.url() });
    }
  });

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await checkFancySuitHero(page, "en", viewport);
    await checkFancySuitHero(page, "ar", viewport);
    await page.goto(`${base}/en/products`, { waitUntil: "networkidle" });
    await page.waitForSelector('main a[href*="/products/"]');
    const productHref = await page.locator('main a[href*="/products/"]').first().getAttribute("href");
    if (!productHref) throw new Error("No product slug was rendered");
    await checkPage(page, "en", "/en/products");

    await page.goto(`${base}/ar/products`, { waitUntil: "networkidle" });
    await checkPage(page, "ar", "/ar/products");
    const arabicProductHref = await page.locator('main a[href*="/products/"]').first().getAttribute("href");
    if (!arabicProductHref || arabicProductHref.split("/").pop() !== productHref.split("/").pop()) throw new Error("Product slug changed between locales");

    for (const route of [`/en${productHref.slice(3)}`, `/ar${productHref.slice(3)}`]) {
      await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
      await checkPage(page, route.startsWith("/ar") ? "ar" : "en", route);
      await page.getByTestId("locale-switcher").click();
      const targetLocale = route.startsWith("/ar") ? "en" : "ar";
      await page.waitForURL(`**/${targetLocale}/products/*`);
      await checkPage(page, targetLocale, page.url());
      if (!page.url().endsWith(productHref.split("/").pop() ?? "")) throw new Error("Product detail slug was not preserved");
    }

    await page.goto(`${base}/en/categories`, { waitUntil: "networkidle" });
    await page.waitForSelector('main a[href*="/categories/"]');
    const categoryHref = await page.locator('main a[href*="/categories/"]').first().getAttribute("href");
    if (!categoryHref) throw new Error("No category slug was rendered");
    await checkPage(page, "en", "/en/categories");
    await page.goto(`${base}/ar/categories`, { waitUntil: "networkidle" });
    await checkPage(page, "ar", "/ar/categories");
    const arabicCategoryHref = await page.locator('main a[href*="/categories/"]').first().getAttribute("href");
    if (!arabicCategoryHref || arabicCategoryHref.split("/").pop() !== categoryHref.split("/").pop()) throw new Error("Category slug changed between locales");

    console.log(`${viewport.width}x${viewport.height}: catalogue localization PASS`);
  }

  const unexpectedNotFoundResponses = notFoundResponses.filter((response) => !isKnownUnlocalizedCategoryPrefetch(response));
  if (unexpectedNotFoundResponses.length) throw new Error(`Unexpected 404 responses: ${JSON.stringify(unexpectedNotFoundResponses)}`);
  if (notFoundResponses.length) {
    console.log(`Ignored ${notFoundResponses.length} known unlocalized category prefetch 404 responses: ${JSON.stringify(notFoundResponses)}`);
  }
  if (errors.length) throw new Error(`Browser errors: ${errors.join(" | ")}`);
  await context.close();
  await browser.close();
  console.log("Catalogue localization E2E checks passed");
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
