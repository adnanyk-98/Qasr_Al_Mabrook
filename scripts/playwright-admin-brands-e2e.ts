import { chromium } from "playwright";
import postgres from "postgres";
import { config } from "dotenv";
import { resolveMigrationDatabase } from "./migration-db";

config({ path: process.env.DOTENV_CONFIG_PATH ?? ".env.local" });

async function main() {
  const base = process.env.BASE_URL ?? "http://127.0.0.1:3000";
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL ?? "e2e-admin@example.test";
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD ?? "ChangeMe123!";
  const slug = `e2e-brand-${Date.now()}`;
  const database = await resolveMigrationDatabase();
  if (!database) throw new Error("No reachable database");
  const sql = postgres(database.url, { ssl: false });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  let brandId = "";

  try {
    await page.goto(`${base}/admin/login`);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await Promise.all([page.waitForURL("**/admin"), page.click('button[type="submit"]')]);

    await page.goto(`${base}/admin/brands`);
    await page.setInputFiles("#brandLogoFile", "catalogue/Brands/vaultex.png");
    await page.getByText("512 × 512").waitFor().catch(() => undefined);
    await page.getByRole("button", { name: "Upload logo" }).click();
    await page.getByText("Uploaded logo").waitFor();
    await page.fill('input[name="name"]', "E2E Brand");
    await page.fill('input[name="slug"]', slug);
    await page.fill('input[name="sortOrder"]', "99");
    await page.getByRole("button", { name: "Save brand" }).click();
    await page.waitForURL("**/admin/brands");

    const created = await sql`select id, logo_url, sort_order, enabled from brands where slug = ${slug} limit 1`;
    if (!created.length || !created[0].logo_url) throw new Error("Brand was not created with a logo URL");
    brandId = created[0].id;
    if (created[0].sort_order !== 99 || !created[0].enabled) throw new Error("Brand metadata was not saved");

    await page.goto(`${base}/en`);
    if (await page.getByAltText("E2E Brand logo").count() !== 1) throw new Error("Enabled brand did not appear on homepage");

    await page.goto(`${base}/admin/brands?edit=${brandId}`);
    await page.fill('input[name="name"]', "E2E Brand Edited");
    await page.getByRole("button", { name: "Save brand" }).click();
    await page.waitForURL("**/admin/brands");
    const edited = await sql`select id, logo_url, name from brands where id = ${brandId}`;
    if (edited[0]?.id !== brandId || edited[0]?.name !== "E2E Brand Edited" || edited[0]?.logo_url !== created[0].logo_url) throw new Error("Edit without logo replacement changed identity or logo");

    await page.goto(`${base}/admin/brands?edit=${brandId}`);
    await page.uncheck('input[name="enabled"]');
    await page.fill('input[name="sortOrder"]', "1");
    await page.getByRole("button", { name: "Save brand" }).click();
    await page.waitForURL("**/admin/brands");
    const disabled = await sql`select enabled, sort_order from brands where id = ${brandId}`;
    if (disabled[0]?.enabled || disabled[0]?.sort_order !== 1) throw new Error("Disable/reorder did not persist");
    await page.goto(`${base}/en`);
    if (await page.getByAltText("E2E Brand Edited logo").count() !== 0) throw new Error("Disabled brand remained public");

    await page.goto(`${base}/admin/brands?edit=${brandId}`);
    await page.check('input[name="enabled"]');
    await page.getByRole("button", { name: "Save brand" }).click();
    await page.waitForURL("**/admin/brands");
    await page.goto(`${base}/en`);
    if (await page.getByAltText("E2E Brand Edited logo").count() !== 1) throw new Error("Re-enabled brand did not return publicly");

    for (const viewport of [
      { width: 1920, height: 1080 },
      { width: 1440, height: 900 },
      { width: 1024, height: 768 },
      { width: 430, height: 932 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(viewport);
      for (const locale of ["en", "ar"] as const) {
        await page.goto(`${base}/${locale}`);
        const brandLogos = page.locator('[aria-labelledby="homepage-brands-title"] img[alt$=" logo"]');
        if (await brandLogos.count() !== 7) throw new Error(`${locale} ${viewport.width}x${viewport.height}: expected six seeded logos plus the temporary enabled logo`);
        const overflow = await page.locator('[aria-labelledby="homepage-brands-title"]').evaluate((section) => section.scrollWidth > section.clientWidth);
        if (overflow) throw new Error(`${locale} ${viewport.width}x${viewport.height}: homepage has horizontal overflow`);
      }
    }

    await page.goto(`${base}/admin/brands`);
    const row = page.locator("form", { has: page.locator(`input[name="brandId"][value="${brandId}"]`) });
    await Promise.all([
      page.waitForLoadState("networkidle"),
      row.getByRole("button", { name: "Delete" }).click(),
    ]);
    const remaining = await sql`select id, name, enabled from brands where id = ${brandId}`;
    if (remaining.length) throw new Error(`Brand was not deleted at ${page.url()}: ${JSON.stringify(remaining)}`);
    brandId = "";
    console.log("Authenticated brands E2E passed: create, upload, homepage, edit, retain logo, reorder, disable, re-enable, delete.");
  } finally {
    if (brandId) await sql`delete from brands where id = ${brandId}`;
    await sql.end();
    await browser.close();
  }
}

void main().catch((error) => { console.error(error); process.exit(1); });
