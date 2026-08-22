import { config } from "dotenv";

import { spawnSync } from "node:child_process";

config({ path: process.env.DOTENV_CONFIG_PATH ?? ".env.local" });

const stage = process.env.DEPLOYMENT_STAGE;
const confirmation = process.env.MIGRATION_CONFIRMATION;

if (!stage || !["staging", "production"].includes(stage)) {
  console.error("Refusing migration: DEPLOYMENT_STAGE must be staging or production.");
  process.exit(1);
}

if (confirmation !== "APPLY_MIGRATIONS") {
  console.error(
    "Refusing migration: set MIGRATION_CONFIRMATION=APPLY_MIGRATIONS explicitly.",
  );
  process.exit(1);
}

if (!process.env.DIRECT_DATABASE_URL) {
  console.error("Refusing migration: DIRECT_DATABASE_URL is required.");
  process.exit(1);
}

const command = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(command, ["drizzle-kit", "migrate"], { stdio: "inherit" });
process.exit(result.status ?? 1);
