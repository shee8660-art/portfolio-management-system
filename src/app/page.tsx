import Link from 'next/link';
import { isDbConfigured, query } from '@/lib/db';
import type { Profile } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function Home() {
  if (!isDbConfigured()) {
    return (
      <main>
        <header className="site">
          <div className="inner">
            <span className="brand">Portfolio Management System</span>
            <Link href="/admin/login">Admin login</Link>
          </div>
        </header>
        <div className="container">
          <h1>Portfolio Management System</h1>
          <div className="notice">
            <strong>Database not configured yet.</strong>
            <p>
              This app needs a PostgreSQL database before it can list portfolios.
              Set the <code>DATABASE_URL</code> environment variable (Supabase
              Transaction pooler, port 6543) and run <code>supabase/schema.sql</code>{' '}
              in the Supabase SQL Editor — see the <strong>README.md</strong> for
              the full step-by-step guide.
            </p>
            <p>
              <Link href="/admin/login">Go to the admin login →</Link>
            </p>
          </div>
        </div>
      </main>
    );
  }

  let profiles: Profile[] = [];
  let dbError = '';
  try {
    profiles = await query<Profile>(
      `select id, slug, name, title, bio, avatar_url, email, location, socials, theme, layout, is_published
       from profiles where is_published = true order by created_at asc`,
    );
  } catch (e) {
    dbError = e instanceof Error ? e.message : 'Database error';
  }

  return (
    <main>
      <header className="site">
        <div className="inner">
          <span className="brand">Portfolio Management System</span>
          <Link href="/admin/login">Admin login</Link>
        </div>
      </header>
      <div className="container">
        <h1>Portfolios</h1>
        <p className="muted">
          Public landing pages created in the admin dashboard. Pick one to view it.
        </p>
        {dbError && (
          <div className="error">
            Could not load portfolios from the database: {dbError}. Check that
            <code> DATABASE_URL</code> is correct and <code>supabase/schema.sql</code> has been run.
          </div>
        )}
        {!dbError && profiles.length === 0 && (
          <div className="card">
            <p>No published portfolios yet.</p>
            <p>
              <Link href="/admin/login">Log in as admin</Link> to create the first
              landing page — or run <code>supabase/schema.sql</code>, which seeds a
              demo profile at <code>/juan-dela-cruz</code>.
            </p>
          </div>
        )}
        <div className="grid">
          {profiles.map((p) => (
            <article key={p.id} className="card">
              {p.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.avatar_url} alt={p.name} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }} />
              ) : null}
              <h2 style={{ margin: '8px 0 4px' }}>
                <Link href={`/${p.slug}`}>{p.name}</Link>
              </h2>
              <p className="muted" style={{ margin: 0 }}>{p.title}</p>
              {p.location ? <p className="muted" style={{ margin: '4px 0 0' }}>{p.location}</p> : null}
              <p style={{ marginTop: 12 }}>
                <Link className="btn small" href={`/${p.slug}`}>View portfolio →</Link>
              </p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
