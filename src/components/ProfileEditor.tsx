'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { CustomSection, GalleryItem, Profile, Skill } from '@/lib/types';

function emptySkill(): Skill {
  return { name: '', level: 50, category: '', sort_order: 0 };
}
function emptyGallery(): GalleryItem {
  return { title: '', description: '', image_url: '', sort_order: 0 };
}
function emptySection(): CustomSection {
  return { type: 'custom', title: '', content: { text: '' }, sort_order: 0, visible: true };
}

export default function ProfileEditor({ id }: { id: string }) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<{ name: string; email: string; message: string; created_at: string }[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/profiles/${id}`);
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (!res.ok) {
        setError('Could not load this page.');
        setLoading(false);
        return;
      }
      const data = await res.json();
      data.socials = data.socials || {};
      data.theme = data.theme || {};
      data.skills = data.skills || [];
      data.gallery = data.gallery || [];
      data.sections = data.sections || [];
      setProfile(data);
      setLoading(false);
      const m = await fetch(`/api/contact?profile_id=${id}`);
      if (m.ok) setMessages(await m.json());
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <p className="muted">Loading…</p>;
  if (!profile) return <div className="error">{error || 'Page not found.'}</div>;

  const set = <K extends keyof Profile>(key: K, value: Profile[K]) => {
    setProfile({ ...profile, [key]: value });
    setSaved('');
  };
  const setTheme = (key: string, value: string) =>
    set('theme', { ...profile.theme, [key]: value });
  const setSocial = (key: string, value: string) =>
    set('socials', { ...profile.socials, [key]: value });

  async function save() {
    setBusy(true);
    setError('');
    setSaved('');
    const res = await fetch(`/api/profiles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    if (res.ok) {
      const data = await res.json();
      setProfile(data);
      setSaved('Saved.');
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Could not save.');
    }
    setBusy(false);
  }

  const skills = profile.skills || [];
  const gallery = profile.gallery || [];
  const sections = profile.sections || [];

  return (
    <div>
      <p><Link href="/admin">← Back to dashboard</Link> · <Link href={`/${profile.slug}`} target="_blank">View public page →</Link></p>
      {error && <div className="error">{error}</div>}
      {saved && <div className="success">{saved}</div>}

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Profile</h2>
        <div className="field-row">
          <div>
            <label htmlFor="f-name">Name *</label>
            <input id="f-name" value={profile.name} onChange={(e) => set('name', e.target.value)} />
          </div>
          <div>
            <label htmlFor="f-slug">URL slug *</label>
            <input id="f-slug" value={profile.slug} onChange={(e) => set('slug', e.target.value)} />
          </div>
        </div>
        <label htmlFor="f-title">Title / role</label>
        <input id="f-title" value={profile.title} onChange={(e) => set('title', e.target.value)} />
        <label htmlFor="f-bio">About Me (bio)</label>
        <textarea id="f-bio" rows={5} value={profile.bio} onChange={(e) => set('bio', e.target.value)} />
        <div className="field-row">
          <div>
            <label htmlFor="f-avatar">Avatar image URL</label>
            <input id="f-avatar" value={profile.avatar_url} onChange={(e) => set('avatar_url', e.target.value)} placeholder="https://…" />
          </div>
          <div>
            <label htmlFor="f-email">Email</label>
            <input id="f-email" type="email" value={profile.email} onChange={(e) => set('email', e.target.value)} />
          </div>
        </div>
        <label htmlFor="f-location">Location</label>
        <input id="f-location" value={profile.location} onChange={(e) => set('location', e.target.value)} placeholder="e.g. Manila, Philippines" />
        <label>
          <input
            type="checkbox"
            style={{ width: 'auto' }}
            checked={profile.is_published}
            onChange={(e) => set('is_published', e.target.checked)}
          />{' '}
          Published (visible on the public site)
        </label>
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Social links</h2>
        <div className="field-row">
          {['website', 'github', 'linkedin', 'twitter', 'instagram', 'facebook'].map((key) => (
            <div key={key}>
              <label htmlFor={`soc-${key}`}>{key}</label>
              <input
                id={`soc-${key}`}
                value={profile.socials[key] || ''}
                onChange={(e) => setSocial(key, e.target.value)}
                placeholder="https://…"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Design &amp; theme</h2>
        <div className="field-row">
          <div>
            <label htmlFor="th-primary">Primary colour</label>
            <input id="th-primary" type="color" value={profile.theme.primary || '#2563eb'} onChange={(e) => setTheme('primary', e.target.value)} />
          </div>
          <div>
            <label htmlFor="th-accent">Accent colour</label>
            <input id="th-accent" type="color" value={profile.theme.accent || '#f59e0b'} onChange={(e) => setTheme('accent', e.target.value)} />
          </div>
        </div>
        <div className="field-row">
          <div>
            <label htmlFor="th-font">Font</label>
            <select id="th-font" value={profile.theme.font || 'system'} onChange={(e) => setTheme('font', e.target.value)}>
              <option value="system">System (sans-serif)</option>
              <option value="serif">Serif</option>
              <option value="mono">Monospace</option>
            </select>
          </div>
          <div>
            <label htmlFor="th-mode">Theme</label>
            <select id="th-mode" value={profile.theme.mode || 'light'} onChange={(e) => setTheme('mode', e.target.value)}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>
        <label htmlFor="th-layout">Layout</label>
        <select id="th-layout" value={profile.layout} onChange={(e) => set('layout', e.target.value)}>
          <option value="modern">Modern</option>
          <option value="minimal">Minimal</option>
          <option value="bold">Bold</option>
        </select>
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Skills</h2>
        {skills.map((s, i) => (
          <div key={i} className="card" style={{ background: '#f8fafc' }}>
            <div className="field-row">
              <div>
                <label>Skill name</label>
                <input value={s.name} onChange={(e) => set('skills', skills.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
              </div>
              <div>
                <label>Level (0–100): {s.level}</label>
                <input type="range" min={0} max={100} value={s.level} onChange={(e) => set('skills', skills.map((x, j) => (j === i ? { ...x, level: Number(e.target.value) } : x)))} />
              </div>
            </div>
            <div className="field-row">
              <div>
                <label>Category</label>
                <input value={s.category || ''} onChange={(e) => set('skills', skills.map((x, j) => (j === i ? { ...x, category: e.target.value } : x)))} />
              </div>
              <div>
                <label>Order</label>
                <input type="number" value={s.sort_order ?? i} onChange={(e) => set('skills', skills.map((x, j) => (j === i ? { ...x, sort_order: Number(e.target.value) } : x)))} />
              </div>
            </div>
            <button className="btn small danger" onClick={() => set('skills', skills.filter((_, j) => j !== i))}>Remove skill</button>
          </div>
        ))}
        <button className="btn secondary" onClick={() => set('skills', [...skills, { ...emptySkill(), sort_order: skills.length }])}>+ Add skill</button>
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Gallery / Portfolio</h2>
        {gallery.map((g, i) => (
          <div key={i} className="card" style={{ background: '#f8fafc' }}>
            <label>Title</label>
            <input value={g.title} onChange={(e) => set('gallery', gallery.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
            <label>Image URL</label>
            <input value={g.image_url} onChange={(e) => set('gallery', gallery.map((x, j) => (j === i ? { ...x, image_url: e.target.value } : x)))} placeholder="https://…" />
            <label>Description</label>
            <input value={g.description || ''} onChange={(e) => set('gallery', gallery.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))} />
            <div className="row">
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                Order
                <input type="number" style={{ width: 80, margin: 0 }} value={g.sort_order ?? i} onChange={(e) => set('gallery', gallery.map((x, j) => (j === i ? { ...x, sort_order: Number(e.target.value) } : x)))} />
              </label>
              <button className="btn small danger" onClick={() => set('gallery', gallery.filter((_, j) => j !== i))}>Remove item</button>
            </div>
          </div>
        ))}
        <button className="btn secondary" onClick={() => set('gallery', [...gallery, { ...emptyGallery(), sort_order: gallery.length }])}>+ Add gallery item</button>
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Custom sections</h2>
        <p className="muted">
          Services and testimonials are lists of items (one per line, as JSON or simple text below).
          For Services use lines like <code>Title — description</code>; for Testimonials use{' '}
          <code>“quote” — Author</code>. Or paste JSON: <code>{`{"items":[{"title":"…","description":"…"}]}`}</code>
        </p>
        {sections.map((sec, i) => (
          <div key={i} className="card" style={{ background: '#f8fafc' }}>
            <div className="field-row">
              <div>
                <label>Type</label>
                <select value={sec.type} onChange={(e) => set('sections', sections.map((x, j) => (j === i ? { ...x, type: e.target.value } : x)))}>
                  <option value="services">Services</option>
                  <option value="testimonials">Testimonials</option>
                  <option value="custom">Custom</option>
                  <option value="contact">Contact</option>
                </select>
              </div>
              <div>
                <label>Heading</label>
                <input value={sec.title} onChange={(e) => set('sections', sections.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
              </div>
            </div>
            <label>Content (text, or JSON with an “items” list)</label>
            <textarea
              rows={4}
              value={typeof sec.content === 'string' ? sec.content : JSON.stringify(sec.content || {}, null, 2)}
              onChange={(e) => {
                const raw = e.target.value;
                let content: CustomSection['content'];
                try {
                  content = JSON.parse(raw);
                } catch {
                  content = { text: raw };
                }
                set('sections', sections.map((x, j) => (j === i ? { ...x, content } : x)));
              }}
            />
            <div className="row">
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                Order
                <input type="number" style={{ width: 80, margin: 0 }} value={sec.sort_order ?? i} onChange={(e) => set('sections', sections.map((x, j) => (j === i ? { ...x, sort_order: Number(e.target.value) } : x)))} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" style={{ width: 'auto', margin: 0 }} checked={sec.visible !== false} onChange={(e) => set('sections', sections.map((x, j) => (j === i ? { ...x, visible: e.target.checked } : x)))} />
                Visible on public page
              </label>
              <button className="btn small danger" onClick={() => set('sections', sections.filter((_, j) => j !== i))}>Remove section</button>
            </div>
          </div>
        ))}
        <button className="btn secondary" onClick={() => set('sections', [...sections, { ...emptySection(), sort_order: sections.length }])}>+ Add section</button>
      </section>

      <div className="row" style={{ marginBottom: 24 }}>
        <button className="btn" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save all changes'}</button>
        <Link className="btn secondary" href="/admin">Cancel</Link>
      </div>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Contact messages ({messages.length})</h2>
        {messages.length === 0 ? (
          <p className="muted">No messages yet for this profile.</p>
        ) : (
          messages.map((m, i) => (
            <div key={i} style={{ borderBottom: '1px solid var(--border)', padding: '8px 0' }}>
              <strong>{m.name}</strong> · <a href={`mailto:${m.email}`}>{m.email}</a>{' '}
              <span className="muted">{new Date(m.created_at).toLocaleString()}</span>
              <p style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap' }}>{m.message}</p>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
