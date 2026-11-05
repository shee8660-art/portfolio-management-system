import { NextRequest, NextResponse } from 'next/server';
import { getPool, isDbConfigured } from '@/lib/db';
import { requireAdmin, unauthorized } from '@/app/api/admin/_helpers';
import { loadProfileById, replaceNested } from '@/lib/profiles';
import { slugify } from '@/lib/types';

function noDb() {
  return NextResponse.json(
    { error: 'DATABASE_URL is not set. Follow the README to connect Supabase PostgreSQL.' },
    { status: 503 },
  );
}

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Ctx) {
  if (!requireAdmin(req)) return unauthorized();
  if (!isDbConfigured()) return noDb();
  const pool = getPool();
  if (!pool) return noDb();
  const { id } = await params;
  const profile = await loadProfileById(pool, id);
  if (!profile) return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
  return NextResponse.json(profile);
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  if (!requireAdmin(req)) return unauthorized();
  if (!isDbConfigured()) return noDb();
  const pool = getPool();
  if (!pool) return noDb();
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || '').trim();
  if (!name) return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
  const slug = slugify(String(body.slug || name));
  if (!slug) return NextResponse.json({ error: 'A valid slug is required.' }, { status: 400 });
  try {
    const { rows } = await pool.query(
      `update profiles set slug=$1, name=$2, title=$3, bio=$4, avatar_url=$5, email=$6,
         location=$7, socials=$8, theme=$9, layout=$10, is_published=$11, updated_at=now()
       where id=$12 returning *`,
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
        id,
      ],
    );
    if (!rows[0]) return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
    await replaceNested(pool, id, {
      skills: body.skills,
      gallery: body.gallery,
      sections: body.sections,
    });
    const profile = await loadProfileById(pool, id);
    return NextResponse.json(profile);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Update failed';
    const status = msg.includes('duplicate key') ? 409 : 500;
    return NextResponse.json(
      { error: status === 409 ? `Slug "${slug}" is already taken.` : msg },
      { status },
    );
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  if (!requireAdmin(req)) return unauthorized();
  if (!isDbConfigured()) return noDb();
  const pool = getPool();
  if (!pool) return noDb();
  const { id } = await params;
  const res = await pool.query('delete from profiles where id = $1', [id]);
  if (res.rowCount === 0) return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
