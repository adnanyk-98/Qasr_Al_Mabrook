/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config({path:'.env.local'});
const { S3Client, HeadObjectCommand } = require('@aws-sdk/client-s3');
const account = process.env.R2_ACCOUNT_ID;
const bucket = process.env.R2_BUCKET_NAME;
if (!account || !bucket) {
  console.error('R2 not configured');
  process.exit(2);
}
const s3 = new S3Client({ region: 'auto', endpoint: `https://${account}.r2.cloudflarestorage.com`, credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY } });
const keys = [
  'catalogue/adivasi-oil/Adivasi-Oil-01.jpg',
  'catalogue/cloth-piece/Cloth-Piece-01.jpg',
  'catalogue/fancy-suit/FANCY-SUIT-01.jpg',
  'catalogue/pajama/Pajama-01.jpg',
  'catalogue/measuring-tape/5.5M-Measuring-Tape-Green-01.jpg',
];
(async () => {
  for (const k of keys) {
    try {
      await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: k }));
      console.log(k + ':FOUND');
    } catch (e) {
      console.log(k + ':MISSING:' + (e.name || e.code || e.message));
    }
  }
})();
