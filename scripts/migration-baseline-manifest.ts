import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export const canonicalMigrations = [
  { tag: "0000_swift_pretty_boy", when: 1787256110509 },
  { tag: "0001_add_category_image", when: 1787256110510 },
  { tag: "0002_unique_category_translation_locale", when: 1787256110511 },
  { tag: "0003_homepage_brands", when: 1787256110512 },
  { tag: "0004_homepage_deals", when: 1787256110513 },
] as const;

export const baselineMigrations = canonicalMigrations.slice(0, 4);

export function getMigrationIdentity(tag: string) {
  const migration = canonicalMigrations.find((candidate) => candidate.tag === tag);
  if (!migration) throw new Error(`Unknown migration tag: ${tag}`);

  const sql = readFileSync(resolve(process.cwd(), "src/db/migrations", `${tag}.sql`));
  return {
    ...migration,
    hash: createHash("sha256").update(sql).digest("hex"),
  };
}

export function getBaselineIdentities() {
  return baselineMigrations.map((migration) => getMigrationIdentity(migration.tag));
}
