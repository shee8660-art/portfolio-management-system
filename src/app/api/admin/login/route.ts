import { NextRequest, NextResponse } from 'next/server';
import { createSessionValue, getAdminUsername, sessionMaxAge, verifyAdminCredentials, SESSION_COOKIE } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const username = String(body.username || '');
  const password = String(body.password || '');
  if (!(await verifyAdminCredentials(username, password))) {
    return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true, username: getAdminUsername() });
  res.cookies.set(SESSION_COOKIE, createSessionValue(getAdminUsername()), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: sessionMaxAge(),
  });
  return res;
}
