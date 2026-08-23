const sharp = require('sharp');
const fs = require('fs');
(async () => {
  const out = 'tests/fixtures/hero-1920x1080.jpg';
  await fs.promises.mkdir('tests/fixtures', { recursive: true });
  const image = sharp({
    create: {
      width: 1920,
      height: 1080,
      channels: 3,
      background: { r: 200, g: 100, b: 60 },
    },
  });
  await image.jpeg({ quality: 95 }).toFile(out);
  const stat = await fs.promises.stat(out);
  console.log('Wrote', out, 'size', stat.size);
})();
