const sharp = require('sharp');
const fs = require('fs');
const crypto = require('crypto');
(async () => {
  const out = 'tests/fixtures/hero-1920x1080-large.jpg';
  await fs.promises.mkdir('tests/fixtures', { recursive: true });
  const width = 1920, height = 1080;
  const buf = Buffer.allocUnsafe(width * height * 3);
  crypto.randomFillSync(buf);
  await sharp(buf, { raw: { width, height, channels: 3 } }).jpeg({ quality: 90 }).toFile(out);
  const stat = await fs.promises.stat(out);
  console.log('Wrote', out, 'size', stat.size);
})();
