import fs from 'fs/promises';
import path from 'path';
import mime from 'mime';
import sharp from 'sharp';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

import dotenv from 'dotenv';

// Load environment from .env.local for script runs
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { serverEnv } from '../src/config/env';
import { generateR2PublicUrl } from '../src/lib/catalogue-import';
import { readOriginalProductImageMetadata } from '../src/lib/catalogue-import';
import { listHomepageSections, updateHomepageSection, createHomepageSection } from '../src/server/repositories/catalog-admin';

async function readImage(p: string) {
  const buf = await fs.readFile(p);
  const meta = await sharp(buf).metadata();
  return { buf, width: meta.width ?? null, height: meta.height ?? null, size: buf.length };
}

function r2Client() {
  const account = process.env.R2_ACCOUNT_ID ?? '';
  const endpoint = `https://${account}.r2.cloudflarestorage.com`;
  return new S3Client({ region: 'auto', endpoint, credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '', secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '' } });
}

function objectKeyFromUrl(publicBase: string, url: string) {
  const base = publicBase.replace(/\/$/, '');
  if (!url.startsWith(base)) return null;
  return url.slice(base.length + 1);
}

async function deleteR2Objects(keys: string[]) {
  const client = r2Client();
  for (const key of keys) {
    try {
      await client.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key }));
      console.log('Deleted R2 object', key);
    } catch (e) {
      console.error('Failed to delete', key, e);
    }
  }
}

async function uploadToR2(buffer: Buffer, filename: string) {
  const client = r2Client();
  const safeFilename = filename.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9.\-_%]/g, '');
  const key = `hero/${safeFilename}`;
  const contentType = mime.getType(filename) || 'application/octet-stream';
  await client.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key, Body: buffer, ContentType: contentType }));
  const publicUrl = generateR2PublicUrl(process.env.R2_PUBLIC_BASE_URL ?? '', key);
  return { key, publicUrl };
}

async function main() {
  if (!process.env.R2_ACCOUNT_ID || !process.env.R2_BUCKET_NAME || !process.env.R2_PUBLIC_BASE_URL) {
    console.error('R2 not configured in environment');
    process.exit(2);
  }

  const root = path.join(process.cwd(), 'catalogue', 'Banner');
  const mobileDir = path.join(root, 'Mobile');

  const mapping = [
    { name: 'Super Market', desktop: 'Super Market Banner.jpg', mobile: 'Super Market Banner-Mobile.jpg' },
    { name: 'Cloth Piece', desktop: 'Cloth Piece-WEB.jpg', mobile: 'Cloth Piece-WEB-mobile.jpg' },
    { name: 'Measuring Tape', desktop: 'Measuring-Tape-WebBanner.jpg', mobile: 'Measuring-Tape-WebBanner-Mobile.jpg' },
  ];

  // Inspect files
  const inspected: any[] = [];
  for (const m of mapping) {
    const dPath = path.join(root, m.desktop);
    const mPath = path.join(mobileDir, m.mobile);
    try {
      const d = await readImage(dPath);
      const mo = await readImage(mPath);
      inspected.push({ name: m.name, desktop: { file: dPath, width: d.width, height: d.height, size: d.size }, mobile: { file: mPath, width: mo.width, height: mo.height, size: mo.size } });
    } catch (e) {
      console.error('Failed to read image pair for', m.name, e);
      process.exit(2);
    }
  }

  console.log('Inspected images:', JSON.stringify(inspected, null, 2));

  // Validate dimensions
  for (const item of inspected) {
    if (item.desktop.width !== 1920 || item.desktop.height !== 720) {
      console.error('Desktop image has incorrect dimensions for', item.name, item.desktop.width, item.desktop.height);
      process.exit(2);
    }
    if (item.mobile.width !== 1080 || item.mobile.height !== 1200) {
      console.error('Mobile image has incorrect dimensions for', item.name, item.mobile.width, item.mobile.height);
      process.exit(2);
    }
  }

  // Archive existing hero sections and collect R2 keys to delete
  const sections = await listHomepageSections();
  const toDeleteKeys = new Set<string>();
  for (const s of sections) {
    if ((s.sectionType || '').toLowerCase() === 'hero') {
      // collect imageUrl if present
      const cfg = s.configurationJson as any;
      if (cfg?.imageUrl && typeof cfg.imageUrl === 'string' && cfg.imageUrl.startsWith(process.env.R2_PUBLIC_BASE_URL || '')) {
        const key = objectKeyFromUrl(process.env.R2_PUBLIC_BASE_URL ?? '', cfg.imageUrl);
        if (key) toDeleteKeys.add(key);
      }
      // archive
      if (s.status !== 'ARCHIVED') {
        await updateHomepageSection({ id: s.id, status: 'ARCHIVED' });
        console.log('Archived section', s.id);
      }
    }
  }

  if (toDeleteKeys.size > 0) {
    console.log('Deleting old R2 keys:', Array.from(toDeleteKeys));
    await deleteR2Objects(Array.from(toDeleteKeys));
  } else {
    console.log('No old R2 hero objects found to delete');
  }

  // Upload new assets
  const uploaded: any[] = [];
  for (const item of inspected) {
    const dBuf = await fs.readFile(item.desktop.file);
    const mBuf = await fs.readFile(item.mobile.file);
    const desktopUpload = await uploadToR2(dBuf, path.basename(item.desktop.file));
    const mobileUpload = await uploadToR2(mBuf, path.basename(item.mobile.file));
    console.log('Uploaded', item.name, desktopUpload.publicUrl, mobileUpload.publicUrl);
    uploaded.push({ name: item.name, desktop: desktopUpload, mobile: mobileUpload });
  }

  // Create three homepage sections with desktop+mobile urls
  let order = 1;
  for (const u of uploaded) {
    const cfg = {
      desktopImageUrl: u.desktop.publicUrl,
      mobileImageUrl: u.mobile.publicUrl,
      imageAlt: u.name,
      enabled: true,
    } as any;
    const created = await createHomepageSection({ sectionType: 'hero', status: 'PUBLISHED', sortOrder: String(order), configurationJson: cfg });
    console.log('Created hero section', created.id, 'order', order);
    order++;
  }

  console.log('Import complete');
}

main().catch((e) => {
  console.error('ERROR', e);
  process.exit(2);
});
