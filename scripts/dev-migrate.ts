import { config } from 'dotenv';
import { spawnSync } from 'node:child_process';
import { resolveMigrationDatabase } from './migration-db';

config({ path: process.env.DOTENV_CONFIG_PATH ?? '.env.local' });

function ensureExplicitMigrationIntent() {
  const stage = (process.env.DEPLOYMENT_STAGE ?? '').toLowerCase();
  const confirmation = process.env.MIGRATION_CONFIRMATION ?? '';

  if (stage && !['development', 'local', 'staging', 'production'].includes(stage)) {
    console.error('Refusing migration: DEPLOYMENT_STAGE must be local, development, staging, or production.');
    process.exit(1);
  }

  if ((stage === 'staging' || stage === 'production') && !['APPLY_MIGRATIONS', 'ADOPT_BASELINE_0003'].includes(confirmation)) {
    console.error('Refusing migration: set MIGRATION_CONFIRMATION=APPLY_MIGRATIONS or MIGRATION_CONFIRMATION=ADOPT_BASELINE_0003 explicitly.');
    process.exit(1);
  }
}

(async () => {
  ensureExplicitMigrationIntent();

  const sel = await resolveMigrationDatabase();
  if (!sel) {
    console.error('No approved database target found for migrations. Aborting.');
    process.exit(1);
  }

  console.log(`Applying migrations to ${sel.source}...`);

  const env = { ...process.env, DIRECT_DATABASE_URL: sel.url };
  const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const args = ['drizzle-kit', 'migrate'];
  const result = spawnSync(command, args, { stdio: 'inherit', env, shell: process.platform === 'win32' });
  if (result.status !== 0) {
    console.error('Migration command:', [command, ...args].join(' '));
    console.error('Migration exit status:', result.status);
    console.error('Migration signal:', result.signal ?? 'none');
    if (result.error) console.error('Migration spawn error:', result.error.message);
  }
  process.exit(result.status ?? 1);
})();
