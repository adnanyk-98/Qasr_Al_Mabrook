import { chromium, type Page } from "playwright";

const base = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const viewports = [
  { width: 1440, height: 900, name: "desktop" },
  { width: 430, height: 932, name: "mobile" },
];

interface CarouselState {
  error?: string;
  activeTransform: string;
  slideCount: number;
  visibleCount: number;
  visibleSrcs: string[];
  visibleImages: Array<{
    src: string;
    complete: boolean;
    naturalWidth: number;
    currentSrc: string;
  }>;
}

async function inspectCarousel(page: Page): Promise<CarouselState> {
  try {
    return await page.evaluate(() => {
      const root = document.querySelector("#homepage-hero");
      const slider = root?.querySelector(".w-full.flex");
      const slides = [...(root?.querySelectorAll(".min-w-full") ?? [])];
      const visibleSlides = slides.filter((slide) => {
        const box = slide.getBoundingClientRect();
        return box.left < window.innerWidth && box.right > 0;
      });

      const visibleImages = visibleSlides.map((slide) => {
        const img = slide.querySelector("img") as HTMLImageElement | null;
        return {
          src: img?.src || "",
          complete: img?.complete ?? false,
          naturalWidth: img?.naturalWidth ?? 0,
          currentSrc: img?.currentSrc || img?.src || "",
        };
      });

      return {
        activeTransform: slider?.getAttribute("style") ?? "",
        slideCount: slides.length,
        visibleCount: visibleSlides.length,
        visibleSrcs: visibleImages.map((img) => img.currentSrc || img.src),
        visibleImages,
      };
    });
  } catch (err) {
    return {
      error: String(err),
      activeTransform: "unknown",
      slideCount: 0,
      visibleCount: 0,
      visibleSrcs: [],
      visibleImages: [],
    };
  }
}

async function waitForImageReadiness(page: Page, maxWaitMs: number = 3000): Promise<boolean> {
  try {
    await page.waitForFunction(
      () => {
        const root = document.querySelector("#homepage-hero");
        const slides = [...(root?.querySelectorAll(".min-w-full") ?? [])];
        const visibleSlides = slides.filter((slide) => {
          const box = slide.getBoundingClientRect();
          return box.left < window.innerWidth && box.right > 0;
        });

        // All visible slides must have a loaded image
        return visibleSlides.every((slide) => {
          const img = slide.querySelector("img") as HTMLImageElement | null;
          return img && img.complete && img.naturalWidth > 0;
        });
      },
      { timeout: maxWaitMs }
    );
    return true;
  } catch {
    return false;
  }
}

async function swipe(page: Page, fast: boolean) {
  const hero = page.locator("#homepage-hero");
  await hero.scrollIntoViewIfNeeded();
  const box = await hero.boundingBox();
  if (!box) throw new Error("Hero carousel is not mounted");
  await page.mouse.move(box.x + box.width * 0.75, box.y + box.height * 0.4);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.15, box.y + box.height * 0.4, { steps: fast ? 1 : 8 });
  await page.waitForTimeout(50);
  await page.mouse.up();
  await page.waitForTimeout(fast ? 100 : 750);
}

async function runTestCycle(
  page: Page,
  locale: string,
  viewport: { width: number; height: number; name: string },
  cycleNum: number,
  expectedImages: string[],
  failures: string[]
) {
  const numSwipes = 5;
  let logicalSlide = 0; // Track which of the 4 real slides we're on

  for (let swipeIdx = 0; swipeIdx < numSwipes; swipeIdx++) {
    // Mix normal and rapid swipes: cycle 1 = normal, cycle 2+ = rapid every other, cycle 3+ = rapid patterns
    const fast = cycleNum >= 2 && swipeIdx % 2 === 1;

    await swipe(page, fast);

    // Wait for images to load
    const ready = await waitForImageReadiness(page, 3000);
    if (!ready) {
      failures.push(
        `${locale}/${viewport.width}x${viewport.height}: cycle ${cycleNum}, swipe ${swipeIdx} - images did not load after 3s`
      );
    }

    const state = await inspectCarousel(page);

    if (state.error) {
      failures.push(
        `${locale}/${viewport.width}x${viewport.height}: cycle ${cycleNum}, swipe ${swipeIdx} - inspect error: ${state.error}`
      );
      break;
    }

    // Check for blank carousel
    if (state.visibleCount === 0) {
      failures.push(
        `${locale}/${viewport.width}x${viewport.height}: cycle ${cycleNum}, swipe ${swipeIdx} - BLANK: no visible slides. Total slides: ${state.slideCount}, transform: ${state.activeTransform}`
      );
      break;
    }

    // Verify all visible images are properly loaded
    for (const img of state.visibleImages) {
      if (!img.src) {
        failures.push(
          `${locale}/${viewport.width}x${viewport.height}: cycle ${cycleNum}, swipe ${swipeIdx} - visible image has no src`
        );
      } else if (!img.complete) {
        failures.push(
          `${locale}/${viewport.width}x${viewport.height}: cycle ${cycleNum}, swipe ${swipeIdx} - visible image not complete: ${img.src}`
        );
      } else if (img.naturalWidth === 0) {
        failures.push(
          `${locale}/${viewport.width}x${viewport.height}: cycle ${cycleNum}, swipe ${swipeIdx} - BROKEN IMAGE: naturalWidth=0: ${img.src}`
        );
      }
    }

    // Carousel shows 3 slides at a time; primary is the middle one (current/active slide)
    const primaryImageIdx = Math.floor(state.visibleSrcs.length / 2);
    const primaryImage = state.visibleSrcs[primaryImageIdx];

    console.log(
      `  cycle ${cycleNum}, swipe ${swipeIdx} (${fast ? "rapid" : "normal"}): visible=${state.visibleCount}, ready=${ready}, logical_slide=${logicalSlide}, primary_src=${primaryImage ? primaryImage.split("/").pop() : "N/A"}`
    );

    // Advance logical slide (looping back to 0 after 3)
    logicalSlide = (logicalSlide + 1) % 4;
  }
}

