import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
console.log('process.env.R2_ACCOUNT_ID=', process.env.R2_ACCOUNT_ID?.slice(0,8));
import { serverEnv } from '../src/config/env';
console.log('serverEnv.R2_ACCOUNT_ID=', serverEnv.R2_ACCOUNT_ID?.slice(0,8));
console.log('serverEnv.R2_BUCKET_NAME=', serverEnv.R2_BUCKET_NAME);
console.log('serverEnv.R2_PUBLIC_BASE_URL=', serverEnv.R2_PUBLIC_BASE_URL);
