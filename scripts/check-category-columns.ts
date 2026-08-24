import { config } from 'dotenv';
import postgres from 'postgres';
import { resolveMigrationDatabase } from './migration-db';

config({ path: process.env.DOTENV_CONFIG_PATH ?? '.env.local' });

async function main() {
  const sel = await resolveMigrationDatabase();
  if (!sel) {
    console.error('No reachable database found for checking columns.');
    process.exit(1);
  }

  const sql = postgres(sel.url, { ssl: false });
  try {
    const cols = await sql`
      select column_name from information_schema.columns
      where table_name = 'categories'
        and column_name in ('image_object_key','image_public_url','image_width','image_height')
    `;
    const found = cols.map((r: any) => r.column_name);
    console.log('Found columns:', found);
    const missing = ['image_object_key','image_public_url','image_width','image_height'].filter(c => !found.includes(c));
    if (missing.length) {
      console.log('Missing columns:', missing);
      process.exit(2);
    }
    console.log('All expected columns exist.');
    process.exit(0);
  } catch (e: any) {
    console.error('Error querying DB:', e.message ?? e);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

void main();
