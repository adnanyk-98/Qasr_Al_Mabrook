import { chromium } from "playwright";

const base = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const viewports = [
  { width: 1920, height: 1080, expected: 4 },
  { width: 1440, height: 900, expected: 4 },
  { width: 1024, height: 768, expected: 3 },
  { width: 430, height: 932, expected: 2 },
  { width: 390, height: 844, expected: 2 },
];

async function main() {
  const browser = await chromium.launch();
  for (const locale of ["en", "ar"] as const) {
    for (const viewport of viewports) {
      const page = await browser.newPage({ viewport });
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
      await page.goto(`${base}/${locale}`, { waitUntil: "networkidle" });
      await page.waitForSelector("[data-category-marquee-item]");
      await page.locator(".qam-category-track").evaluate((element) => {
        const track = element as HTMLElement;
        track.style.animationName = "none";
        track.style.animationPlayState = "paused";
        track.style.transform = "none";
      });
      const result = await page.evaluate(() => {
        const viewport = document.querySelector("[aria-label='Browse categories'], [aria-label='تصفح الفئات']") as HTMLElement;
        const viewportRect = viewport.getBoundingClientRect();
        const items = Array.from(viewport.querySelectorAll("[data-category-marquee-item]")) as HTMLElement[];
        const visible = items.filter((item) => {
          const rect = item.getBoundingClientRect();
          return rect.left >= viewportRect.left - 1 && rect.right <= viewportRect.right + 1 && rect.width > 0;
        });
        const visibleOrbSizes = visible.map((item) => (item.firstElementChild as HTMLElement).getBoundingClientRect().width);
        const visibleOrbRects = visible.map((item) => (item.firstElementChild as HTMLElement).getBoundingClientRect());
        const orbClipped = visibleOrbRects.some((rect) => rect.left < viewportRect.left - 1 || rect.right > viewportRect.right + 1 || rect.top < viewportRect.top - 1 || rect.bottom > viewportRect.bottom + 1);
        const originalLinks = items.filter((item) => item.getAttribute("aria-hidden") !== "true");
        const circles = items.map((item) => item.firstElementChild as HTMLElement | null).filter(Boolean) as HTMLElement[];
        const circleContentOnlyNames = circles.every((circle, index) => {
          const categoryName = originalLinks[index % originalLinks.length]?.textContent?.trim();
          return !circle.querySelector("svg, img, picture, [role='img']") && circle.textContent?.trim() === categoryName;
        });
        const transformBefore = getComputedStyle(viewport.querySelector(".qam-category-track")!).transform;
        return {
          visibleCount: visible.length,
          visibleOrbSizes,
          viewportWidth: viewportRect.width,
          orbClipped,
          originalCount: originalLinks.length,
          names: originalLinks.map((item) => item.textContent?.trim()).filter(Boolean),
          allLinks: originalLinks.every((item) => item instanceof HTMLAnchorElement && item.getAttribute("href")?.includes(`/categories/`)),
          circleContentOnlyNames,
          direction: getComputedStyle(viewport.querySelector(".qam-category-track")!).direction,
          overflow: document.documentElement.scrollWidth === document.documentElement.clientWidth,
          transformBefore,
        };
      });
      await page.waitForTimeout(700);
      await page.locator(".qam-category-track").evaluate((element) => {
        const track = element as HTMLElement;
        track.style.animationName = "";
        track.style.animationPlayState = "running";
      });
      await page.waitForTimeout(700);
      const transformAfter = await page.locator(".qam-category-track").evaluate((element) => getComputedStyle(element).transform);
      const minOrb = viewport.expected === 4 ? 150 : viewport.expected === 3 ? 135 : 115;
      const maxOrb = viewport.expected === 4 ? 165 : viewport.expected === 3 ? 150 : 130;
      if (result.visibleCount !== viewport.expected || result.visibleOrbSizes.some((size) => size < minOrb || size > maxOrb) || result.orbClipped || result.originalCount < 1 || !result.allLinks || !result.circleContentOnlyNames || !result.overflow || errors.length || (transformBeforeEqual(result.transformBefore, transformAfter) && locale === "en")) {
        throw new Error(`${locale} ${viewport.width}x${viewport.height}: ${JSON.stringify({ result, transformAfter, errors })}`);
      }
      const homepageUrl = page.url();
      await page.locator(".qam-category-track").evaluate((element) => {
        const track = element as HTMLElement;
        track.style.animationName = "none";
        track.style.animationPlayState = "paused";
        track.style.transform = "none";
      });
      const target = page.locator('[data-category-marquee-item][aria-hidden="false"]').first();
      const targetHref = await target.getAttribute("href");
      if (!targetHref) throw new Error(`${locale} ${viewport.width}x${viewport.height}: category href missing`);
      await target.locator(".qam-category-orb").evaluate((element) => {
        (element as HTMLElement).style.animationName = "none";
      });
      await target.locator(".qam-category-orb").click();
      try {
        await page.waitForURL((url) => url.pathname === new URL(targetHref, homepageUrl).pathname, { timeout: 10000 });
      } catch (error) {
        throw new Error(`${locale} ${viewport.width}x${viewport.height}: click did not navigate to ${targetHref}; actual URL=${page.url()}; ${String(error)}`);
      }
      await page.waitForSelector("header");
      if (!page.url().includes(targetHref)) throw new Error(`${locale} ${viewport.width}x${viewport.height}: category navigation mismatch`);
      console.log(`${locale} ${viewport.width}x${viewport.height}: PASS visible=${result.visibleCount} orb=${result.visibleOrbSizes.join(",")}px viewport=${result.viewportWidth}px clipped=${result.orbClipped} direction=${result.direction} href=${targetHref}`);
      await page.close();
    }
  }
  await browser.close();
}

function transformBeforeEqual(before: string, after: string) {
  return before === after && before !== "none";
}

void main().catch((error) => { console.error(error); process.exit(1); });
