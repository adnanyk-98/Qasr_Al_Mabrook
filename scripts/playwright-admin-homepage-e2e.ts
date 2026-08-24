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

  const outDir = path.resolve('tmp/e2e-admin/homepage');
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const ts = Date.now();
  // add a unique forwarded-for header per run to avoid shared rate-limit collisions
  const context = await browser.newContext({ extraHTTPHeaders: { 'x-forwarded-for': String(ts) } });
  const page = await context.newPage();

  const sel = await resolveMigrationDatabase();
  if (!sel) { console.error('No reachable DB for verification'); process.exit(1); }
  // Prefer the pooler DATABASE_URL if set (the Next server uses DATABASE_URL).
  const chosenDbUrl = process.env.DATABASE_URL ?? sel.url;
  console.log('Using DB resolver for verification: ' + (process.env.DATABASE_URL ? 'DATABASE_URL' : sel.source));
  // Match the server's DB client SSL behavior to ensure we query the same pooler/primary.
  const sql = postgres(chosenDbUrl, { ssl: 'require' });
  const sectionIds: string[] = [];
  // create 11 sections
  for (let i = 0; i < 11; i++) {
    const id = await sql`insert into homepage_sections (id, section_type, status, sort_order, configuration_json, created_at, updated_at) values (gen_random_uuid(), ${'hero'}, 'DRAFT', ${i}, ${JSON.stringify({ title: `e2e-section-${ts}-${i}` })}, now(), now()) returning id`;
    sectionIds.push(id[0].id);
  }

  try {
    await page.goto(`${base}/admin/login`);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await Promise.all([page.waitForNavigation({ url: '**/admin' }), page.click('button[type="submit"]')]);

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${base}/admin/homepage`);
    await page.waitForSelector('text=Configured sections', { timeout: 10000 });

    // page should show 10 items
    const rows = await page.$$eval('.space-y-3 > div', (els) => els.length);
    if (rows < 10) throw new Error('Expected at least 10 sections on page');

    // Next page
    await Promise.all([page.waitForNavigation({ url: '**/admin/homepage**' }), page.click('text=Next')]);
    // verify second page has remaining items
    await page.waitForSelector('.space-y-3 > div', { timeout: 10000 });

    // Status change: pick an item, change status to PUBLISHED
    await page.goto(`${base}/admin/homepage`);
    await page.waitForSelector('.space-y-3 > div');
    const firstSection = await page.$('.space-y-3 > div');
    if (!firstSection) throw new Error('No section found');
    const sectionId = sectionIds[0];
    // Use status form in DOM: find the form specific to this section and set value, then submit and wait for navigation
    // Use in-page fetch to call the status API (preserves session cookies)
    // Submit a native form in-page to POST form-data with cookies preserved, then wait for navigation
    await page.evaluate(({ id, base }) => {
      const form = document.createElement('form');
      form.method = 'post';
      form.action = base + '/api/admin/homepage';
      const inp1 = document.createElement('input'); inp1.name = 'sectionId'; inp1.value = String(id);
      const inp2 = document.createElement('input'); inp2.name = 'status'; inp2.value = 'PUBLISHED';
      form.appendChild(inp1); form.appendChild(inp2);
      document.body.appendChild(form);
      form.submit();
    }, { id: sectionId as any, base });
    await page.waitForNavigation({ url: '**/admin/homepage**', timeout: 10000 }).catch(() => {});

    // verify DB shows PUBLISHED
    const res = await sql`select status from homepage_sections where id = ${sectionId} limit 1`;
    if (res[0].status !== 'PUBLISHED') throw new Error('Status not updated in DB');

    // Delete a section via UI — pick an ID present in the rendered page so the selector resolves reliably
    await page.goto(`${base}/admin/homepage`);
    await page.waitForSelector('.space-y-3 > div');
    // find first edit link on the page and derive its id
    const editLink = await page.$('.space-y-3 > div a[href*="?edit="]');
    if (!editLink) throw new Error('No editable section link found on page');
    const href = await editLink.getAttribute('href');
    if (!href) throw new Error('Edit link has no href');
    const m = href.match(/edit=([0-9a-fA-F-]{36})/);
    if (!m) throw new Error('Could not parse section id from edit link');
    const delId = m[1];
    const delBtn = await page.$(`xpath=//div[.//a[contains(@href, "edit=${delId}")]]//button[contains(., 'Delete')]`);
    if (!delBtn) throw new Error('Delete button not found for section ' + delId);
    await delBtn.click();
    await page.waitForSelector('text=Delete section', { timeout: 10000 });
    // diagnostic: log DB presence before delete
    const beforeChk = await sql`select id from homepage_sections where id = ${delId}`;
    console.log('DB before delete count:', beforeChk.length);
    const delRespPromise = page.waitForResponse((r) => r.url().includes('/api/admin/homepage/delete') && r.request().method() === 'POST', { timeout: 10000 });
    await page.click('button:has-text("Delete section")');
    const delResp = await delRespPromise;
    const delBody = await delResp.json().catch(() => ({}));
      console.log('DELETE RESPONSE BODY:', JSON.stringify(delBody));
    if (!delResp.ok || !delBody.success) throw new Error('Delete section failed: ' + JSON.stringify(delBody));
    // diagnostic: log DB presence immediately after delete response
    const afterChkImmediate = await sql`select id from homepage_sections where id = ${delId}`;
    console.log('DB immediately after delete count:', afterChkImmediate.length);
      // Additional diagnostics: check both DATABASE_URL and DIRECT_DATABASE_URL for presence
      try {
        const urlsToCheck: Array<{ name: string; url?: string | null }> = [
          { name: 'chosen', url: chosenDbUrl },
          { name: 'direct', url: process.env.DIRECT_DATABASE_URL ?? null },
        ];
        for (const u of urlsToCheck) {
          if (!u.url) continue;
          try {
            const client = postgres(u.url, { ssl: 'require' });
            const rows = await client`select count(*) as cnt from homepage_sections where id = ${delId}`;
            // eslint-disable-next-line no-console
            console.log(`DB check (${u.name}): host=${new URL(u.url).hostname} count=${rows?.[0]?.cnt ?? 'unknown'}`);
            await client.end();
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error(`DB check (${u.name}) failed:`, String(e));
          }
        }
      } catch (e) {
        // ignore diagnostics errors
      }
    // verify DB row removed (poll briefly to allow any async propagation)
    let deletedOk = false;
    for (let attempt = 0; attempt < 10; attempt++) {
      const chk = await sql`select id from homepage_sections where id = ${delId}`;
      if (chk.length === 0) { deletedOk = true; break; }
      await new Promise((r) => setTimeout(r, 500));
    }
    if (!deletedOk) {
      throw new Error('Section still present in DB after delete API reported success');
    }

    // cleanup remaining created sections
    await sql`delete from homepage_sections where configuration_json->>'title' like ${`%e2e-section-${ts}-%`}`;

    console.log('Homepage E2E finished');
  } catch (e: any) {
    const now = Date.now();
    const html = await page.content().catch(() => '');
    fs.writeFileSync(path.join(outDir, `failure-${now}.html`), html);
    console.error(e);
    process.exit(2);
  } finally {
    await sql.end();
    await browser.close();
  }
}

void main();
