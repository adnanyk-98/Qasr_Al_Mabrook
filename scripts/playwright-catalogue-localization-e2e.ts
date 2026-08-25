import { chromium, type Page } from "playwright";

const base = process.env.BASE_URL ?? "http://localhost:3000";
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

function getSlideAriaLabel(locale: "en" | "ar", index: number) {
  return locale === "ar" ? `الانتقال إلى الشريحة ${index + 1}` : `Go to slide ${index + 1}`;
}

async function waitForHeroHydrated(page: Page, locale: "en" | "ar") {
  await page.waitForFunction(({ locale: targetLocale }) => {
    const hero = document.querySelector("#homepage-hero");
    if (!hero) return false;
    const indicators = Array.from(hero.querySelectorAll("button[aria-label^='Go to slide'], button[aria-label^='الانتقال إلى الشريحة']"));
    if (indicators.length !== 4) return false;
    const slideImages = Array.from(hero.querySelectorAll("img"));
    return slideImages.length > 0 && indicators.every((item) => item instanceof HTMLElement);
  }, { locale });
}

async function waitForActiveSlide(page: Page, locale: "en" | "ar", index: number) {
  const targetLabel = getSlideAriaLabel(locale, index);
  await page.waitForFunction(({ targetLabel: label }) => {
    const indicators = Array.from(document.querySelectorAll("#homepage-hero button[aria-label^='Go to slide'], #homepage-hero button[aria-label^='الانتقال إلى الشريحة']"));
    const active = indicators.find((indicator) => {
      const aria = indicator.getAttribute("aria-label") ?? "";
      const classes = (indicator as HTMLElement).className.toString().split(/\s+/);
      return aria === label && classes.includes("w-9");
    });
    return Boolean(active);
  }, { targetLabel });
}

async function waitForFancySuitVisible(page: Page, locale: "en" | "ar") {
  const imageSelector = '#homepage-hero img[alt="Fancy Suit"]';
  await page.waitForFunction(() => {
    const hero = document.querySelector("#homepage-hero");
    if (!hero) return false;
    const heroBox = hero.getBoundingClientRect();
    const image = hero.querySelector('img[alt="Fancy Suit"]') as HTMLImageElement | null;
    if (!image) return false;
    const slide = image.closest(".min-w-full") as HTMLElement | null;
    if (!slide) return false;
    const slideBox = slide.getBoundingClientRect();
    return image.complete && image.naturalWidth > 0 && image.naturalHeight > 0 && image.getBoundingClientRect().width > 0 && image.getBoundingClientRect().height > 0 && Math.abs(slideBox.left - heroBox.left) <= 1 && Math.abs(slideBox.right - heroBox.right) <= 1;
  });
  await page.locator(imageSelector).waitFor({ state: "visible" });
}

async function verifyHeroSlideImage(page: Page, locale: "en" | "ar", viewport: { width: number; height: number }, index: number) {
  const indicator = page.locator(`#homepage-hero button[aria-label="${getSlideAriaLabel(locale, index)}"]`);
  await indicator.click();
  await waitForActiveSlide(page, locale, index);

  const image = page.locator('#homepage-hero img[alt="Fancy Suit"]');
  const result = await image.evaluate((element) => {
    const imageElement = element as HTMLImageElement;
    const box = imageElement.getBoundingClientRect();
    return {
      currentSrc: imageElement.currentSrc,
      complete: imageElement.complete,
      naturalWidth: imageElement.naturalWidth,
      naturalHeight: imageElement.naturalHeight,
      visible: box.width > 0 && box.height > 0,
      source: imageElement.closest("picture")?.querySelector("source")?.getAttribute("srcset") ?? null,
    };
  });

  const expectedName = viewport.width < 768 ? "FANCY-SUIT-Web-Banner-Mobile.jpg" : "FANCY-SUIT-Web-Banner.jpg";
  if (!result || !result.currentSrc.includes(expectedName) || !result.complete || result.naturalWidth <= 0 || result.naturalHeight <= 0 || !result.visible) {
    throw new Error(`${locale} ${viewport.width}x${viewport.height}: Fancy Suit source mismatch ${JSON.stringify(result)}`);
  }
}

