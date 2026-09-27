import { config } from 'dotenv';
import postgres from 'postgres';

config({ path: '.env.local', override: true });

const url = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;
if (!url) {
  console.error('No database URL');
  process.exit(1);
}

const sql = postgres(url, { ssl: 'require' });

(async () => {
  try {
    console.log('\n=== Applying migration 0005_admin_user_permissions ===\n');
    
    // Apply the migration
    await sql`
      ALTER TABLE "public"."admin_users"
      ADD COLUMN IF NOT EXISTS "permissions" text[] NOT NULL DEFAULT '{}'::text[]
    `;
    console.log('✓ Added/verified permissions column');
    
    // Set default permissions for existing users
    await sql`
      UPDATE "public"."admin_users"
      SET "permissions" = CASE
        WHEN "role" = 'SUPER_ADMIN' THEN ARRAY['users.view', 'users.create', 'users.edit', 'users.delete', 'users.manage_access']::text[]
        WHEN "role" = 'ADMIN' THEN '{}'::text[]
        ELSE '{}'::text[]
      END
      WHERE "permissions" = '{}'::text[] OR "permissions" IS NULL
    `;
    console.log('✓ Set default permissions for existing users');
    
    console.log('\n✓ Migration applied successfully!');
    
    await sql.end();
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === '42701') {
      // Column already exists
      console.log('✓ Permissions column already exists');
    } else {
      console.error('Error:', error instanceof Error ? error.message : String(error));
      await sql.end();
      process.exit(1);
    }
  }
})();
