import { NextRequest, NextResponse } from 'next/server';
import { verifySessionValue } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = verifySessionValue(req.cookies.get('pms_admin')?.value);
  if (!user) return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({ authenticated: true, username: user });
}
