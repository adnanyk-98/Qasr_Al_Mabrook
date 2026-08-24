import { chromium } from "playwright";

const base = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const viewports = [
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];

async function main() {
  const browser = await chromium.launch();
  const failures: string[] = [];

  for (const locale of ["en", "ar"] as const) {
    for (const viewport of viewports) {
      const page = await browser.newPage({ viewport });
      const dialogs: string[] = [];
      const consoleErrors: string[] = [];
      page.on("dialog", (dialog) => { dialogs.push(dialog.type()); void dialog.dismiss(); });
      page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });

      try {
        const response = await page.goto(`${base}/${locale}`, { waitUntil: "networkidle" });
        await page.waitForSelector("header");
        await page.waitForSelector("main");
        await page.waitForSelector("footer");
        const result = await page.evaluate(() => ({
          status: document.documentElement.lang,
          direction: document.documentElement.dir,
          hasHeader: Boolean(document.querySelector("header")),
          hasHeroOrFallback: Boolean(document.querySelector("#homepage-hero, main section")),
          hasFooter: Boolean(document.querySelector("footer")),
          bareLoading: document.body.innerText.trim() === "Loading...",
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          loadingShellVisible: Boolean(document.querySelector('[data-testid="public-loading-shell"]')),
        }));
        if (response?.status() !== 200 || !result.hasHeader || !result.hasHeroOrFallback || !result.hasFooter || result.bareLoading || result.scrollWidth !== result.clientWidth || dialogs.length || consoleErrors.length) {
          throw new Error(JSON.stringify({ response: response?.status(), ...result, dialogs, consoleErrors }));
        }
        console.log(`${locale} ${viewport.width}x${viewport.height}: PASS`);
      } catch (error) {
        const label = `${locale} ${viewport.width}x${viewport.height}`;
        failures.push(`${label}: ${String(error)}`);
        console.error(`${label}: FAIL ${String(error)}`);
      } finally {
        await page.close();
      }
    }
  }

  await browser.close();
  if (failures.length) process.exit(1);
  console.log("Public loading smoke checks passed");
}

void main();
