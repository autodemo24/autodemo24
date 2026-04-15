import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '../../../../../lib/prisma';
import { getSession } from '../../../../../lib/session';
import { exchangeCodeForTokens, fetchEbayUserId } from '../../../../../lib/ebay/oauth';
import { getEbayEnv, OAUTH_SCOPES } from '../../../../../lib/ebay/config';
import { encryptToken } from '../../../../../lib/crypto';

const STATE_COOKIE = 'ebay_oauth_state';

function appUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  return `${base.replace(/\/$/, '')}${path}`;
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.redirect(appUrl('/login'));

  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const err = url.searchParams.get('error');

  if (err || !code || !state) {
    return NextResponse.redirect(appUrl(`/dashboard/ebay?error=${encodeURIComponent(err ?? 'missing_params')}`));
  }

  const jar = await cookies();
  const savedState = jar.get(STATE_COOKIE)?.value;
  if (!savedState || savedState !== state) {
    return NextResponse.redirect(appUrl('/dashboard/ebay?error=state_mismatch'));
  }
  jar.delete(STATE_COOKIE);

  try {
    const tokens = await exchangeCodeForTokens(code);
    const ebayUserId = await fetchEbayUserId(tokens.access_token);

    const now = Date.now();
    const expiresAt = new Date(now + tokens.expires_in * 1000);
    const refreshExpiresAt = new Date(now + tokens.refresh_token_expires_in * 1000);

    await prisma.ebayConnection.upsert({
      where: { demolitoreid: session.id },
      create: {
        demolitoreid: session.id,
        environment: getEbayEnv(),
        ebayUserId,
        accessToken: encryptToken(tokens.access_token),
        refreshToken: encryptToken(tokens.refresh_token),
        expiresAt,
        refreshExpiresAt,
        scopes: OAUTH_SCOPES,
      },
      update: {
        environment: getEbayEnv(),
        ebayUserId,
        accessToken: encryptToken(tokens.access_token),
        refreshToken: encryptToken(tokens.refresh_token),
        expiresAt,
        refreshExpiresAt,
        scopes: OAUTH_SCOPES,
      },
    });

    return NextResponse.redirect(appUrl('/dashboard/ebay?connected=1'));
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    return NextResponse.redirect(appUrl(`/dashboard/ebay?error=${encodeURIComponent(msg)}`));
  }
}
