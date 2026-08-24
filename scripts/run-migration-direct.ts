import { readFileSync } from 'node:fs';
import { config } from 'dotenv';
import postgres from 'postgres';
import { resolveMigrationDatabase } from './migration-db';

config({ path: process.env.DOTENV_CONFIG_PATH ?? '.env.local' });

const sqlText = readFileSync('src/db/migrations/0001_add_category_image.sql', 'utf8');

async function main() {
  const sel = await resolveMigrationDatabase();
  if (!sel) {
    console.error('No reachable database found for migrations. Aborting.');
    process.exit(1);
  }

  const connString = sel.url;
  const sql = postgres(connString, { ssl: false });
  try {
    console.log('Running migration SQL...');
    await sql.begin(async (tx) => {
      await tx.unsafe(sqlText);
    });
    console.log('Migration applied');
    process.exit(0);
  } catch (e: any) {
    console.error('Migration failed:', e.message ?? e);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

void main();
