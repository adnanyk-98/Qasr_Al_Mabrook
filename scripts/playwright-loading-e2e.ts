import { chromium } from "playwright";

const base = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const viewports = [{ width: 1920, height: 1080 }, { width: 1440, height: 900 }, { width: 1024, height: 768 }, { width: 430, height: 932 }, { width: 390, height: 844 }];
const publicRoutes = ["/en", "/ar", "/en/products", "/ar/products", "/en/store-locator", "/ar/store-locator", "/en/search", "/ar/search"];

async function verifyPublic(page: import("playwright").Page, route: string) {
  await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
  const result = await page.evaluate(() => ({
    hasHeader: Boolean(document.querySelector("header")),
    hasMain: Boolean(document.querySelector("main")),
    hasFooter: Boolean(document.querySelector("footer")),
    bareLoading: document.body.innerText.trim() === "Loading...",
    overflow: document.documentElement.scrollWidth === document.documentElement.clientWidth,
  }));
  if (!result.hasHeader || !result.hasMain || !result.hasFooter || result.bareLoading || !result.overflow) throw new Error(`${route}: ${JSON.stringify(result)}`);
}

async function verifyAdmin(page: import("playwright").Page) {
  await page.goto(`${base}/admin/login`, { waitUntil: "networkidle" });
  await page.fill('input[name="email"]', process.env.ADMIN_BOOTSTRAP_EMAIL ?? "e2e-admin@example.test");
  await page.fill('input[name="password"]', process.env.ADMIN_BOOTSTRAP_PASSWORD ?? "ChangeMe123!");
  await Promise.all([page.waitForURL("**/admin"), page.click('button[type="submit"]')]);
  for (const route of ["/admin/products", "/admin/categories", "/admin/homepage"]) {
    await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
    const result = await page.evaluate(() => ({
      hasMain: Boolean(document.querySelector("main")),
      hasSkeleton: Boolean(document.querySelector(".qam-skeleton")),
      blankAdminMessage: document.body.innerText.includes("Loading admin console..."),
      overflow: document.documentElement.scrollWidth === document.documentElement.clientWidth,
    }));
    if (!result.hasMain || result.blankAdminMessage || !result.overflow) throw new Error(`${route}: ${JSON.stringify(result)}`);
  }
}

async function main() {
  const browser = await chromium.launch();
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport });
    for (const route of publicRoutes) await verifyPublic(page, route);
    await page.close();
  }
  const adminPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await verifyAdmin(adminPage);
  console.log("Loading E2E checks passed");
  await browser.close();
}

void main().catch((error) => { console.error(error); process.exit(1); });
