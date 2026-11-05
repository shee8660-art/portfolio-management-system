import type { Pool } from 'pg';
import type { CustomSection, GalleryItem, Profile, Skill } from '@/lib/types';

export async function loadProfileById(pool: Pool, id: string): Promise<Profile | null> {
  const { rows } = await pool.query('select * from profiles where id = $1 limit 1', [id]);
  if (!rows[0]) return null;
  const profile = rows[0] as Profile;
  profile.skills = (await pool.query(
    'select id, name, level, category, sort_order from skills where profile_id = $1 order by sort_order asc',
    [id],
  )).rows as Skill[];
  profile.gallery = (await pool.query(
    'select id, title, description, image_url, sort_order from gallery_items where profile_id = $1 order by sort_order asc',
    [id],
  )).rows as GalleryItem[];
  profile.sections = (await pool.query(
    'select id, type, title, content, sort_order, visible from custom_sections where profile_id = $1 order by sort_order asc',
    [id],
  )).rows as CustomSection[];
  return profile;
}

/** Replace a profile's nested skills/gallery/sections inside one transaction. */
export async function replaceNested(
  pool: Pool,
  profileId: string,
  data: { skills?: Skill[]; gallery?: GalleryItem[]; sections?: CustomSection[] },
) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (data.skills !== undefined) {
      await client.query('delete from skills where profile_id = $1', [profileId]);
      for (const [i, s] of (data.skills || []).entries()) {
        if (!s.name) continue;
        await client.query(
          'insert into skills (profile_id, name, level, category, sort_order) values ($1,$2,$3,$4,$5)',
          [profileId, s.name, Math.max(0, Math.min(100, Number(s.level) || 0)), s.category || '', Number(s.sort_order ?? i)],
        );
      }
    }
    if (data.gallery !== undefined) {
      await client.query('delete from gallery_items where profile_id = $1', [profileId]);
      for (const [i, g] of (data.gallery || []).entries()) {
        if (!g.title || !g.image_url) continue;
        await client.query(
          'insert into gallery_items (profile_id, title, description, image_url, sort_order) values ($1,$2,$3,$4,$5)',
          [profileId, g.title, g.description || '', g.image_url, Number(g.sort_order ?? i)],
        );
      }
    }
    if (data.sections !== undefined) {
      await client.query('delete from custom_sections where profile_id = $1', [profileId]);
      for (const [i, s] of (data.sections || []).entries()) {
        if (!s.title && !s.type) continue;
        await client.query(
          'insert into custom_sections (profile_id, type, title, content, sort_order, visible) values ($1,$2,$3,$4,$5,$6)',
          [profileId, s.type || 'custom', s.title || '', JSON.stringify(s.content || {}), Number(s.sort_order ?? i), s.visible !== false],
        );
      }
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
