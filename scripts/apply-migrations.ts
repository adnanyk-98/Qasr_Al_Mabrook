import { config } from 'dotenv';
import { spawnSync } from 'node:child_process';
import { resolveMigrationDatabase } from './migration-db';

config({ path: process.env.DOTENV_CONFIG_PATH ?? '.env.local' });

const stage = process.env.DEPLOYMENT_STAGE;
const confirmation = process.env.MIGRATION_CONFIRMATION;

if (!stage || !['staging', 'production'].includes(stage)) {
  console.error('Refusing migration: DEPLOYMENT_STAGE must be staging or production.');
  process.exit(1);
}

if (confirmation !== 'APPLY_MIGRATIONS') {
  console.error('Refusing migration: set MIGRATION_CONFIRMATION=APPLY_MIGRATIONS explicitly.');
  process.exit(1);
}

(async () => {
  const sel = await resolveMigrationDatabase();
  if (!sel) {
    console.error('No reachable database found for migrations. Aborting.');
    process.exit(1);
  }

  // spawn drizzle-kit migrate with the chosen DB URL available as DIRECT_DATABASE_URL
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
