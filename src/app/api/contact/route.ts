import { NextRequest, NextResponse } from 'next/server';
import { getPool, isDbConfigured } from '@/lib/db';
import { requireAdmin, unauthorized } from '@/app/api/admin/_helpers';

function noDb() {
  return NextResponse.json(
    { error: 'DATABASE_URL is not set. Follow the README to connect Supabase PostgreSQL.' },
    { status: 503 },
  );
}

export async function POST(req: NextRequest) {
  const { profile_id, name, email, message } = await req.json().catch(() => ({}));
  if (!name || !email || !message || !profile_id) {
    return NextResponse.json({ error: 'Name, email and message are required.' }, { status: 400 });
  }
  if (!isDbConfigured()) return noDb();
  const pool = getPool();
  if (!pool) return noDb();
  // Only accept messages for published profiles.
  const exists = await pool.query('select id from profiles where id = $1 and is_published = true', [profile_id]);
  if (exists.rowCount === 0) {
    return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
  }
  await pool.query(
    'insert into contact_messages (profile_id, name, email, message) values ($1, $2, $3, $4)',
    [String(profile_id), String(name).slice(0, 100), String(email).slice(0, 200), String(message).slice(0, 5000)],
  );
  return NextResponse.json({ ok: true });
}

// Admin-only: list messages for a profile (?profile_id=...)
export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return unauthorized();
  const profileId = req.nextUrl.searchParams.get('profile_id');
  if (!isDbConfigured()) return noDb();
  const pool = getPool();
  if (!pool) return noDb();
  const rows = await pool.query(
    profileId
      ? 'select * from contact_messages where profile_id = $1 order by created_at desc limit 100'
      : 'select * from contact_messages order by created_at desc limit 100',
    profileId ? [profileId] : [],
  );
  return NextResponse.json(rows.rows);
}
