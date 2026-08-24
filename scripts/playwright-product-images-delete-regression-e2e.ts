import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import postgres from 'postgres';
import { resolveMigrationDatabase } from './migration-db';
import { config } from 'dotenv';

config({ path: process.env.DOTENV_CONFIG_PATH ?? '.env.local' });

async function genImage(filePath: string, color: string) {
  await sharp({
    create: {
      width: 1000,
      height: 1000,
      channels: 3,
      background: color,
    },
  })
    .png()
    .toFile(filePath);
}

async function main() {
  const base = 'http://127.0.0.1:3000';
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL ?? 'e2e-admin@example.test';
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD ?? 'ChangeMe123!';

  const tmpDir = path.resolve('tmp-e2e-delete');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
  const files = [
    path.join(tmpDir, 'img1.png'),
    path.join(tmpDir, 'img2.png'),
    path.join(tmpDir, 'img3.png'),
  ];
  await genImage(files[0], '#ff0000');
  await genImage(files[1], '#00ff00');
  await genImage(files[2], '#0000ff');

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const consoleMessages: string[] = [];
  const requests: any[] = [];
  const responses: any[] = [];
  page.on('console', (c) => consoleMessages.push(`${c.type()}: ${c.text()}`));
  page.on('request', (r) => requests.push({ url: r.url(), method: r.method(), postData: r.postData() }));
  page.on('response', async (r) => {
    let body: string | null = null;
    try { body = await r.text(); } catch {};
    responses.push({ url: r.url(), status: r.status(), body });
  });

  // login
  await page.goto(`${base}/admin/login`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await Promise.all([page.waitForNavigation({ url: '**/admin' }), page.click('button[type="submit"]')]);

  // create product with 3 images via UI to exercise upload path (deterministic product slug)
  await page.goto(`${base}/admin/products`);
  const slug = `e2e-del-product-${Date.now()}`;
  await page.fill('input[name="name"]', 'E2E Delete Product');
  await page.fill('input[name="slug"]', slug);
  const fileInput = await page.waitForSelector('input#productImageFiles', { timeout: 20000 });
  if (!fileInput) throw new Error('file input not found');
  await fileInput.setInputFiles(files);
  await page.waitForFunction(() => document.querySelectorAll('input[data-testid="product-image-url"]').length >= 3, null, { timeout: 20000 });
  await Promise.all([
    page.waitForNavigation({ url: '**/admin/products' }),
    page.click('button[type="submit"]'),
  ]);

  // DB connection
  const sel = await resolveMigrationDatabase();
  if (!sel) {
    console.error('No reachable DB for verification');
    process.exit(1);
  }
  const connString = sel.url;
  const sql = postgres(connString, { ssl: false });

  // get product id and images (deterministic ids)
  const prod = await sql`select id from products where slug = ${slug} limit 1`;
  if (!prod || prod.length === 0) {
    console.error('Product not found');
    process.exit(2);
  }
  const productId = prod[0].id;

  // verify 3 images
  let rows = await sql`select id, object_key, public_url, is_primary from product_images where product_id = ${productId} order by sort_order, created_at`;
  if (rows.length !== 3) {
    console.error('Expected 3 product_images, got', rows.length);
    process.exit(3);
  }

  // capture expected ids and keys for deterministic assertions
  const expectedImageIds = rows.map((r: any) => r.id);
  const expectedObjectKeys = rows.map((r: any) => r.object_key);
  const expectedPublicUrls = rows.map((r: any) => r.public_url);
  const expectedPrimaryId = rows.find((r: any) => r.is_primary)?.id ?? null;

  // Choose a non-primary image to delete
  const primary = rows.find((r: any) => r.is_primary);
  const nonPrimary = rows.find((r: any) => !r.is_primary) as any;
  if (!nonPrimary) {
    console.error('No non-primary image to delete');
    process.exit(4);
  }

  // Open edit page and wait deterministically for server-rendered edit UI and image items
  await page.goto(`${base}/admin/products?edit=${productId}`);
  await page.waitForSelector('text=Editing:', { timeout: 20000 });
  await page.waitForSelector('[data-testid="product-image-item"]', { timeout: 20000 });
  // ensure expected image IDs are present in DOM
  for (const id of expectedImageIds) {
    const selector = `input[data-testid="product-image-id"][value="${id}"]`;
    await page.waitForSelector(selector, { state: 'attached', timeout: 20000 });
  }

  // find the remove button for the non-primary image using the hidden input value
  const objectKey = nonPrimary.object_key;
  const imageIdToDelete = nonPrimary.id;
  const removeButton = await page.$(`xpath=//div[.//input[@data-testid='product-image-id' and @value='${imageIdToDelete}']]//button[@data-testid='product-image-remove']`);
  if (!removeButton) throw new Error('Remove button not found for non-primary image');

  await removeButton.click();
  // wait for modal visible
  await page.waitForSelector('[data-testid="remove-image-modal"]', { timeout: 20000 });
  // Click Cancel and verify no delete request
  const deleteRequestsBefore = requests.filter((r) => r.url.includes('/api/admin/products/image-delete')).length;
  const cancelBtn = await page.$('[data-testid="cancel-remove-image"]');
  if (!cancelBtn) throw new Error('Cancel button not found in modal');
  await cancelBtn.click();
  await page.waitForSelector('[data-testid="remove-image-modal"]', { state: 'hidden', timeout: 20000 });
  const deleteRequestsAfter = requests.filter((r) => r.url.includes('/api/admin/products/image-delete')).length;
  if (deleteRequestsAfter !== deleteRequestsBefore) throw new Error('Unexpected delete request occurred on cancel');

  // Re-open modal and confirm deletion
  await removeButton.click();
  await page.waitForSelector('[data-testid="remove-image-modal"]', { timeout: 20000 });
  const confirmBtn = await page.$('[data-testid="confirm-remove-image"]');
  if (!confirmBtn) throw new Error('Confirm button not found in modal');

  // prepare to wait for delete network response
  const deleteResponsePromise = page.waitForResponse((res) => res.url().includes('/api/admin/products/image-delete') && res.request().method() === 'POST', { timeout: 20000 });
  await confirmBtn.click();
  const deleteResponse = await deleteResponsePromise;
  const deleteStatus = deleteResponse.status();
  const deleteBody = await deleteResponse.json().catch(() => ({}));
  if (deleteStatus < 200 || deleteStatus >= 300 || !deleteBody?.success) {
    throw new Error(`Delete API failed: ${deleteStatus} ${JSON.stringify(deleteBody)}`);
  }
  if (deleteBody.newPrimaryImageId && deleteBody.newPrimaryImageId === imageIdToDelete) {
    throw new Error('Server returned deleted image as newPrimaryImageId');
  }

  // wait for DOM to remove the item
  await page.waitForFunction((id) => !document.querySelector(`input[data-testid="product-image-id"][value="${id}"]`), imageIdToDelete, { timeout: 20000 });

  // Save
  await Promise.all([page.waitForNavigation({ url: '**/admin/products' }), page.click('button[type="submit"]')]);

  rows = await sql`select id, object_key, is_primary from product_images where product_id = ${productId} order by sort_order, created_at`;
  if (rows.length !== 2) {
    console.error('Expected 2 product_images after deletion, got', rows.length);
    process.exit(5);
  }

  // verify DB no longer has deleted id
  const checkDeleted = await sql`select id from product_images where id = ${imageIdToDelete}`;
  if (checkDeleted.length !== 0) {
    throw new Error('Deleted image still present in DB');
  }

  // Now delete primary image
  const primaryRow = rows.find((r: any) => r.is_primary) ?? rows[0];
  // open edit
  await page.goto(`${base}/admin/products?edit=${productId}`);
  await page.waitForSelector('text=Editing:', { timeout: 20000 });
  await page.waitForSelector('[data-testid="product-image-item"]', { timeout: 20000 });
  // wait for expected remaining image ids to be attached
  for (const r of rows) {
    const sel = `input[data-testid="product-image-id"][value="${r.id}"]`;
    await page.waitForSelector(sel, { state: 'attached', timeout: 20000 });
  }
  const removePrimaryBtn = await page.$(`xpath=//div[.//input[@data-testid='product-image-id' and @value='${primaryRow.id}']]//button[@data-testid='product-image-remove']`);
  if (!removePrimaryBtn) throw new Error('Remove button not found for primary image');
  await removePrimaryBtn.click();
  // wait for modal and then confirm deletion similar to above
  await page.waitForSelector('[data-testid="remove-image-modal"]', { timeout: 20000 });
  const confirmPrimaryBtn = await page.$('[data-testid="confirm-remove-image"]');
  if (!confirmPrimaryBtn) throw new Error('Confirm button not found for primary modal');
  const deletePrimaryResponse = page.waitForResponse((res) => res.url().includes('/api/admin/products/image-delete') && res.request().method() === 'POST', { timeout: 20000 });
  await confirmPrimaryBtn.click();
  const primaryDeleteResp = await deletePrimaryResponse;
  const primaryBody = await primaryDeleteResp.json().catch(() => ({}));
  if (!primaryBody?.success) throw new Error('Primary delete failed');
  // wait for DOM to update: one image should remain
  await page.waitForFunction(() => document.querySelectorAll('input[data-testid="product-image-id"]').length === 1, null, { timeout: 20000 });

  await Promise.all([page.waitForNavigation({ url: '**/admin/products' }), page.click('button[type="submit"]')]);

  rows = await sql`select id, object_key, is_primary from product_images where product_id = ${productId} order by sort_order, created_at`;
  if (rows.length !== 1) {
    console.error('Expected 1 product_images after deleting primary, got', rows.length);
    process.exit(6);
  }
  const newPrimary = rows.find((r: any) => r.is_primary) ?? rows[0];
  // verify products.primaryImageId
  const prodRow = await sql`select primary_image_id from products where id = ${productId} limit 1`;
  if ((prodRow[0].primary_image_id ?? null) !== (newPrimary.id ?? null)) {
    console.error('products.primaryImageId not updated');
    process.exit(7);
  }

  // delete last image
  await page.goto(`${base}/admin/products?edit=${productId}`);
  await page.waitForSelector('text=Editing:', { timeout: 20000 });
  await page.waitForSelector('[data-testid="product-image-item"]', { timeout: 20000 });
  const lastRemoveBtn = await page.$(`xpath=//div[.//input[@data-testid='product-image-id']]//button[@data-testid='product-image-remove']`);
  if (!lastRemoveBtn) throw new Error('Remove button not found for last image');
  await lastRemoveBtn.click();
  await page.waitForSelector('[data-testid="remove-image-modal"]', { timeout: 20000 });
  const confirmLastBtn = await page.$('[data-testid="confirm-remove-image"]');
  if (!confirmLastBtn) throw new Error('Confirm button not found for last modal');
  const deleteLastRespPromise = page.waitForResponse((res) => res.url().includes('/api/admin/products/image-delete') && res.request().method() === 'POST', { timeout: 20000 });
  await confirmLastBtn.click();
  await deleteLastRespPromise;
  await page.waitForFunction(() => document.querySelectorAll('input[data-testid="product-image-id"]').length === 0, null, { timeout: 20000 });
  await Promise.all([page.waitForNavigation({ url: '**/admin/products' }), page.click('button[type="submit"]')]);

  rows = await sql`select id from product_images where product_id = ${productId}`;
  if (rows.length !== 0) {
    console.error('Expected 0 product_images after deleting all, got', rows.length);
    process.exit(8);
  }
  const prodRow2 = await sql`select primary_image_id from products where id = ${productId} limit 1`;
  if (prodRow2[0].primary_image_id !== null) {
    console.error('products.primaryImageId not cleared');
    process.exit(9);
  }

  await sql.end();
  await browser.close();
  console.log('Delete regression E2E finished');
}

void main();
