import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { prisma } from '../../../../lib/prisma';

// Endpoint richiesto da eBay per compliance GDPR (Marketplace Account Deletion).
// Documentazione: https://developer.ebay.com/marketplace-account-deletion
//
// GET: challenge verification — eBay manda ?challenge_code=XYZ e si aspetta
//   la risposta JSON { challengeResponse: SHA256(challengeCode + verificationToken + endpointURL) }
//
// POST: notifica reale — payload con eBay userId di un utente che ha cancellato
//   l'account. Dobbiamo cancellare i suoi dati (EbayConnection) + confermare con 200/204.

function getVerificationToken(): string {
  const t = process.env.EBAY_DELETION_VERIFICATION_TOKEN;
  if (!t || t.length < 32) {
    throw new Error('EBAY_DELETION_VERIFICATION_TOKEN mancante o troppo corto (min 32 char)');
  }
  return t;
}

function getEndpointUrl(request: Request): string {
  const configured = process.env.EBAY_DELETION_ENDPOINT_URL;
  if (configured) return configured;
  const url = new URL(request.url);
  return `${url.origin}${url.pathname}`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const challengeCode = url.searchParams.get('challenge_code');
  if (!challengeCode) {
    return NextResponse.json({ error: 'challenge_code mancante' }, { status: 400 });
  }

  const token = getVerificationToken();
  const endpoint = getEndpointUrl(request);

  const hash = crypto.createHash('sha256');
  hash.update(challengeCode);
  hash.update(token);
  hash.update(endpoint);
  const challengeResponse = hash.digest('hex');

  return NextResponse.json({ challengeResponse });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalido' }, { status: 400 });
  }

  const notification = (body as { notification?: { data?: { userId?: string; username?: string } } })?.notification;
  const data = notification?.data;

  if (data?.userId || data?.username) {
    const ebayUserId = data.username ?? data.userId ?? null;
    if (ebayUserId) {
      await prisma.ebayConnection.deleteMany({ where: { ebayUserId } });
    }
  }

  return new NextResponse(null, { status: 204 });
}
