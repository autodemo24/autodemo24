import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'node:crypto';
import { getSession } from '../../../../../lib/session';
import { buildAuthorizeUrl } from '../../../../../lib/ebay/oauth';

const STATE_COOKIE = 'ebay_oauth_state';
const STATE_MAX_AGE = 600;

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const state = crypto.randomBytes(16).toString('hex');
  const url = buildAuthorizeUrl(state);

  const jar = await cookies();
  jar.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: STATE_MAX_AGE,
  });

  return NextResponse.redirect(url);
}
