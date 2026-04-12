import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '../../../../lib/prisma';
import { getSession } from '../../../../lib/session';
import { PIANI, type PianoKey } from '../../../../lib/piani';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  }

  let body: { piano: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 });
  }

  const pianoKey = body.piano as PianoKey;
  const piano = PIANI[pianoKey];
  if (!piano || !piano.priceId) {
    return NextResponse.json({ error: 'Piano non valido' }, { status: 400 });
  }

  const demolitore = await prisma.demolitore.findUnique({
    where: { id: session.id },
    select: { id: true, email: true, ragioneSociale: true, stripeCustomerId: true },
  });
  if (!demolitore) {
    return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });
  }

  // Crea o recupera il customer Stripe
  let customerId = demolitore.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: demolitore.email,
      name: demolitore.ragioneSociale,
      metadata: { demolitoreid: String(demolitore.id) },
    });
    customerId = customer.id;
    await prisma.demolitore.update({
      where: { id: demolitore.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: piano.priceId, quantity: 1 }],
    success_url: `${baseUrl}/abbonamento/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/abbonamento`,
    metadata: {
      demolitoreid: String(demolitore.id),
      piano: pianoKey,
    },
    subscription_data: {
      metadata: {
        demolitoreid: String(demolitore.id),
        piano: pianoKey,
      },
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
