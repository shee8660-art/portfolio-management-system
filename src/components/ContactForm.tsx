'use client';

import { useState } from 'react';

export default function ContactForm({ profileId, profileName }: { profileId: string; profileName: string }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setError('');
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile_id: profileId, name, email, message }),
    });
    if (res.ok) {
      setStatus('sent');
      setName('');
      setEmail('');
      setMessage('');
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Could not send your message.');
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return <p className="success">Thanks! Your message to {profileName} has been sent.</p>;
  }

  return (
    <form onSubmit={submit}>
      {status === 'error' && <div className="error">{error}</div>}
      <label htmlFor="c-name">Your name</label>
      <input id="c-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} />
      <label htmlFor="c-email">Your email</label>
      <input id="c-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={200} />
      <label htmlFor="c-message">Message</label>
      <textarea id="c-message" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} required maxLength={5000} />
      <button className="btn" type="submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
}
