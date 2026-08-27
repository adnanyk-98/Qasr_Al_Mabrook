import { config } from 'dotenv';
import postgres from 'postgres';

config({ path: process.env.DOTENV_CONFIG_PATH ?? '.env.local' });

type Selection = { url: string; source: 'DIRECT_DATABASE_URL' | 'DATABASE_URL' } | null;

function parseHostPort(connString: string) {
  try {
    const u = new URL(connString);
    return { host: u.hostname, port: Number(u.port || 5432) };
  } catch (e) {
    return { host: 'unknown', port: 0 };
  }
}

async function tryConnect(url: string, timeoutMs = 5000) {
  let sql: any;
  try {
    sql = postgres(url, { ssl: 'require' });
    const p = sql`select 1 as ok`;
    const res = await Promise.race([
      p,
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), timeoutMs)),
    ]);
    await sql.end();
    return true;
  } catch (e: any) {
    try {
      if (sql) await sql.end();
    } catch {}
    return false;
  }
}

export async function resolveMigrationDatabase(): Promise<Selection> {
  const direct = process.env.DIRECT_DATABASE_URL;
  const pooler = process.env.DATABASE_URL;
  const allowFallback = String(process.env.MIGRATION_ALLOW_DATABASE_URL_FALLBACK ?? '').toLowerCase() === 'true';

  if (direct) {
    const { host, port } = parseHostPort(direct);
    console.log('Database connection: source=DIRECT_DATABASE_URL, host=' + host + ', port=' + port);
    const ok = await tryConnect(direct).catch(() => false);
    if (ok) return { url: direct, source: 'DIRECT_DATABASE_URL' };
    console.error('DIRECT_DATABASE_URL unreachable from this process.');
  }

  if (pooler && allowFallback) {
    const { host, port } = parseHostPort(pooler);
    console.log('Falling back to DATABASE_URL for migrations.');
    console.log('Database connection: source=DATABASE_URL, host=' + host + ', port=' + port);
    const ok = await tryConnect(pooler).catch(() => false);
    if (ok) return { url: pooler, source: 'DATABASE_URL' };
    console.error('DATABASE_URL fallback is unreachable from this process.');
  }

  return null;
}