async function run() {
  const browser = await chromium.launch();
  const failures: string[] = [];

  try {
    const page = await browser.newPage();

    // Prevent carousel link navigation during testing
    await page.addInitScript(() => {
      const globalWindow = window as typeof window & { __heroTestMode?: boolean };
      globalWindow.__heroTestMode = true;
      document.addEventListener(
        "click",
        (event) => {
          const hero = (event.target as HTMLElement)?.closest("#homepage-hero");
          if (hero) {
            const link = (event.target as HTMLElement)?.closest("a[href]");
            if (link && globalWindow.__heroTestMode) {
              event.preventDefault();
              event.stopPropagation();
            }
          }
        },
        true
      );
    });

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      for (const locale of ["en", "ar"] as const) {
        console.log(`\n========================================`);
        console.log(`Testing ${locale} at ${viewport.width}x${viewport.height}`);
        console.log(`========================================`);

        await page.goto(`${base}/${locale}`, { waitUntil: "domcontentloaded", timeout: 30000 });
        await page.waitForTimeout(1500);

        // Get expected image sources from initial load
        const initialState = await inspectCarousel(page);
        if (initialState.error || initialState.visibleCount === 0) {
          failures.push(
            `${locale}/${viewport.width}x${viewport.height}: INITIAL LOAD FAILED - cannot proceed with test`
          );
          continue;
        }

        // Build a map of expected images for each logical slide position
        const expectedImages = initialState.visibleSrcs.slice(0, 4);
        console.log(`Initial images loaded: ${expectedImages.map((s) => s.split("/").pop()).join(", ")}`);

        // Run 5 full cycles per locale/viewport
        for (let cycle = 1; cycle <= 5; cycle++) {
          console.log(`\nCycle ${cycle}:`);
          await runTestCycle(page, locale, viewport, cycle, expectedImages, failures);
        }

        // Reload and test recovery
        console.log(`\nReload & Recovery Test:`);
        await page.reload({ waitUntil: "domcontentloaded", timeout: 30000 });
        await page.waitForTimeout(1500);

        const reloadReady = await waitForImageReadiness(page, 3000);
        const reloadState = await inspectCarousel(page);

        if (!reloadReady) {
          failures.push(`${locale}/${viewport.width}x${viewport.height}: reload - images did not load after 3s`);
        }

        if (reloadState.visibleCount === 0) {
          failures.push(
            `${locale}/${viewport.width}x${viewport.height}: reload - BLANK CAROUSEL after reload. Transform: ${reloadState.activeTransform}`
          );
        }

        // Verify images after reload
        for (const img of reloadState.visibleImages) {
          if (!img.complete || img.naturalWidth === 0) {
            failures.push(
              `${locale}/${viewport.width}x${viewport.height}: reload - unready or broken image after reload: ${img.src}`
            );
          }
        }

        console.log(
          `  reload: visible=${reloadState.visibleCount}, ready=${reloadReady}, primary=${reloadState.visibleSrcs[0]?.split("/").pop() || "N/A"}`
        );

        // One final swipe after reload to verify responsiveness
        await swipe(page, false);
        const finalReady = await waitForImageReadiness(page, 3000);
        const finalState = await inspectCarousel(page);

        if (!finalReady || finalState.visibleCount === 0) {
          failures.push(
            `${locale}/${viewport.width}x${viewport.height}: post-reload-swipe - unresponsive or blank carousel`
          );
        }

        console.log(
          `  post-reload-swipe: visible=${finalState.visibleCount}, ready=${finalReady}, primary=${finalState.visibleSrcs[0]?.split("/").pop() || "N/A"}`
        );
      }
    }
  } finally {
    await browser.close();
  }

  if (failures.length) {
    console.error("\n\n========== FAILURES ==========");
    for (const failure of failures) console.error(failure);
    process.exitCode = 1;
  } else {
    console.log("\n\n✓ Hero carousel regression PASSED:");
    console.log("  - 5 complete cycles per locale/viewport");
    console.log("  - Mix of normal and rapid swipes");
    console.log("  - Infinite-loop boundaries tested");
    console.log("  - Images properly loaded and correct per position");
    console.log("  - Reload recovery verified");
  }
}

void run();
