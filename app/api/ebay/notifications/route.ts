import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { computeChallengeResponse } from '../../../../lib/ebay/notifications';
import { getOrder } from '../../../../lib/ebay/fulfillment';

// Endpoint webhook per eBay Commerce Notifications
// - GET: challenge verification (eBay valida l'endpoint alla creazione subscription)
// - POST: notifiche realtime (ORDER_CONFIRMATION, ITEM_MARKED_SHIPPED, ITEM_AVAILABILITY)

function getEndpointUrl(request: Request): string {
  const configured = process.env.EBAY_NOTIFICATION_ENDPOINT_URL;
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
  try {
    const challengeResponse = computeChallengeResponse(challengeCode, getEndpointUrl(request));
    return NextResponse.json({ challengeResponse });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

type NotificationPayload = {
  metadata?: {
    topic?: string;
    schemaVersion?: string;
    deprecated?: boolean;
  };
  notification?: {
    notificationId?: string;
    eventDate?: string;
    publishDate?: string;
    publishAttemptCount?: number;
    data?: Record<string, unknown>;
  };
};

export async function POST(request: Request) {
  let body: NotificationPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalido' }, { status: 400 });
  }

  const topic = body.metadata?.topic;
  const data = body.notification?.data ?? {};

  try {
    if (topic === 'ORDER_CONFIRMATION' || topic === 'ORDER_PAID' || topic === 'ORDER_COMPLETED') {
      await handleOrderNotification(data);
    } else if (topic === 'ITEM_MARKED_SHIPPED') {
      await handleShippedNotification(data);
    } else if (topic === 'ITEM_AVAILABILITY') {
      await handleAvailabilityNotification(data);
    } else {
      console.log('Notifica non gestita, topic:', topic, 'data:', JSON.stringify(data).slice(0, 300));
    }
  } catch (e) {
    console.error('Errore handling notifica', topic, e);
    // Rispondi comunque 200/204 per evitare che eBay riprovi all'infinito
  }

  return new NextResponse(null, { status: 204 });
}

async function handleOrderNotification(data: Record<string, unknown>) {
  const orderId = (data.orderId ?? data.order_id) as string | undefined;
  const sellerUsername = (data.sellerUsername ?? data.seller ?? data.sellerId) as string | undefined;
  if (!orderId) return;

  // Trova il demolitore dal seller username
  let demolitoreid: number | null = null;
  if (sellerUsername) {
    const conn = await prisma.ebayConnection.findFirst({
      where: { ebayUserId: sellerUsername },
      select: { demolitoreid: true },
    });
    if (conn) demolitoreid = conn.demolitoreid;
  }
  // Fallback: se c'è un solo demolitore connesso usa quello (single-tenant scenario)
  if (!demolitoreid) {
    const connections = await prisma.ebayConnection.findMany({ select: { demolitoreid: true } });
    if (connections.length === 1) demolitoreid = connections[0].demolitoreid;
  }
  if (!demolitoreid) {
    console.warn('Ordine ricevuto ma non riesco a mappare al demolitore:', orderId, sellerUsername);
    return;
  }

  // Fetch ordine completo via Fulfillment API
  let order;
  try {
    order = await getOrder(demolitoreid, orderId);
  } catch (e) {
    console.error('Fetch ordine fallito', orderId, e);
    return;
  }

  await upsertOrdine(demolitoreid, order);
}

async function handleShippedNotification(data: Record<string, unknown>) {
  const orderId = data.orderId as string | undefined;
  if (!orderId) return;
  await prisma.ordine.updateMany({
    where: { ebayOrderId: orderId },
    data: { shippedAt: new Date(), stato: 'SHIPPED' },
  });
}

async function handleAvailabilityNotification(data: Record<string, unknown>) {
  const sku = data.sku as string | undefined;
  const availableQuantity = data.availableQuantity as number | undefined;
  if (!sku || availableQuantity === undefined) return;
  if (availableQuantity === 0) {
    const listing = await prisma.ebayListing.findFirst({
      where: { sku },
      select: { ricambioid: true, ricambio: { select: { stato: true } } },
    });
    if (listing && listing.ricambio?.stato === 'DISPONIBILE') {
      await prisma.ricambio.update({
        where: { id: listing.ricambioid },
        data: { stato: 'VENDUTO', venditoIl: new Date() },
      });
    }
  }
}

async function upsertOrdine(demolitoreid: number, order: Awaited<ReturnType<typeof getOrder>>) {
  const shipTo = order.fulfillmentStartInstructions?.[0]?.shippingStep?.shipTo;
  const totalAmount = Number(order.pricingSummary?.total?.value ?? '0');
  const currency = order.pricingSummary?.total?.currency ?? 'EUR';

  const paymentStatus = order.orderPaymentStatus?.toUpperCase() ?? 'UNKNOWN';
  const fulfillmentStatus = order.orderFulfillmentStatus?.toUpperCase() ?? 'UNKNOWN';
  let stato = 'CREATED';
  if (fulfillmentStatus === 'FULFILLED') stato = 'SHIPPED';
  else if (paymentStatus === 'PAID') stato = 'PAID';
  else if (order.cancelStatus?.cancelState) stato = 'CANCELLED';

  const data = {
    demolitoreid,
    stato,
    buyerUsername: order.buyer?.username ?? null,
    buyerEmail: shipTo?.email ?? order.buyer?.buyerRegistrationAddress?.email ?? null,
    buyerPhone: shipTo?.primaryPhone?.phoneNumber ?? null,
    shippingName: shipTo?.fullName ?? null,
    shippingAddressLine1: shipTo?.contactAddress?.addressLine1 ?? null,
    shippingAddressLine2: shipTo?.contactAddress?.addressLine2 ?? null,
    shippingCity: shipTo?.contactAddress?.city ?? null,
    shippingPostalCode: shipTo?.contactAddress?.postalCode ?? null,
    shippingProvince: shipTo?.contactAddress?.stateOrProvince ?? null,
    shippingCountry: shipTo?.contactAddress?.countryCode ?? null,
    totalAmount,
    currency,
    noteAcquirente: order.buyerCheckoutNotes ?? null,
    paidAt: paymentStatus === 'PAID' ? new Date() : null,
    shippedAt: fulfillmentStatus === 'FULFILLED' ? new Date() : null,
    cancelledAt: order.cancelStatus?.cancelState ? new Date() : null,
    rawPayload: order as never,
  };

  const existing = await prisma.ordine.findUnique({ where: { ebayOrderId: order.orderId } });

  if (existing) {
    await prisma.ordine.update({ where: { id: existing.id }, data });
    return;
  }

  // Nuovo ordine: crea con items
  const created = await prisma.ordine.create({
    data: {
      ebayOrderId: order.orderId,
      ...data,
      items: {
        create: (order.lineItems ?? []).map((li) => ({
          sku: li.sku ?? '',
          quantity: li.quantity,
          unitPrice: Number(li.lineItemCost.value) / li.quantity,
          totalPrice: Number(li.lineItemCost.value),
          titolo: li.title,
          lineItemId: li.lineItemId,
        })),
      },
    },
    include: { items: true },
  });

  // Match SKU → Ricambio e marca come VENDUTO
  for (const item of created.items) {
    if (!item.sku) continue;
    const ricambio = await prisma.ricambio.findFirst({
      where: { codice: item.sku, demolitoreid },
      select: { id: true, stato: true },
    });
    if (ricambio) {
      await prisma.ordineItem.update({
        where: { id: item.id },
        data: { ricambioid: ricambio.id },
      });
      if (ricambio.stato === 'DISPONIBILE') {
        await prisma.ricambio.update({
          where: { id: ricambio.id },
          data: { stato: 'VENDUTO', venditoIl: new Date() },
        });
      }
    }
  }
}
