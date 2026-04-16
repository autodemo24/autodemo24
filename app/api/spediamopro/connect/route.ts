import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getSession } from '../../../../lib/session';
import { encryptToken } from '../../../../lib/crypto';
import { getApiBase, type SpediamoEnv } from '../../../../lib/spediamopro/config';

// Valida l'authcode chiamando l'auth endpoint per vedere se ottiene un token.
async function testAuthcode(authcode: string, env: SpediamoEnv): Promise<{ ok: boolean; error?: string }> {
  try {
    const basicAuth = Buffer.from(`${authcode}:`).toString('base64');
    const r = await fetch(`${getApiBase(env)}/auth/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    if (!r.ok) {
      const text = await r.text();
      return { ok: false, error: `SpediamoPro risponde ${r.status}: ${text.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'unknown' };
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  let body: { authcode?: string; environment?: string };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 });
  }

  const authcode = body.authcode?.trim();
  const environment: SpediamoEnv = body.environment === 'production' ? 'production' : 'staging';

  if (!authcode) return NextResponse.json({ error: 'Authcode obbligatorio' }, { status: 400 });

  const test = await testAuthcode(authcode, environment);
  if (!test.ok) {
    return NextResponse.json({ error: `Authcode non valido: ${test.error}` }, { status: 400 });
  }

  await prisma.spediamoProConnection.upsert({
    where: { demolitoreid: session.id },
    create: {
      demolitoreid: session.id,
      environment,
      authcode: encryptToken(authcode),
    },
    update: {
      environment,
      authcode: encryptToken(authcode),
      accessToken: null,
      tokenExpiresAt: null,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  await prisma.spediamoProConnection.deleteMany({ where: { demolitoreid: session.id } });
  return NextResponse.json({ ok: true });
}
