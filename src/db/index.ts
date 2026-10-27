import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { serverEnv } from "@/config/env";
import * as schema from "@/db/schema";

const databaseUrl = serverEnv.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL environment variable is required for database connectivity.",
  );
}

const parsedDatabaseUrl = new URL(databaseUrl);
const isCiTestDatabase =
  process.env.CI === "true" &&
  parsedDatabaseUrl.username === "qam_test" &&
  parsedDatabaseUrl.pathname === "/qam_test" &&
  ["localhost", "127.0.0.1"].includes(parsedDatabaseUrl.hostname);

const client = postgres(databaseUrl, {
  max: 10,
  ssl: isCiTestDatabase ? false : "require",
  prepare: false,
});

export const db = drizzle(client, { schema });

export type Database = typeof db;
