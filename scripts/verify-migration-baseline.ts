import { config } from "dotenv";
import postgres from "postgres";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve } from "node:path";

import { resolveMigrationDatabase } from "./migration-db";

config({ path: process.env.DOTENV_CONFIG_PATH ?? ".env.local" });

const baselineTables = [
  "admin_sessions",
  "admin_users",
  "attribute_translations",
  "attribute_value_translations",
  "attribute_values",
  "attributes",
  "brand_translations",
  "brands",
  "categories",
  "category_attributes",
  "category_translations",
  "product_attribute_values",
  "product_categories",
  "product_images",
  "product_specifications",
  "product_translations",
  "products",
  "quote_request_items",
  "quote_requests",
  "specification_definitions",
  "specification_translations",
  "variant_combination_values",
  "variant_combinations",
  "variant_definitions",
  "variant_images",
  "variant_specifications",
  "homepage_sections",
  "static_page_translations",
  "static_pages",
  "quote_request_notifications",
  "site_settings",
] as const;

const baselineEnums = {
  admin_role: ["SUPER_ADMIN", "ADMIN"],
  admin_status: ["ACTIVE", "DISABLED"],
  attribute_data_type: ["TEXT", "NUMBER", "BOOLEAN", "SELECT", "MULTI_SELECT", "COLOR"],
  entity_status: ["DRAFT", "PUBLISHED", "ARCHIVED"],
  locale: ["en", "ar"],
  quote_source: ["PRODUCT", "CONTACT"],
  quote_status: ["NEW", "IN_PROGRESS", "RESPONDED", "CLOSED", "SPAM"],
  specification_data_type: ["TEXT", "NUMBER", "BOOLEAN"],
} as const;

type TableRow = { table_name: string };
type EnumRow = { type_name: string; enum_label: string };
type ColumnRow = { table_name: string; column_name: string; data_type: string };
type IndexRow = { indexname: string };
type MigrationTableRow = { schema_name: string };

function safeErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/postgres(?:ql)?:\/\/[^\s]+/gi, "[redacted connection]");
}

function reportCheck(label: string, passed: boolean, detail: string) {
  console.log(`${passed ? "PASS" : "FAIL"} ${label}${detail ? `: ${detail}` : ""}`);
  return passed;
}

export async function verifyBaseline(sql: ReturnType<typeof postgres>) {
  try {
    const tableRows = await sql<TableRow[]>`select table_name from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE'`;
    const tables = new Set(tableRows.map((row) => row.table_name));
    const missingTables = baselineTables.filter((table) => !tables.has(table));
    const checks = [reportCheck("0000 baseline tables", missingTables.length === 0, missingTables.length ? `missing ${missingTables.join(", ")}` : `${baselineTables.length} tables present`)];

    const enumRows = await sql<EnumRow[]>`select t.typname as type_name, e.enumlabel as enum_label from pg_type t join pg_namespace n on n.oid = t.typnamespace join pg_enum e on e.enumtypid = t.oid where n.nspname = 'public' and t.typname in ('admin_role', 'admin_status', 'attribute_data_type', 'entity_status', 'locale', 'quote_source', 'quote_status', 'specification_data_type') order by t.typname, e.enumsortorder`;
    const enumValues = new Map<string, string[]>();
    for (const row of enumRows) enumValues.set(row.type_name, [...(enumValues.get(row.type_name) ?? []), row.enum_label]);
    const missingEnums = Object.entries(baselineEnums).filter(([name, expected]) => JSON.stringify(enumValues.get(name) ?? []) !== JSON.stringify(expected)).map(([name]) => name);
    checks.push(reportCheck("0000 baseline enums", missingEnums.length === 0, missingEnums.length ? `missing or mismatched ${missingEnums.join(", ")}` : `${Object.keys(baselineEnums).length} enums match`));

    const columns = await sql<ColumnRow[]>`select table_name, column_name, data_type from information_schema.columns where table_schema = 'public' and ((table_name = 'categories' and column_name in ('image_object_key', 'image_public_url', 'image_width', 'image_height')) or (table_name = 'brands' and column_name in ('name', 'logo_url', 'sort_order', 'enabled'))) order by table_name, column_name`;
    const columnMap = new Map(columns.map((column) => [`${column.table_name}.${column.column_name}`, column.data_type]));
    const expectedColumns = [
      ["categories.image_object_key", "text"],
      ["categories.image_public_url", "text"],
      ["categories.image_width", "integer"],
      ["categories.image_height", "integer"],
      ["brands.name", "character varying"],
      ["brands.logo_url", "text"],
      ["brands.sort_order", "integer"],
      ["brands.enabled", "boolean"],
    ] as const;
    const missingColumns = expectedColumns.filter(([key, type]) => columnMap.get(key) !== type).map(([key]) => key);
    checks.push(reportCheck("0001 category image columns", missingColumns.filter((key) => key.startsWith("categories.")).length === 0, missingColumns.filter((key) => key.startsWith("categories.")).join(", ")));
    checks.push(reportCheck("0003 brand columns", missingColumns.filter((key) => key.startsWith("brands.")).length === 0, missingColumns.filter((key) => key.startsWith("brands.")).join(", ")));

    const indexes = await sql<IndexRow[]>`select indexname from pg_indexes where schemaname = 'public'`;
    const indexNames = new Set(indexes.map((index) => index.indexname));
    checks.push(reportCheck("0002 category translation unique index", indexNames.has("category_translations_category_locale_unique"), "category_translations_category_locale_unique"));
    checks.push(reportCheck("homepage_deals absent", !tables.has("homepage_deals"), tables.has("homepage_deals") ? "unexpected table exists" : "ready for future migration"));

    const migrationTables = await sql<MigrationTableRow[]>`select n.nspname as schema_name from pg_class c join pg_namespace n on n.oid = c.relnamespace where c.relkind = 'r' and c.relname = '__drizzle_migrations'`;
    checks.push(reportCheck("migration history absent for baseline adoption", migrationTables.length === 0, migrationTables.length ? `found in ${migrationTables.map((row) => row.schema_name).join(", ")}` : "no history table found"));

    const qualifies = checks.every(Boolean);
    console.log(`Baseline adoption qualification: ${qualifies ? "PASS" : "FAIL"}`);
    console.log("This utility performed read-only catalog queries only.");
    return qualifies;
  } catch (error) {
    console.error(`FAIL verification: ${safeErrorMessage(error)}`);
    return false;
  }
}

async function main() {
  const selection = await resolveMigrationDatabase();
  if (!selection) {
    console.error("FAIL connection: no approved database connection was reachable.");
    process.exitCode = 1;
    return;
  }

  const target = new URL(selection.url);
  console.log(`Target: source=${selection.source}, host=${target.hostname}, port=${target.port || "5432"}, database=${target.pathname.replace(/^\//, "")}`);
  const sql = postgres(selection.url, { ssl: "require", prepare: false });
  try {
    process.exitCode = (await verifyBaseline(sql)) ? 0 : 1;
  } finally {
    await sql.end();
  }
}

const entryPoint = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (entryPoint === import.meta.url || fileURLToPath(import.meta.url) === resolve(process.argv[1] ?? "")) void main();
