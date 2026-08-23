import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
console.log('R2_ACCOUNT_ID=', process.env.R2_ACCOUNT_ID?.slice(0,8));
console.log('R2_BUCKET_NAME=', process.env.R2_BUCKET_NAME);
console.log('R2_PUBLIC_BASE_URL=', process.env.R2_PUBLIC_BASE_URL);
