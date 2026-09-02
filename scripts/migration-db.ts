import { config } from 'dotenv';
import postgres from 'postgres';

config({ path: process.env.DOTENV_CONFIG_PATH ?? '.env.local' });

type MigrationTarget = 'DIRECT_DATABASE_URL' | 'DATABASE_URL';
type Selection = { url: string; source: MigrationTarget; host: string; port: number } | null;

const localDevelopmentHosts = new Set(['localhost', '127.0.0.1', '::1']);
const approvedMigrationConfirmations = new Set(['APPLY_MIGRATIONS', 'ADOPT_BASELINE_0003']);

export function parseHostPort(connString: string) {
  try {
    const u = new URL(connString);
    return { host: u.hostname, port: Number(u.port || 5432) };
  } catch {
    return { host: 'unknown', port: 0 };
  }
}

export function isLocalDevelopmentHost(hostname: string) {
  const normalized = hostname.toLowerCase();
  return localDevelopmentHosts.has(normalized) || normalized.endsWith('.local') || normalized.endsWith('.localhost');
}

export function evaluateMigrationTarget(
  source: MigrationTarget,
  connString: string | undefined,
  options: {
    deploymentStage?: string;
    migrationConfirmation?: string;
    allowFallback?: boolean;
  } = {},
) {
  if (!connString) {
    return { ok: false, reason: `${source} is not configured.` } as const;
  }

  const { host } = parseHostPort(connString);
  const stage = (options.deploymentStage ?? '').toLowerCase();
  const confirmation = options.migrationConfirmation ?? '';
  const confirmationApproved = approvedMigrationConfirmations.has(String(confirmation));
  const localHost = isLocalDevelopmentHost(host);

  if (source === 'DATABASE_URL' && options.allowFallback !== true) {
    return { ok: false, reason: 'DATABASE_URL fallback is disabled unless MIGRATION_ALLOW_DATABASE_URL_FALLBACK=true.' } as const;
  }

  if (!localHost && !confirmationApproved) {
    return {
      ok: false,
      reason: `${source} points to a non-local target and requires an explicit migration approval value.`,
    } as const;
  }

  if ((stage === 'staging' || stage === 'production') && !confirmationApproved) {
    return {
      ok: false,
      reason: `DEPLOYMENT_STAGE=${stage} requires MIGRATION_CONFIRMATION to be explicitly set.`,
    } as const;
  }

  return { ok: true } as const;
}

async function tryConnect(url: string, timeoutMs = 5000) {
  let sql: ReturnType<typeof postgres> | undefined;
  try {
    sql = postgres(url, { ssl: 'require' });
    const p = sql`select 1 as ok`;
    await Promise.race([
      p,
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
    ]);
    await sql.end();
    return true;
  } catch {
    try {
      if (sql) await sql.end();
    } catch {
      // ignore close failures while diagnosing connectivity
    }
    return false;
  }
}

export async function resolveMigrationDatabase(): Promise<Selection> {
  const direct = process.env.DIRECT_DATABASE_URL;
  const pooler = process.env.DATABASE_URL;
  const deploymentStage = process.env.DEPLOYMENT_STAGE;
  const migrationConfirmation = process.env.MIGRATION_CONFIRMATION;
  const allowFallback = String(process.env.MIGRATION_ALLOW_DATABASE_URL_FALLBACK ?? '').toLowerCase() === 'true';

  if (direct) {
    const directCheck = evaluateMigrationTarget('DIRECT_DATABASE_URL', direct, {
      deploymentStage,
      migrationConfirmation,
      allowFallback,
    });
    if (!directCheck.ok) {
      console.error(`Refusing migration: ${directCheck.reason}`);
      return null;
    }

    const { host, port } = parseHostPort(direct);
    console.log('Database connection: source=DIRECT_DATABASE_URL, host=' + host + ', port=' + port);
    const ok = await tryConnect(direct);
    if (ok) return { url: direct, source: 'DIRECT_DATABASE_URL', host, port };
    console.error('DIRECT_DATABASE_URL unreachable from this process.');
  }

  if (pooler) {
    const poolerCheck = evaluateMigrationTarget('DATABASE_URL', pooler, {
      deploymentStage,
      migrationConfirmation,
      allowFallback,
    });
    if (!poolerCheck.ok) {
      console.error(`Refusing migration fallback: ${poolerCheck.reason}`);
      return null;
    }

    const { host, port } = parseHostPort(pooler);
    console.log('Database connection: source=DATABASE_URL, host=' + host + ', port=' + port);
    const ok = await tryConnect(pooler);
    if (ok) return { url: pooler, source: 'DATABASE_URL', host, port };
    console.error('DATABASE_URL fallback is unreachable from this process.');
  }

  return null;
}
