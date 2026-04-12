import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '../../../../lib/prisma';
import { pianoFromPriceId } from '../../../../lib/piani';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function setpiano(demolitoreid: number, piano: string, subscriptionId: string | null) {
  await prisma.demolitore.update({
    where: { id: demolitoreid },
    data: { piano, stripeSubscriptionId: subscriptionId },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  if (webhookSecret && sig) {
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch {
      return NextResponse.json({ error: 'Firma webhook non valida' }, { status: 400 });
    }
  } else {
    try {
      event = JSON.parse(body) as Stripe.Event;
    } catch {
      return NextResponse.json({ error: 'Body non valido' }, { status: 400 });
    }
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== 'subscription') break;

      const demolitoreid = Number(session.metadata?.demolitoreid);
      const piano = session.metadata?.piano ?? 'FREE';
      const subscriptionId = typeof session.subscription === 'string'
        ? session.subscription
        : (session.subscription as Stripe.Subscription)?.id ?? null;

      if (!demolitoreid) break;
      await setpiano(demolitoreid, piano, subscriptionId);
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const demolitoreid = Number(sub.metadata?.demolitoreid);
      if (!demolitoreid) break;

      const priceId = sub.items.data[0]?.price.id;
      const piano = priceId ? (pianoFromPriceId(priceId) ?? 'FREE') : 'FREE';

      if (sub.status === 'active' || sub.status === 'trialing') {
        await setpiano(demolitoreid, piano, sub.id);
      } else if (sub.status === 'canceled' || sub.status === 'unpaid') {
        await setpiano(demolitoreid, 'FREE', null);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const demolitoreid = Number(sub.metadata?.demolitoreid);
      if (!demolitoreid) break;
      await setpiano(demolitoreid, 'FREE', null);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice & { subscription?: string | null };
      const customerId = typeof invoice.customer === 'string' ? invoice.customer : null;
      if (!customerId || !invoice.subscription) break;

      const demolitore = await prisma.demolitore.findFirst({
        where: { stripeCustomerId: customerId },
        select: { id: true },
      });
      if (demolitore) {
        const sub = await stripe.subscriptions.retrieve(invoice.subscription);
        if (sub.status === 'canceled' || sub.status === 'unpaid') {
          await setpiano(demolitore.id, 'FREE', null);
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
