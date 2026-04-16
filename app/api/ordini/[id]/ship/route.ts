import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { getSession } from '../../../../../lib/session';
import { createShippingFulfillment } from '../../../../../lib/ebay/fulfillment';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const { id } = await params;
  const idNum = Number(id);
  if (isNaN(idNum)) return NextResponse.json({ error: 'ID non valido' }, { status: 400 });

  let body: { trackingNumber?: string; shippingCarrier?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 }); }

  const trackingNumber = body.trackingNumber?.trim();
  const shippingCarrier = body.shippingCarrier?.trim() ?? 'OTHER';
  if (!trackingNumber) return NextResponse.json({ error: 'trackingNumber obbligatorio' }, { status: 400 });

  const ordine = await prisma.ordine.findUnique({
    where: { id: idNum },
    include: { items: true },
  });
  if (!ordine || ordine.demolitoreid !== session.id) {
    return NextResponse.json({ error: 'Ordine non trovato' }, { status: 404 });
  }

  // Chiama eBay Fulfillment API per segnare come spedito
  try {
    await createShippingFulfillment(session.id, ordine.ebayOrderId, {
      lineItems: ordine.items
        .filter((i) => i.lineItemId)
        .map((i) => ({ lineItemId: i.lineItemId!, quantity: i.quantity })),
      shippedDate: new Date().toISOString(),
      shippingCarrierCode: shippingCarrier,
      trackingNumber,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    return NextResponse.json({ error: `eBay shipping fulfillment fallita: ${msg}` }, { status: 500 });
  }

  // Aggiorna DB locale
  await prisma.ordine.update({
    where: { id: idNum },
    data: {
      stato: 'SHIPPED',
      shippedAt: new Date(),
      trackingNumber,
      shippingCarrier,
    },
  });

  return NextResponse.json({ ok: true });
}
