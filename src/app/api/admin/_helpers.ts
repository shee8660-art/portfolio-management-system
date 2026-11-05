import { NextRequest, NextResponse } from 'next/server';
import { verifySessionValue } from '@/lib/auth';

export function requireAdmin(req: NextRequest): string | null {
  return verifySessionValue(req.cookies.get('pms_admin')?.value);
}

export function unauthorized() {
  return NextResponse.json({ error: 'Not authenticated. Log in at /admin/login.' }, { status: 401 });
}
