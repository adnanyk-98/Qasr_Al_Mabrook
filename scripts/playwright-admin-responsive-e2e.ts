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
  const outDir = path.resolve('tmp/e2e-admin/responsive');
  fs.mkdirSync(outDir, { recursive: true });

  const sel = await resolveMigrationDatabase();
  if (!sel) { console.error('No reachable DB for verification'); process.exit(1); }
  const sql = postgres(sel.url, { ssl: false });

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const viewports = [
    { w: 1920, h: 1080 },
    { w: 1440, h: 900 },
    { w: 1024, h: 768 },
    { w: 430, h: 932 },
    { w: 390, h: 844 },
  ];

  // create fixtures
  const ts = Date.now();
  const productSlugs: string[] = [];
  for (let i = 0; i < 12; i++) {
    const slug = `e2e-responsive-product-${ts}-${i}`;
    productSlugs.push(slug);
    await sql`insert into products (id, slug, default_sku, status, created_at, updated_at) values (gen_random_uuid(), ${slug}, ${`E2E-${i}`}, 'PUBLISHED', now(), now())`;
  }
  const categorySlugs: string[] = [];
  for (let i = 0; i < 12; i++) {
    const slug = `e2e-responsive-category-${ts}-${i}`;
    categorySlugs.push(slug);
    await sql`insert into categories (id, slug, status, sort_order, created_at, updated_at) values (gen_random_uuid(), ${slug}, 'PUBLISHED', 0, now(), now())`;
  }
  // homepage sections
  const sectionTitles: string[] = [];
  for (let i = 0; i < 11; i++) {
    const title = `e2e-responsive-section-${ts}-${i}`;
    sectionTitles.push(title);
    await sql`insert into homepage_sections (id, section_type, status, sort_order, configuration_json, created_at, updated_at) values (gen_random_uuid(), 'hero', 'DRAFT', ${i}, ${JSON.stringify({ title })}, now(), now())`;
  }

  try {
    // login
    await page.goto(`${base}/admin/login`);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await Promise.all([page.waitForNavigation({ url: '**/admin' }), page.click('button[type="submit"]')]);

    const pages = [
      { key: 'products', path: '/admin/products', listSelectors: ['table tbody tr', "div.md\\:hidden.space-y-3 > div"], sampleEditSelector: 'table tbody tr td a[href*="edit="]', mobileSampleEditSelector: 'div.md\\:hidden.space-y-3 > div a[href*="edit="]', pageSizeSelector: 'select[name="pageSize"]' },
      { key: 'categories', path: '/admin/categories', listSelectors: ['table tbody tr', "div.md\\:hidden.space-y-3 > div"], sampleEditSelector: 'table tbody tr td a[href*="edit="]', mobileSampleEditSelector: 'div.md\\:hidden.space-y-3 > div a[href*="edit="]', pageSizeSelector: 'select[name="pageSize"]' },
      { key: 'homepage', path: '/admin/homepage', listSelectors: ['.space-y-3 > div'], sampleEditSelector: '.space-y-3 > div a[href*="?edit="]', pageSizeSelector: 'select[name="pageSize"]' },
    ];

    const failures: string[] = [];
    for (const p of pages) {
      for (const v of viewports) {
        try {
          await page.setViewportSize({ width: v.w, height: v.h });
          await page.goto(`${base}${p.path}`);
          // wait for either desktop or mobile list selector
          let foundList = false;
          for (const sel of p.listSelectors ?? [p.listSelectors?.[0]]) {
            try {
              await page.waitForSelector(sel, { timeout: 2000 });
              foundList = true;
              break;
            } catch (e) {
              // try next
            }
          }
          if (!foundList) throw new Error(`No list selector matched for ${p.key}`);

          // capture screenshot
          const snap = path.join(outDir, `${p.key}-${v.w}x${v.h}.png`);
          await page.screenshot({ path: snap, fullPage: true });

          // check overflow (allow small deltas for rounding)
          const overflowDelta = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
          if (overflowDelta > 8) failures.push(`${p.key} overflow at ${v.w}x${v.h} delta=${overflowDelta} (screenshot: ${snap})`);

          // page-size selector presence
          const selHandle = await page.$(p.pageSizeSelector);
          if (!selHandle) failures.push(`${p.key}: page-size selector not found at ${v.w}x${v.h}`);

          // edit/delete button cursor pointer check for first item
          const edit = await page.$(p.sampleEditSelector) ?? await page.$(p.mobileSampleEditSelector ?? '');
          if (!edit) failures.push(`${p.key}: edit link not found at ${v.w}x${v.h}`);
          const delBtn = await page.$('button:has-text("Delete")');
          if (!delBtn) failures.push(`${p.key}: delete button not found at ${v.w}x${v.h}`);
          else {
            const cursor = await delBtn.evaluate((el) => getComputedStyle(el).cursor);
            if (cursor !== 'pointer' && cursor !== 'auto' && !cursor.includes('pointer')) {
              failures.push(`${p.key}: delete cursor not pointer (${cursor}) at ${v.w}x${v.h}`);
            }
          }

          // ensure pagination controls exist
          const next = await page.$('text=Next');
          const prev = await page.$('text=Prev');
          if (!next || !prev) failures.push(`${p.key}: pagination controls not found at ${v.w}x${v.h}`);

          // basic search test: search for a known fixture
          try {
            if (p.key === 'products') {
              const target = productSlugs[5];
              await page.fill('input[name="search"]', target);
              await Promise.all([page.waitForNavigation({ url: `**${p.path}?**` }), page.click('button:has-text("Search")')]);
              // wait for whichever list selector is present after search
              let matched = false;
              let rows = 0;
              for (const sel of p.listSelectors ?? [p.listSelectors?.[0]]) {
                try {
                  await page.waitForSelector(sel, { timeout: 3000 });
                  rows = await page.$$eval(sel, (els) => els.length);
                  matched = true;
                  break;
                } catch (e) {
                  // try next
                }
              }
              if (!matched) failures.push(`${p.key}: search list not found after search at ${v.w}x${v.h}`);
              if (rows < 1) failures.push(`${p.key}: search returned no results for ${target} at ${v.w}x${v.h}`);
              await page.goto(`${base}${p.path}`);
            }

            if (p.key === 'categories') {
              const target = categorySlugs[4];
              await page.fill('input[name="search"]', target);
              await Promise.all([page.waitForNavigation({ url: `**${p.path}?**` }), page.click('button:has-text("Search")')]);
              let matchedc = false;
              let rowsC = 0;
              for (const sel of p.listSelectors ?? [p.listSelectors?.[0]]) {
                try {
                  await page.waitForSelector(sel, { timeout: 3000 });
                  rowsC = await page.$$eval(sel, (els) => els.length);
                  matchedc = true;
                  break;
                } catch (e) {
                  // try next
                }
              }
              if (!matchedc) failures.push(`${p.key}: search list not found after search at ${v.w}x${v.h}`);
              if (rowsC < 1) failures.push(`${p.key}: search returned no results for ${target} at ${v.w}x${v.h}`);
              await page.goto(`${base}${p.path}`);
            }

            if (p.key === 'homepage') {
              const target = sectionTitles[2];
              await page.fill('input[name="search"]', target).catch(() => {});
              let matchedH = false;
              for (const sel of p.listSelectors ?? [p.listSelectors?.[0]]) {
                try {
                  await page.waitForSelector(sel, { timeout: 3000 });
                  matchedH = true;
                  break;
                } catch (e) {}
              }
              if (!matchedH) failures.push(`${p.key}: list not found after search at ${v.w}x${v.h}`);
            }
          } catch (inner) {
            failures.push(`${p.key}: search check failed at ${v.w}x${v.h} - ${String(inner)}`);
            await page.goto(`${base}${p.path}`);
          }
        } catch (err) {
          failures.push(`${p.key} @ ${v.w}x${v.h}: ${String(err)}`);
        }
      }
    }

    if (failures.length > 0) {
      console.error('Responsive failures:', failures.join('\n'));
      process.exit(2);
    }

    console.log('Responsive checks passed');
  } catch (e: any) {
    console.error('Responsive checks failed:', e);
    process.exit(2);
  } finally {
    // cleanup
    await sql`delete from products where slug like ${`e2e-responsive-product-${ts}-%`}`;
    await sql`delete from categories where slug like ${`e2e-responsive-category-${ts}-%`}`;
    await sql`delete from homepage_sections where configuration_json->>'title' like ${`%e2e-responsive-section-${ts}-%`}`;
    await sql.end();
    await browser.close();
  }
}

void main();
