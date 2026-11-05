import bcrypt from 'bcryptjs';
import { createHmac, timingSafeEqual } from 'crypto';

export const SESSION_COOKIE = 'pms_admin';
const SESSION_MAX_AGE = 60 * 60 * 12; // 12 hours

function getSecret(): string {
  return (
    process.env.SESSION_SECRET ||
    process.env.ADMIN_PASSWORD_HASH ||
    process.env.ADMIN_PASSWORD ||
    'admin123-change-me'
  );
}

export function getAdminUsername(): string {
  return process.env.ADMIN_USERNAME || 'admin';
}

/** Verify a username/password pair against env config. */
export async function verifyAdminCredentials(
  username: string,
  password: string,
): Promise<boolean> {
  if (username !== getAdminUsername()) return false;
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (hash) {
    try {
      return await bcrypt.compare(password, hash);
    } catch {
      return false;
    }
  }
  const expected = process.env.ADMIN_PASSWORD || 'admin123';
  return password === expected;
}

function sign(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('hex');
}

/** Create the signed session cookie value for the admin user. */
export function createSessionValue(username: string): string {
  const payload = Buffer.from(
    JSON.stringify({ u: username, exp: Date.now() + SESSION_MAX_AGE * 1000 }),
  ).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

/** Validate a session cookie value; returns the username or null. */
export function verifySessionValue(value: string | undefined | null): string | null {
  if (!value) return null;
  const [payload, sig] = value.split('.');
  if (!payload || !sig) return null;
  try {
    const expected = sign(payload);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      u: string;
      exp: number;
    };
    if (!data.u || Date.now() > data.exp) return null;
    return data.u;
  } catch {
    return null;
  }
}

export function sessionMaxAge(): number {
  return SESSION_MAX_AGE;
}
