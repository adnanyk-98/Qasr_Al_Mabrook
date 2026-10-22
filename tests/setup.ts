import { config } from "dotenv";

// Load .env.local before any tests run
config({ path: ".env.local", override: true });

const offlineTestDatabaseUrl = "postgres://offline:offline@127.0.0.1:1/offline_test";
process.env.DATABASE_URL = offlineTestDatabaseUrl;
process.env.DIRECT_DATABASE_URL = offlineTestDatabaseUrl;
