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

  const tmpDir = path.resolve('tmp-e2e-reg');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
  const files = [
    path.join(tmpDir, 'img1.png'),
    path.join(tmpDir, 'img2.png'),
    path.join(tmpDir, 'img3.png'),
    path.join(tmpDir, 'img4.png'),
  ];
  await genImage(files[0], '#ff0000');
  await genImage(files[1], '#00ff00');
  await genImage(files[2], '#0000ff');
  await genImage(files[3], '#ffff00');

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // login
  await page.goto(`${base}/admin/login`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await Promise.all([page.waitForNavigation({ url: '**/admin' }), page.click('button[type="submit"]')]);

  // go to products admin and open create
  await page.goto(`${base}/admin/products`);

  // fill product form
  const slug = `e2e-test-product-reg-${Date.now()}`;
  await page.fill('input[name="name"]', 'E2E Regression Product');
  await page.fill('input[name="slug"]', slug);

  const fileInput = await page.$('input#productImageFiles');
  if (!fileInput) throw new Error('file input not found');

  // monitor upload requests
  let uploadCount = 0;
  page.on('requestfinished', (req) => {
    try {
      const url = req.url();
      if (url.includes('/api/admin/products/image-upload')) uploadCount++;
    } catch {}
  });

  await fileInput.setInputFiles([files[0], files[1], files[2]]);

  // wait until three hidden inputs imageUrl appear
  await page.waitForFunction(() => document.querySelectorAll('input[name="imageUrl"]').length >= 3, null, { timeout: 20000 });

  // Submit the product form
  await Promise.all([
    page.waitForNavigation({ url: '**/admin/products' }),
    page.click('button[type="submit"]'),
  ]);

  console.log('Initial upload requests observed:', uploadCount);

  // verify DB rows and get product id
  const sel = await resolveMigrationDatabase();
  if (!sel) {
    console.error('No reachable DB for verification');
    process.exit(1);
  }
  const connString = sel.url;
  const sql = postgres(connString, { ssl: false });
  let productId: string;
  try {
    const prod = await sql`select id from products where slug = ${slug} limit 1`;
    if (!prod || prod.length === 0) {
      console.error('Product not found in DB');
      process.exit(2);
    }
    productId = prod[0].id;
    let rows = await sql`select id, public_url, object_key, is_primary from product_images where product_id = ${productId}`;
    console.log('product_images rows count after create:', rows.length);
    if (rows.length !== 3) {
      console.error('Expected 3 product_images after initial create');
      process.exit(3);
    }
  } catch (e: any) {
    console.error('DB verification failed:', e.message ?? e);
    await sql.end();
    process.exit(1);
  }

  // Open edit view for this product
  await page.goto(`${base}/admin/products?edit=${productId}`);
  await page.waitForSelector('input[name="productId"]');

  // Check that product-image inputs are present and equal to 3
  const imageIdsCount = await page.$$eval('input[name="imageId"]', (els) => els.length);
  const imageUrlsCount = await page.$$eval('input[name="imageUrl"]', (els) => els.length);
  console.log('On edit: imageId count=', imageIdsCount, 'imageUrl count=', imageUrlsCount);
  if (imageIdsCount !== 3 || imageUrlsCount !== 3) {
    console.error('Edit page did not initialize images correctly');
    process.exit(4);
  }

  // reload and verify counts remain 3 (no duplicates)
  await page.reload();
  const imageIdsCountAfterReload = await page.$$eval('input[name="imageId"]', (els) => els.length);
  const imageUrlsCountAfterReload = await page.$$eval('input[name="imageUrl"]', (els) => els.length);
  console.log('After reload: imageId count=', imageIdsCountAfterReload, 'imageUrl count=', imageUrlsCountAfterReload);
  if (imageIdsCountAfterReload !== 3 || imageUrlsCountAfterReload !== 3) {
    console.error('Reload introduced duplication');
    process.exit(5);
  }

  // Save without uploading anything
  await Promise.all([page.waitForNavigation({ url: '**/admin/products' }), page.click('button[type="submit"]')]);

  // verify DB still has 3 rows
  try {
    const rowsAfterSave = await sql`select id from product_images where product_id = ${productId}`;
    console.log('product_images rows count after save without upload:', rowsAfterSave.length);
    if (rowsAfterSave.length !== 3) {
      console.error('DB changed after save without upload');
      process.exit(6);
    }
  } catch (e: any) {
    console.error('DB verification failed:', e.message ?? e);
    await sql.end();
    process.exit(1);
  }

  // Re-open edit, upload a new image, then save
  await page.goto(`${base}/admin/products?edit=${productId}`);
  await page.waitForSelector('input#productImageFiles');
  const fileInput2 = await page.$('input#productImageFiles');
  if (!fileInput2) throw new Error('file input not found on edit page');
  await fileInput2.setInputFiles([files[3]]);
  // wait until a fourth imageUrl hidden input appears
  await page.waitForFunction(() => document.querySelectorAll('input[name="imageUrl"]').length >= 4, null, { timeout: 20000 });

  // Submit save
  await Promise.all([page.waitForNavigation({ url: '**/admin/products' }), page.click('button[type="submit"]')]);

  // verify DB now has 4 rows and exactly one primary
  try {
    const rowsFinal = await sql`select id, is_primary from product_images where product_id = ${productId}`;
    console.log('product_images rows count after adding one:', rowsFinal.length);
    if (rowsFinal.length !== 4) {
      console.error('Expected 4 product_images after adding one');
      process.exit(7);
    }
    const primaryCount = rowsFinal.filter((r: any) => r.is_primary).length;
    console.log('primary count=', primaryCount);
    if (primaryCount !== 1) {
      console.error('Expected exactly one primary image');
      process.exit(8);
    }
    await sql.end();
  } catch (e: any) {
    console.error('DB verification failed:', e.message ?? e);
    await sql.end();
    process.exit(1);
  }

  await browser.close();
  console.log('Regression E2E finished');
}

void main();
