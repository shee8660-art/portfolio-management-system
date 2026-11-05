import { Pool } from 'pg';

// Lazy pool: created only on first use, never at import time, so
// `next build` succeeds with no DATABASE_URL set.
let pool: Pool | null = null;

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getPool(): Pool | null {
  if (!process.env.DATABASE_URL) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Supabase Transaction pooler (port 6543) works best with a small pool.
      max: 5,
      ssl: { rejectUnauthorized: false },
    });
    pool.on('error', (err) => console.error('pg pool error', err));
  }
  return pool;
}

export async function query<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const p = getPool();
  if (!p) return [];
  const res = await p.query(text, params as never[]);
  return res.rows as T[];
}
