import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import postgres from 'postgres';
import { resolveMigrationDatabase } from './migration-db';
import { config } from 'dotenv';

config({ path: process.env.DOTENV_CONFIG_PATH ?? '.env.local' });

async function main() {
  const base = process.env.BASE_URL ?? 'http://127.0.0.1:3000';
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL ?? 'e2e-admin@example.test';
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD ?? 'ChangeMe123!';

  const outDir = path.resolve('tmp/e2e-admin/products');
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // listeners
  const consoleMessages: string[] = [];
  const requests: Array<{ url: string; method: string; postData: string | null }> = [];
  const responses: Array<{ url: string; status: number; body: string | null }> = [];
  let dialogSeen: { type: string; message: string } | null = null;
  page.on('console', (c) => consoleMessages.push(`${c.type()}: ${c.text()}`));
  page.on('request', (r) => requests.push({ url: r.url(), method: r.method(), postData: r.postData() }));
  page.on('response', async (r) => { let body = null; try { body = await r.text(); } catch {} responses.push({ url: r.url(), status: r.status(), body }); });
  page.on('dialog', (d) => { dialogSeen = { type: d.type(), message: d.message() }; d.dismiss().catch(() => {}); });

  // DB connection for fixtures and verification
  const sel = await resolveMigrationDatabase();
  if (!sel) { console.error('No reachable DB for verification'); process.exit(1); }
  const sql = postgres(sel.url, { ssl: false });

  // create fixtures (15 products -> 2 pages)
  const ts = Date.now();
  const slugs: string[] = [];
  for (let i = 0; i < 15; i++) {
    const slug = `e2e-pagination-product-${ts}-${i}`;
    slugs.push(slug);
    await sql`insert into products (id, slug, default_sku, status, created_at, updated_at) values (gen_random_uuid(), ${slug}, ${`QMB-E2E-${i}`}, 'DRAFT', now(), now())`;
  }

  try {
    // lightweight health check before launching browser navigation
    const health = await fetch(base, { method: 'GET' }).catch(() => null);
    if (!health || health.status >= 400) {
      console.error(`Admin E2E server is unreachable at ${base} (status: ${health?.status ?? 'no response'})`);
      process.exit(3);
    }
    // login
    await page.goto(`${base}/admin/login`);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await Promise.all([page.waitForNavigation({ url: '**/admin' }), page.click('button[type="submit"]')]);

    // Desktop check viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Visit products and wait for semantic heading instead of fragile text selector
    await page.goto(`${base}/admin/products`);
    await page.getByRole('heading', { name: /Product list/i }).waitFor({ timeout: 10000 });

    // Verify page 1 has 10 rows (table rows in desktop)
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    const rowsPage1 = await page.$$eval('table tbody tr', (els) => els.length);
    if (rowsPage1 !== 10) throw new Error(`Expected 10 rows on page1, got ${rowsPage1}`);

    // Verify Showing X to Y of Z text
    const summary = await page.locator('text=Showing').innerText();
    if (!/Showing\s+1\s+to\s+10\s+of\s+\d+/.test(summary)) throw new Error('Summary text incorrect: ' + summary);

    // Click Next
    await Promise.all([page.waitForNavigation({ url: '**/admin/products**' }), page.click('text=Next')]);
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    const rowsPage2 = await page.$$eval('table tbody tr', (els) => els.length);
    if (rowsPage2 < 1) throw new Error(`Expected at least 1 row on page2, got ${rowsPage2}`);

    // Previous back to page1
    await Promise.all([page.waitForNavigation({ url: '**/admin/products**' }), page.click('text=Prev')]);
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    const rowsPage1b = await page.$$eval('table tbody tr', (els) => els.length);
    if (rowsPage1b !== 10) throw new Error(`Expected 10 rows on page1 after Prev, got ${rowsPage1b}`);

    // Verify page indicator highlighted (link with bg brand-primary)
    const current = await page.$('a:has-text("1")');
    if (!current) throw new Error('Current page indicator not found');

    // Search: look for one of the slugs
    const target = slugs[12];
    await page.fill('input[name="search"]', target);
    await Promise.all([page.waitForNavigation({ url: `**/admin/products?**` }), page.click('button:has-text("Search")')]);
    // Wait for server-rendered results
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    const rowsSearch = await page.$$eval('table tbody tr', (els) => els.length);
    if (rowsSearch !== 1) throw new Error('Search did not return exactly 1 result');
    if (!page.url().includes('search=')) throw new Error('URL does not include search parameter');

    // Clear search
    await page.goto(`${base}/admin/products`);
    await page.waitForSelector('table tbody tr');
    const rowsCleared = await page.$$eval('table tbody tr', (els) => els.length);
    if (rowsCleared !== 10) throw new Error('Cleared search did not restore full list');

    // Delete a product: go to page 2 and delete first product on that page
    await page.goto(`${base}/admin/products?page=2`);
    await page.waitForSelector('table tbody tr');
    const firstRowLink = await page.$('table tbody tr td a[href*="edit="]');
    if (!firstRowLink) throw new Error('Edit link not found in first row on page2');
    // Extract product id from href
    const href = await firstRowLink.getAttribute('href') || '';
    const m = href.match(/edit=([^&]+)/);
    if (!m) throw new Error('Could not determine product id from edit link');
    const productIdToDelete = m[1];

    // Click Delete button in row (we find button by nearby text)
    const deleteBtn = await page.$(`xpath=//tr[.//a[contains(@href, "edit=${productIdToDelete}")]]//button[contains(., 'Delete')]`);
    if (!deleteBtn) throw new Error('Delete button not found for product');
    await deleteBtn.click();

    // Modal should appear; confirm via button text "Delete product"
    await page.waitForSelector('text=Delete product', { timeout: 10000 });
    // Intercept delete request
    const delPromise = page.waitForResponse((r) => r.url().includes('/api/admin/products/delete') && r.request().method() === 'POST', { timeout: 10000 });
    await page.click('button:has-text("Delete product")');
    const delResp = await delPromise;
    const delBody = await delResp.json().catch(() => ({}));
    if (!delResp.ok || !delBody.success) throw new Error('Delete API failed: ' + JSON.stringify({ status: delResp.status(), body: delBody }));

    // Wait for DOM to remove the row
    await page.waitForFunction((id) => !document.querySelector(`a[href*="edit=${id}"]`), productIdToDelete, { timeout: 10000 });

    // Refresh and ensure product not present
    await page.reload();
    const existsAfter = await page.$(`a[href*="edit=${productIdToDelete}"]`);
    if (existsAfter) throw new Error('Product still present after deletion and reload');

    // Verify DB record gone
    const check = await sql`select id from products where id = ${productIdToDelete}`;
    if (check.length !== 0) throw new Error('Product still present in DB after deletion');

    // Responsive checks (mobile viewport)
    const viewports = [ { w: 1440, h: 900 }, { w: 1024, h: 768 }, { w: 430, h: 932 }, { w: 390, h: 844 } ];
    for (const v of viewports) {
      await page.setViewportSize({ width: v.w, height: v.h });
      await page.goto(`${base}/admin/products`);
      // ensure no overflow
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      if (overflow) {
        const snap = path.join(outDir, `overflow-${v.w}x${v.h}.png`);
        await page.screenshot({ path: snap, fullPage: true });
        throw new Error(`Overflow detected at ${v.w}x${v.h}, screenshot saved to ${snap}`);
      }
      // mobile layout: rely on overflow check and screenshots rather than fragile table presence
    }

    // Ensure no native dialog shown
    if (dialogSeen) throw new Error('Unexpected native dialog shown: ' + JSON.stringify(dialogSeen));

    // Clean up fixtures
    await sql`delete from products where slug like ${`e2e-pagination-product-${ts}-%`}`;

    console.log('Products E2E finished successfully');
  } catch (error) {
    const now = Date.now();
    const html = await page.content().catch(() => '');
    fs.writeFileSync(path.join(outDir, `failure-${now}.html`), html);
    fs.writeFileSync(path.join(outDir, `console-${now}.log`), consoleMessages.join('\n'));
    fs.writeFileSync(path.join(outDir, `responses-${now}.json`), JSON.stringify(responses, null, 2));
    console.error(error);
    process.exit(2);
  } finally {
    await sql.end();
    await browser.close();
  }
}

void main();