async function checkFancySuitHero(page: Page, locale: "en" | "ar", viewport: { width: number; height: number }) {
  await page.goto(`${base}/${locale}`, { waitUntil: "networkidle" });
  const indicators = page.locator("#homepage-hero button[aria-label^='Go to slide'], #homepage-hero button[aria-label^='الانتقال إلى الشريحة']");
  if (await indicators.count() !== 4) throw new Error(`${locale} ${viewport.width}x${viewport.height}: expected exactly four hero slides`);

  await waitForHeroHydrated(page, locale);
  const targetIndex = 3;
  await indicators.nth(targetIndex).click();
  await waitForActiveSlide(page, locale, targetIndex);
  await waitForFancySuitVisible(page, locale);

  await verifyHeroSlideImage(page, locale, viewport, targetIndex);

  for (let index = 0; index < 4; index += 1) {
    await indicators.nth(index).click();
    await waitForActiveSlide(page, locale, index);
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

async function verifyDesktopHeroInteraction(page: Page, locale: "en" | "ar") {
  await page.goto(`${base}/${locale}`, { waitUntil: "networkidle" });
  await waitForHeroHydrated(page, locale);

  const firstSlideLink = page.locator('#homepage-hero a[aria-label="Super Market"]');
  const firstSlideBox = await firstSlideLink.boundingBox();
  if (!firstSlideBox) throw new Error(`${locale}: could not measure first hero link`);

  const centerX = firstSlideBox.x + firstSlideBox.width / 2;
  const centerY = firstSlideBox.y + firstSlideBox.height / 2;

  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForURL(new RegExp(`${locale}/store-locator`), { timeout: 5000 });

  await page.goto(`${base}/${locale}`, { waitUntil: "networkidle" });
  await waitForHeroHydrated(page, locale);

  const heroLink = page.locator('#homepage-hero a[aria-label="Super Market"]');
  const linkBox = await heroLink.boundingBox();
  if (!linkBox) throw new Error(`${locale}: could not measure super market hero link`);

  await page.mouse.move(linkBox.x + 20, linkBox.y + linkBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(linkBox.x + 40, linkBox.y + linkBox.height / 2, { steps: 12 });
  await page.mouse.up();
  await page.waitForURL(new RegExp(`${locale}/store-locator`), { timeout: 5000 });

  await page.goto(`${base}/${locale}`, { waitUntil: "networkidle" });
  await waitForHeroHydrated(page, locale);

  const heroRegion = page.locator('#homepage-hero');
  const heroBox = await heroRegion.boundingBox();
  if (!heroBox) throw new Error(`${locale}: could not measure hero region`);

  const dragStartX = heroBox.x + heroBox.width * 0.65;
  const dragStartY = heroBox.y + heroBox.height / 2;
  const dragEndX = heroBox.x + heroBox.width * 0.15;

  await page.mouse.move(dragStartX, dragStartY);
  await page.mouse.down();
  await page.mouse.move(dragEndX, dragStartY, { steps: 14 });
  await page.mouse.up();

  await page.waitForFunction(({ locale: targetLocale }) => {
    const indicators = Array.from(document.querySelectorAll("#homepage-hero button[aria-label^='Go to slide'], #homepage-hero button[aria-label^='الانتقال إلى الشريحة']"));
    const active = indicators.find((indicator) => {
      const classes = (indicator as HTMLElement).className.toString().split(/\s+/);
      return classes.includes("w-9");
    });
    if (!active) return false;
    const aria = active.getAttribute("aria-label") ?? "";
    return aria.includes(targetLocale === "ar" ? "الشريحة 2" : "slide 2") || aria.includes(targetLocale === "ar" ? "الشريحة 1" : "slide 1");
  }, { locale });

  const urlAfterDrag = page.url();
  if (urlAfterDrag.includes("/store-locator")) {
    throw new Error(`${locale}: drag on hero changed URL unexpectedly`);
  }

  await page.goto(`${base}/${locale}`, { waitUntil: "networkidle" });
  await waitForHeroHydrated(page, locale);

  const dragStartXBack = heroBox.x + heroBox.width * 0.35;
  const dragEndXBack = heroBox.x + heroBox.width * 0.85;
  await page.mouse.move(dragStartXBack, heroBox.y + heroBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(dragEndXBack, heroBox.y + heroBox.height / 2, { steps: 14 });
  await page.mouse.up();

  await page.waitForFunction(({ locale: targetLocale }) => {
    const indicators = Array.from(document.querySelectorAll("#homepage-hero button[aria-label^='Go to slide'], #homepage-hero button[aria-label^='الانتقال إلى الشريحة']"));
    const active = indicators.find((indicator) => {
      const classes = (indicator as HTMLElement).className.toString().split(/\s+/);
      return classes.includes("w-9");
    });
    if (!active) return false;
    const aria = active.getAttribute("aria-label") ?? "";
    return aria.includes(targetLocale === "ar" ? "الشريحة 1" : "slide 1") || aria.includes(targetLocale === "ar" ? "الشريحة 2" : "slide 2");
  }, { locale });

  const noPreview = await page.evaluate(() => {
    const hero = document.querySelector("#homepage-hero");
    return !hero || !hero.querySelector("a[draggable='true']") && !document.body.innerText.includes("about:blank");
  });
  if (!noPreview) throw new Error(`${locale}: native drag preview was still observed`);
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
