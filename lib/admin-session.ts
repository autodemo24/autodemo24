import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export type AdminPayload = { role: 'admin'; email: string };

const secretKey = process.env.SESSION_SECRET;
if (!secretKey) throw new Error('SESSION_SECRET non configurato nel .env');
const encodedKey = new TextEncoder().encode(secretKey + '_admin');

const COOKIE_NAME = 'admin_session';
const EXPIRES_IN = 24 * 60 * 60 * 1000; // 1 giorno

export async function encryptAdmin(payload: AdminPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(encodedKey);
}

export async function decryptAdmin(token: string): Promise<AdminPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodedKey, { algorithms: ['HS256'] });
    if (payload.role !== 'admin') return null;
    return payload as unknown as AdminPayload;
  } catch {
    return null;
  }
}

export async function createAdminSession(email: string): Promise<void> {
  const token = await encryptAdmin({ role: 'admin', email });
  const expiresAt = new Date(Date.now() + EXPIRES_IN);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/admin',
  });
}

export async function getAdminSession(): Promise<AdminPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return decryptAdmin(token);
}

export async function deleteAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
