import { config } from 'dotenv';

// Load .env.local before any tests run
config({ path: '.env.local', override: true });
