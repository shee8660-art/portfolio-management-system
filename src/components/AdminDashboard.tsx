'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Profile } from '@/lib/types';

export default function AdminDashboard() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    const res = await fetch('/api/profiles');
    if (res.status === 401) {
      router.push('/admin/login');
      return;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Could not load profiles.');
      setLoading(false);
      return;
    }
    setProfiles(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch('/api/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, slug: slug || undefined, title }),
    });
    if (res.ok) {
      const created = await res.json();
      setName('');
      setSlug('');
      setTitle('');
      router.push(`/admin/edit/${created.id}`);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Could not create the page.');
    }
    setBusy(false);
  }

  async function duplicate(id: string) {
    setBusy(true);
    const res = await fetch(`/api/profiles/${id}/duplicate`, { method: 'POST' });
    if (res.ok) await load();
    else setError('Could not duplicate the page.');
    setBusy(false);
  }

  async function remove(id: string, label: string) {
    if (!confirm(`Delete the landing page for "${label}"? This cannot be undone.`)) return;
    setBusy(true);
    const res = await fetch(`/api/profiles/${id}`, { method: 'DELETE' });
    if (res.ok) await load();
    else setError('Could not delete the page.');
    setBusy(false);
  }

  async function togglePublish(p: Profile) {
    setBusy(true);
    const res = await fetch(`/api/profiles/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...p, is_published: !p.is_published }),
    });
    if (res.ok) await load();
    else setError('Could not update the page.');
    setBusy(false);
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Admin Dashboard</h1>
        <button className="btn secondary" onClick={logout}>Log out</button>
      </div>

      {error && <div className="error">{error}</div>}

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Create a new landing page</h2>
        <form onSubmit={create}>
          <div className="field-row">
            <div>
              <label htmlFor="new-name">Name *</label>
              <input id="new-name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Maria Santos" />
            </div>
            <div>
              <label htmlFor="new-slug">URL slug (optional — auto-generated from the name)</label>
              <input id="new-slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. maria-santos" />
            </div>
          </div>
          <label htmlFor="new-title">Title / role</label>
          <input id="new-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Graphic Designer" />
          <button className="btn" type="submit" disabled={busy || !name.trim()}>
            {busy ? 'Working…' : 'Create page'}
          </button>
        </form>
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>All landing pages ({profiles.length})</h2>
        {loading ? (
          <p className="muted">Loading…</p>
        ) : profiles.length === 0 ? (
          <p className="muted">No pages yet — create the first one above.</p>
        ) : (
          <table className="admin">
            <thead>
              <tr>
                <th>Name</th>
                <th>URL</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.name}</strong>
                    <br />
                    <span className="muted">{p.title}</span>
                  </td>
                  <td>
                    <Link href={`/${p.slug}`} target="_blank">/{p.slug}</Link>
                  </td>
                  <td>{p.is_published ? 'Published' : 'Hidden'}</td>
                  <td>
                    <div className="row">
                      <Link className="btn small" href={`/admin/edit/${p.id}`}>Edit</Link>
                      <button className="btn small secondary" onClick={() => togglePublish(p)} disabled={busy}>
                        {p.is_published ? 'Unpublish' : 'Publish'}
                      </button>
                      <button className="btn small secondary" onClick={() => duplicate(p.id)} disabled={busy}>Duplicate</button>
                      <button className="btn small danger" onClick={() => remove(p.id, p.name)} disabled={busy}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <p className="muted">
        Security reminder: change the default admin password (<code>admin</code> / <code>admin123</code>)
        in Vercel → Settings → Environment Variables → <code>ADMIN_PASSWORD</code>, then redeploy.
      </p>
    </div>
  );
}
