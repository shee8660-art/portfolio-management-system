import { NextRequest, NextResponse } from 'next/server';
import { getPool, isDbConfigured } from '@/lib/db';
import { requireAdmin, unauthorized } from '@/app/api/admin/_helpers';
import { loadProfileById } from '@/lib/profiles';

function noDb() {
  return NextResponse.json(
    { error: 'DATABASE_URL is not set. Follow the README to connect Supabase PostgreSQL.' },
    { status: 503 },
  );
}

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Ctx) {
  if (!requireAdmin(req)) return unauthorized();
  if (!isDbConfigured()) return noDb();
  const pool = getPool();
  if (!pool) return noDb();
  const { id } = await params;
  const source = await loadProfileById(pool, id);
  if (!source) return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });

  // Find a free slug: <slug>-copy, <slug>-copy-2, …
  let slug = `${source.slug}-copy`;
  let n = 2;
  while (true) {
    const { rowCount } = await pool.query('select 1 from profiles where slug = $1', [slug]);
    if (rowCount === 0) break;
    slug = `${source.slug}-copy-${n++}`;
  }

  const { rows } = await pool.query(
    `insert into profiles (slug, name, title, bio, avatar_url, email, location, socials, theme, layout, is_published)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) returning *`,
    [
      slug,
      `${source.name} (copy)`,
      source.title,
      source.bio,
      source.avatar_url,
      source.email,
      source.location,
      JSON.stringify(source.socials || {}),
      JSON.stringify(source.theme || {}),
      source.layout,
      false, // copies start unpublished so you can review before going live
    ],
  );
  const copyId = rows[0].id as string;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const s of source.skills || []) {
      await client.query(
        'insert into skills (profile_id, name, level, category, sort_order) values ($1,$2,$3,$4,$5)',
        [copyId, s.name, s.level, s.category || '', s.sort_order || 0],
      );
    }
    for (const g of source.gallery || []) {
      await client.query(
        'insert into gallery_items (profile_id, title, description, image_url, sort_order) values ($1,$2,$3,$4,$5)',
        [copyId, g.title, g.description || '', g.image_url, g.sort_order || 0],
      );
    }
    for (const s of source.sections || []) {
      await client.query(
        'insert into custom_sections (profile_id, type, title, content, sort_order, visible) values ($1,$2,$3,$4,$5,$6)',
        [copyId, s.type, s.title, JSON.stringify(s.content || {}), s.sort_order || 0, s.visible !== false],
      );
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }

  return NextResponse.json(await loadProfileById(pool, copyId), { status: 201 });
}
