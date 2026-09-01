import { config } from "dotenv";
import postgres from "postgres";

import { resolveMigrationDatabase } from "./migration-db";
import { getBaselineIdentities } from "./migration-baseline-manifest";
import { validateBaselineAdoptionState } from "./baseline-adoption-policy";

config({ path: process.env.DOTENV_CONFIG_PATH ?? ".env.local" });

const requiredStage = "staging";
const requiredConfirmation = "ADOPT_BASELINE_0003";

function refuse(message: string): never {
  console.error(`Refusing baseline adoption: ${message}`);
  process.exit(1);
}

function requireGates() {
  if (process.env.DEPLOYMENT_STAGE !== requiredStage) refuse(`DEPLOYMENT_STAGE must be ${requiredStage}.`);
  if (process.env.MIGRATION_CONFIRMATION !== requiredConfirmation) refuse(`MIGRATION_CONFIRMATION must be ${requiredConfirmation}.`);
  if (process.env.BASELINE_ADOPTION_DRY_RUN === "true") {
    console.log("Baseline adoption dry run requested; no database changes will be made.");
  }
}

async function main() {
  requireGates();
  const selection = await resolveMigrationDatabase();
  if (!selection) refuse("no approved database connection was reachable.");

  const target = new URL(selection.url);
  console.log(`Target: source=${selection.source}, host=${target.hostname}, port=${target.port || "5432"}, database=${target.pathname.replace(/^\//, "")}`);
  const identities = getBaselineIdentities();
  for (const identity of identities) console.log(`Verified canonical identity: ${identity.tag}, when=${identity.when}, hash=${identity.hash}`);

  const sql = postgres(selection.url, { ssl: "require", prepare: false });
  try {
    const tables = await sql<{ table_name: string }[]>`select table_name from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE'`;
    const homepageDealsExists = tables.some((row) => row.table_name === "homepage_deals");
    const history = await sql<{ schema_name: string }[]>`select n.nspname as schema_name from pg_class c join pg_namespace n on n.oid = c.relnamespace where c.relkind = 'r' and c.relname = '__drizzle_migrations'`;

    console.log("Running read-only baseline verification before adoption...");
    const verifier = await import("./verify-migration-baseline");
    const verified = await verifier.verifyBaseline(sql);
    const gate = validateBaselineAdoptionState({
      deploymentStage: process.env.DEPLOYMENT_STAGE,
      confirmation: process.env.MIGRATION_CONFIRMATION,
      baselineVerified: verified,
      homepageDealsExists,
      migrationHistoryExists: history.length > 0,
    });
    if (!gate.ok) refuse(gate.errors.join(" "));

    console.log("Planned changes: create drizzle.__drizzle_migrations and record canonical identities for 0000, 0001, 0002, and 0003.");
    console.log("No 0000-0003 SQL will be executed. No application tables or product data will be modified.");
    if (process.env.BASELINE_ADOPTION_DRY_RUN === "true") return;

    await sql.begin(async (transaction) => {
      await transaction.unsafe('CREATE SCHEMA IF NOT EXISTS "drizzle"');
      await transaction.unsafe('CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" ("id" serial PRIMARY KEY, "hash" text NOT NULL, "created_at" bigint)');
      for (const identity of identities) {
        await transaction`insert into "drizzle"."__drizzle_migrations" ("hash", "created_at") values (${identity.hash}, ${identity.when})`;
        console.log(`Adopted ${identity.tag}`);
      }
    });
    console.log("Baseline adoption complete. 0004 is the next unapplied migration.");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    refuse(message.replace(/postgres(?:ql)?:\/\/[^\s]+/gi, "[redacted connection]"));
  } finally {
    await sql.end();
  }
}

void main();
