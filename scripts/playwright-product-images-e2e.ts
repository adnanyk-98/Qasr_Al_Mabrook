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

  const tmpDir = path.resolve('tmp-e2e');
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

  // login
  await page.goto(`${base}/admin/login`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await Promise.all([page.waitForNavigation({ url: '**/admin' }), page.click('button[type="submit"]')]);

  // go to products admin and open create
  await page.goto(`${base}/admin/products`);

  // fill product form
  const slug = `e2e-test-product-${Date.now()}`;
  await page.fill('input[name="name"]', 'E2E Test Product');
  await page.fill('input[name="slug"]', slug);

  // attach files to the multiple input
  const fileInput = await page.$('input#productImageFiles');
  if (!fileInput) throw new Error('file input not found');

  // monitor network for upload endpoints
  let uploadCount = 0;
  page.on('requestfinished', (req) => {
    try {
      const url = req.url();
      if (url.includes('/api/admin/products/image-upload')) uploadCount++;
    } catch {}
  });

  await fileInput.setInputFiles(files);

  // wait until three hidden inputs imageUrl appear
  await page.waitForFunction(() => document.querySelectorAll('input[name="imageUrl"]').length >= 3, null, { timeout: 20000 });

  // Submit the product form
  await Promise.all([
    page.waitForNavigation({ url: '**/admin/products' }),
    page.click('button[type="submit"]'),
  ]);

  // verify uploads occurred
  console.log('Upload requests observed:', uploadCount);

  // verify DB rows
  const sel = await resolveMigrationDatabase();
  if (!sel) {
    console.error('No reachable DB for verification');
    process.exit(1);
  }
  const connString = sel.url;
  const sql = postgres(connString, { ssl: false });
  try {
    const prod = await sql`select id from products where slug = ${slug} limit 1`;
    if (!prod || prod.length === 0) {
      console.error('Product not found in DB');
      process.exit(2);
    }
    const productId = prod[0].id;
    const rows = await sql`select id, public_url, object_key, is_primary from product_images where product_id = ${productId}`;
    console.log('product_images rows count:', rows.length);
    rows.forEach((r, i: number) => {
      const row = r as { public_url: string; object_key: string; is_primary: boolean };
      console.log(i + 1, row.public_url, row.object_key, 'primary=', row.is_primary);
    });
    await sql.end();
  } catch (error: unknown) {
    console.error('DB verification failed:', error instanceof Error ? error.message : String(error));
    await sql.end();
    process.exit(1);
  }

  await browser.close();
  console.log('E2E finished');
}

void main();
