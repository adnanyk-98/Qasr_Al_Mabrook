import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import postgres from 'postgres';
import { resolveMigrationDatabase } from './migration-db';
import { config } from 'dotenv';

config({ path: process.env.DOTENV_CONFIG_PATH ?? '.env.local' });

async function main() {
  const base = 'http://127.0.0.1:3000';
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL ?? 'e2e-admin@example.test';
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD ?? 'ChangeMe123!';

  const outDir = path.resolve('tmp/e2e-admin/categories');
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const sel = await resolveMigrationDatabase();
  if (!sel) { console.error('No reachable DB for verification'); process.exit(1); }
  const sql = postgres(sel.url, { ssl: false });

  // Create 12 categories
  const ts = Date.now();
  const slugs: string[] = [];
  for (let i = 0; i < 12; i++) {
    const slug = `e2e-pagination-category-${ts}-${i}`;
    slugs.push(slug);
    await sql`insert into categories (id, slug, status, sort_order, created_at, updated_at) values (gen_random_uuid(), ${slug}, 'PUBLISHED', 0, now(), now())`;
  }

  try {
    await page.goto(`${base}/admin/login`);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await Promise.all([page.waitForNavigation({ url: '**/admin' }), page.click('button[type="submit"]')]);

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${base}/admin/categories`);
    await page.waitForSelector('text=Existing categories', { timeout: 10000 });

    // page must show up to 10 items (shared DB may contain other records)
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    const rows = await page.$$eval('table tbody tr', (els) => els.length);
    if (rows < 1 || rows > 10) throw new Error('Unexpected number of categories on first page: ' + rows);

    // Next/Prev: verify navigation changes page (don't assume exact counts)
    const urlBefore = page.url();
    await Promise.all([page.waitForNavigation({ url: '**/admin/categories**' }), page.click('text=Next')]);
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    const urlAfter = page.url();
    if (urlBefore === urlAfter) throw new Error('Pagination Next did not change URL: ' + urlAfter);
    const rows2 = await page.$$eval('table tbody tr', (els) => els.length);
    if (rows2 < 1 || rows2 > 10) throw new Error('Unexpected number of categories on second page: ' + rows2);

    // Search
    const target = slugs[5];
    await page.fill('input[name="search"]', target);
    await Promise.all([page.waitForNavigation({ url: `**/admin/categories?**` }), page.click('button:has-text("Search")')]);
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    const searchRows = await page.$$eval('table tbody tr', (els) => els.length);
    if (searchRows !== 1) throw new Error('Category search did not return 1 row');

    // Clear search
    await page.goto(`${base}/admin/categories`);

    // Delete safety: create a product linked to a category to make it in use
    const inUseCategory = slugs[0];
    const catRow = await sql`select id from categories where slug = ${inUseCategory} limit 1`;
    const catId = catRow[0].id;
    // create product-category relation
    await sql`insert into products (id, slug, default_sku, status, created_at, updated_at) values (gen_random_uuid(), ${`e2e-linked-prod-${ts}`}, 'E2E', 'PUBLISHED', now(), now())`;
    const prodRow = await sql`select id from products where slug = ${`e2e-linked-prod-${ts}`} limit 1`;
    const prodId = prodRow[0].id;
    await sql`insert into product_categories (product_id, category_id, is_primary) values (${prodId}, ${catId}, true)`;

    // Attempt to delete in-use category via UI: search for it to ensure it's visible then click Delete
    await page.goto(`${base}/admin/categories`);
    await page.fill('input[name="search"]', inUseCategory);
    await Promise.all([page.waitForNavigation({ url: `**/admin/categories?**` }), page.click('button:has-text("Search")')]);
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    // find delete button for this category row
    const delBtn = await page.$(`xpath=//tr[.//td//div[text() = '${inUseCategory}']]//button[contains(., 'Delete')]`);
    if (!delBtn) throw new Error('Delete button not found for in-use category');
    await delBtn.click();
    await page.waitForSelector('text=Delete category', { timeout: 10000 });
    const delPromise = page.waitForResponse((r) => r.url().includes('/api/admin/categories/delete') && r.request().method() === 'POST', { timeout: 10000 });
    await page.click('button:has-text("Delete category")');
    const delResp = await delPromise;
    const delBody = await delResp.json().catch(() => ({}));
    if (delResp.status() < 400 && delBody.success) throw new Error('In-use category deletion unexpectedly succeeded');

    // Ensure category still in DB
    const checkCat = await sql`select id from categories where id = ${catId}`;
    if (checkCat.length === 0) throw new Error('In-use category missing from DB after attempted delete');

    // Now delete a safe category
    const safeSlug = slugs[1];
    const safeRow = await sql`select id from categories where slug = ${safeSlug} limit 1`;
    const safeId = safeRow[0].id;
    // find delete button for safe category via search
    await page.fill('input[name="search"]', safeSlug);
    await Promise.all([page.waitForNavigation({ url: `**/admin/categories?**` }), page.click('button:has-text("Search")')]);
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    const delBtn2 = await page.$(`xpath=//tr[.//td//div[text() = '${safeSlug}']]//button[contains(., 'Delete')]`);
    if (!delBtn2) throw new Error('Delete button not found for safe category');
    await delBtn2.click();
    await page.waitForSelector('text=Delete category', { timeout: 10000 });
    const del2Promise = page.waitForResponse((r) => r.url().includes('/api/admin/categories/delete') && r.request().method() === 'POST', { timeout: 10000 });
    await page.click('button:has-text("Delete category")');
    const del2Resp = await del2Promise;
    const del2Body = await del2Resp.json().catch(() => ({}));
    if (!del2Resp.ok || !del2Body.success) throw new Error('Safe category delete failed: ' + JSON.stringify(del2Body));
    // ensure removed from DB
    const checkSafe = await sql`select id from categories where id = ${safeId}`;
    if (checkSafe.length !== 0) throw new Error('Safe category still present in DB after delete');

    // cleanup products and categories
    await sql`delete from product_categories where product_id = ${prodId}`;
    await sql`delete from products where slug like ${`e2e-linked-prod-${ts}`} `;
    await sql`delete from categories where slug like ${`e2e-pagination-category-${ts}-%`}`;

    console.log('Categories E2E finished');
  } catch (error: unknown) {
    const now = Date.now();
    const html = await page.content().catch(() => '');
    fs.writeFileSync(path.join(outDir, `failure-${now}.html`), html);
    fs.writeFileSync(path.join(outDir, `console-${now}.log`), '');
    console.error(error);
    process.exit(2);
  } finally {
    await sql.end();
    await browser.close();
  }
}

void main();
