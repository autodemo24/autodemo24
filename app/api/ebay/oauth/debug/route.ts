import { NextResponse } from 'next/server';
import { getSession } from '../../../../../lib/session';
import { buildAuthorizeUrl } from '../../../../../lib/ebay/oauth';
import { getEbayEnv, getCredentials } from '../../../../../lib/ebay/config';

// DEBUG ONLY — mostra l'URL OAuth che stiamo mandando a eBay
// Rimuovere questo endpoint dopo il debug.
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  try {
    const creds = getCredentials();
    const env = getEbayEnv();
    const url = buildAuthorizeUrl('DEBUG_STATE');
    return NextResponse.json({
      environment: env,
      appIdUsed: creds.appId,
      ruNameUsed: creds.ruName,
      devIdUsed: creds.devId,
      authorizeUrl: url,
      nextPublicAppUrl: process.env.NEXT_PUBLIC_APP_URL,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
