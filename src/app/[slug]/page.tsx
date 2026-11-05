import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isDbConfigured, query } from '@/lib/db';
import type { CustomSection, GalleryItem, Profile, Skill } from '@/lib/types';
import ContactForm from '@/components/ContactForm';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function loadProfile(slug: string): Promise<Profile | null> {
  const rows = await query<Profile>(
    `select * from profiles where slug = $1 and is_published = true limit 1`,
    [slug],
  );
  if (!rows[0]) return null;
  const profile = rows[0];
  profile.skills = await query<Skill>(
    `select id, name, level, category, sort_order from skills where profile_id = $1 order by sort_order asc, name asc`,
    [profile.id],
  );
  profile.gallery = await query<GalleryItem>(
    `select id, title, description, image_url, sort_order from gallery_items where profile_id = $1 order by sort_order asc`,
    [profile.id],
  );
  profile.sections = await query<CustomSection>(
    `select id, type, title, content, sort_order, visible from custom_sections where profile_id = $1 and visible = true order by sort_order asc`,
    [profile.id],
  );
  return profile;
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { slug } = await params;

  if (!isDbConfigured()) {
    return (
      <main className="container">
        <h1>Database not configured</h1>
        <p className="muted">
          Set <code>DATABASE_URL</code> and run <code>supabase/schema.sql</code> — see README.md.
        </p>
        <p><Link href="/">← Back to home</Link></p>
      </main>
    );
  }

  let profile: Profile | null = null;
  try {
    profile = await loadProfile(slug);
  } catch {
    profile = null;
  }
  if (!profile) notFound();

  const theme = profile.theme || {};
  const primary = theme.primary || '#2563eb';
  const accent = theme.accent || '#f59e0b';
  const fontFamily =
    theme.font === 'serif'
      ? 'Georgia, "Times New Roman", serif'
      : theme.font === 'mono'
        ? 'ui-monospace, SFMono-Regular, Menlo, monospace'
        : 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  const dark = theme.mode === 'dark';
  const layout = profile.layout || 'modern';
  const socials = profile.socials || {};

  const pageStyle: React.CSSProperties = {
    // CSS variables consumed by globals.css
    ['--primary' as string]: primary,
    ['--accent' as string]: accent,
    fontFamily,
    background: dark ? '#0f172a' : undefined,
    color: dark ? '#f1f5f9' : undefined,
    minHeight: '100vh',
  };

  return (
    <main style={pageStyle} data-layout={layout}>
      <header className="site" style={dark ? { background: '#1e293b', borderColor: '#334155' } : undefined}>
        <div className="inner">
          <Link href="/" className="brand" style={{ color: dark ? '#f1f5f9' : undefined }}>
            ← All portfolios
          </Link>
          <span className="muted">{profile.name}</span>
        </div>
      </header>

      {/* Profile */}
      <div className="profile-hero">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="avatar" src={profile.avatar_url} alt={profile.name} />
        ) : null}
        <h1>{profile.name}</h1>
        {profile.title ? <p className="title">{profile.title}</p> : null}
        {profile.location ? <p className="muted">{profile.location}</p> : null}
        {profile.email ? (
          <p><a href={`mailto:${profile.email}`}>{profile.email}</a></p>
        ) : null}
        <div className="socials">
          {Object.entries(socials)
            .filter(([, v]) => v)
            .map(([key, value]) => (
              <a key={key} href={value as string} target="_blank" rel="noreferrer">
                {key}
              </a>
            ))}
        </div>
      </div>

      {/* About Me */}
      {profile.bio ? (
        <section className="block">
          <h2>About Me</h2>
          <p style={{ whiteSpace: 'pre-wrap' }}>{profile.bio}</p>
        </section>
      ) : null}

      {/* Skills */}
      {profile.skills && profile.skills.length > 0 ? (
        <section className="block">
          <h2>Skills</h2>
          {profile.skills.map((s) => (
            <div key={s.id || s.name} className="skill-row">
              <div className="skill-head">
                <span>{s.name}{s.category ? ` · ${s.category}` : ''}</span>
                <span>{s.level}%</span>
              </div>
              <div className="skill-bar">
                <div style={{ width: `${Math.max(0, Math.min(100, s.level))}%` }} />
              </div>
            </div>
          ))}
        </section>
      ) : null}

      {/* Gallery / Portfolio */}
      {profile.gallery && profile.gallery.length > 0 ? (
        <section className="block">
          <h2>Portfolio</h2>
          <div className="gallery-grid">
            {profile.gallery.map((g) => (
              <figure key={g.id || g.title}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.image_url} alt={g.title} loading="lazy" />
                <figcaption>
                  <strong>{g.title}</strong>
                  {g.description ? <p>{g.description}</p> : null}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      {/* Custom sections */}
      {(profile.sections || []).map((sec) => {
        const items = sec.content?.items || [];
        if (sec.type === 'testimonials') {
          return (
            <section key={sec.id} className="block">
              <h2>{sec.title}</h2>
              {items.map((it, i) => (
                <blockquote key={i} className="testimonial">
                  <p>“{String(it.quote || it.title || '')}”</p>
                  {it.author ? <footer>— {String(it.author)}</footer> : null}
                </blockquote>
              ))}
              {sec.content?.text ? <p>{String(sec.content.text)}</p> : null}
            </section>
          );
        }
        if (sec.type === 'services') {
          return (
            <section key={sec.id} className="block">
              <h2>{sec.title}</h2>
              <div className="service-list">
                {items.map((it, i) => (
                  <div key={i} className="card">
                    <strong>{String(it.title || '')}</strong>
                    {it.description ? <p className="muted">{String(it.description)}</p> : null}
                  </div>
                ))}
              </div>
              {sec.content?.text ? <p>{String(sec.content.text)}</p> : null}
            </section>
          );
        }
        // Generic custom section
        return (
          <section key={sec.id} className="block">
            <h2>{sec.title}</h2>
            {sec.content?.text ? <p style={{ whiteSpace: 'pre-wrap' }}>{String(sec.content.text)}</p> : null}
            {items.map((it, i) => (
              <p key={i}>
                <strong>{String(it.title || '')}</strong>
                {it.description ? <> — {String(it.description)}</> : null}
                {it.quote ? <>“{String(it.quote)}”</> : null}
                {it.author ? <> — {String(it.author)}</> : null}
              </p>
            ))}
          </section>
        );
      })}

      {/* Contact form */}
      <section className="block">
        <h2>Contact {profile.name.split(' ')[0]}</h2>
        <ContactForm profileId={profile.id} profileName={profile.name} />
      </section>

      <footer style={{ textAlign: 'center', padding: '24px', color: 'var(--muted)' }}>
        <small>
          Portfolio Management System · <Link href="/admin/login">Admin</Link>
        </small>
      </footer>
    </main>
  );
}
