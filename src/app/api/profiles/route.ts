import { NextRequest, NextResponse } from 'next/server';
import { getPool, isDbConfigured } from '@/lib/db';
import { requireAdmin, unauthorized } from '@/app/api/admin/_helpers';
import { slugify } from '@/lib/types';

function noDb() {
  return NextResponse.json(
    { error: 'DATABASE_URL is not set. Follow the README to connect Supabase PostgreSQL.' },
    { status: 503 },
  );
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return unauthorized();
  if (!isDbConfigured()) return noDb();
  const pool = getPool();
  if (!pool) return noDb();
  const { rows } = await pool.query(
    'select * from profiles order by created_at desc',
  );
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) return unauthorized();
  if (!isDbConfigured()) return noDb();
  const pool = getPool();
  if (!pool) return noDb();
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || '').trim();
  if (!name) return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
  const slug = slugify(String(body.slug || name));
  if (!slug) return NextResponse.json({ error: 'A valid slug is required.' }, { status: 400 });
  try {
    const { rows } = await pool.query(
      `insert into profiles (slug, name, title, bio, avatar_url, email, location, socials, theme, layout, is_published)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) returning *`,
      [
        slug,
        name,
        String(body.title || ''),
        String(body.bio || ''),
        String(body.avatar_url || ''),
        String(body.email || ''),
        String(body.location || ''),
        JSON.stringify(body.socials || {}),
        JSON.stringify(body.theme || {}),
        String(body.layout || 'modern'),
        body.is_published !== false,
      ],
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Create failed';
    const status = msg.includes('duplicate key') ? 409 : 500;
    return NextResponse.json(
      { error: status === 409 ? `Slug "${slug}" is already taken.` : msg },
      { status },
    );
  }
}
