import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

function normalizeName(name: string) {
  return name
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/web|banner|mobile|[-_\s]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

async function inspectDir(dir: string) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [] as Array<{ name: string; path: string; width?: number; height?: number; size?: number }>;
  for (const e of entries) {
    if (e.isFile()) {
      const p = path.join(dir, e.name);
      try {
        const buf = await fs.readFile(p);
        const meta = await sharp(buf).metadata();
        files.push({ name: e.name, path: p, width: meta.width, height: meta.height, size: buf.length });
      } catch (err) {
        files.push({ name: e.name, path: p });
      }
    }
  }
  return files;
}

async function main() {
  const root = path.join(process.cwd(), 'catalogue', 'Banner');
  const mobile = path.join(root, 'Mobile');
  const report: any = { root, desktop: [], mobile: [], mapping: {} };
  try {
    report.desktop = await inspectDir(root);
  } catch (e) {
    console.error('Failed to read desktop banner folder', root, e);
    process.exit(2);
  }
  try {
    report.mobile = await inspectDir(mobile);
  } catch (e) {
    report.mobile = [];
  }

  // build quick mapping by normalized names
  const mobileMap = new Map<string, string>();
  for (const m of report.mobile) {
    mobileMap.set(normalizeName(m.name), m.name);
  }
  for (const d of report.desktop) {
    const key = normalizeName(d.name);
    const match = mobileMap.get(key) ?? null;
    report.mapping[d.name] = match;
  }

  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
