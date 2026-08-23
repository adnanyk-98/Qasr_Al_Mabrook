import sharp from 'sharp';

const urls = [
  'https://media.qasralmabrook.com/hero/Super-Market-Banner.jpg',
  'https://media.qasralmabrook.com/hero/Super-Market-Banner-Mobile.jpg',
  'https://media.qasralmabrook.com/hero/Cloth-Piece-WEB.jpg',
  'https://media.qasralmabrook.com/hero/Cloth-Piece-WEB-mobile.jpg',
  'https://media.qasralmabrook.com/hero/Measuring-Tape-WebBanner.jpg',
  'https://media.qasralmabrook.com/hero/Measuring-Tape-WebBanner-Mobile.jpg',
];

(async () => {
  for (const u of urls) {
    try {
      const res = await fetch(u);
      const ok = res.ok;
      const status = res.status;
      const ct = res.headers.get('content-type');
      const buffer = await res.arrayBuffer();
      const meta = await sharp(Buffer.from(buffer)).metadata();
      console.log(JSON.stringify({ url: u, ok, status, contentType: ct, width: meta.width, height: meta.height, size: buffer.byteLength }));
    } catch (e) {
      console.error('ERROR fetching', u, e);
    }
  }
})();
