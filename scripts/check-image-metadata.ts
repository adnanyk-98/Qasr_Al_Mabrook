import sharp from 'sharp';

(async () => {
  try {
    const url = 'https://media.qasralmabrook.com/hero/hero/hero-1920x1080-large.jpg';
    const res = await global.fetch(url);
    if (!res.ok) throw new Error('Failed to fetch image: ' + res.status);
    const buffer = await res.arrayBuffer();
    const meta = await sharp(Buffer.from(buffer)).metadata();
    console.log(JSON.stringify({ status: res.status, headers: Object.fromEntries(res.headers), width: meta.width, height: meta.height, size: buffer.byteLength }, null, 2));
    process.exit(0);
  } catch (e) {
    console.error('ERROR', e);
    process.exit(2);
  }
})();
