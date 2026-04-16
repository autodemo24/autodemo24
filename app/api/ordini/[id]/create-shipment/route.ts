import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from '../../../../../lib/prisma';
import { getSession } from '../../../../../lib/session';
import { acceptQuotation, type QuotationOption } from '../../../../../lib/spediamopro/quotations';
import { getShipmentLabel } from '../../../../../lib/spediamopro/shipments';
import { createShippingFulfillment } from '../../../../../lib/ebay/fulfillment';
import { normalizeProvinciaIt } from '../../../../../lib/ebay/province-it';

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

function spCourierToEbay(courier: string | undefined): string {
  if (!courier) return 'OTHER';
  const c = courier.toLowerCase();
  if (c.includes('brt')) return 'BRT';
  if (c.includes('sda') || c.includes('poste')) return 'SDA';
  if (c.includes('inpost')) return 'OTHER';
  if (c.includes('ups')) return 'UPS';
  return 'OTHER';
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const { id } = await params;
  const idNum = Number(id);
  if (isNaN(idNum)) return NextResponse.json({ error: 'ID non valido' }, { status: 400 });

  let body: {
    quotation?: QuotationOption;
    pesoGrammi?: number;
    lunghezzaMm?: number;
    larghezzaMm?: number;
    altezzaMm?: number;
  };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 });
  }

  const quotation = body.quotation;
  if (!quotation || typeof quotation.service !== 'number') {
    return NextResponse.json({ error: 'Preventivo non valido' }, { status: 400 });
  }

  const [ordine, demolitore] = await Promise.all([
    prisma.ordine.findUnique({ where: { id: idNum }, include: { items: true } }),
    prisma.demolitore.findUnique({ where: { id: session.id } }),
  ]);

  if (!ordine || ordine.demolitoreid !== session.id) {
    return NextResponse.json({ error: 'Ordine non trovato' }, { status: 404 });
  }
  if (!demolitore) {
    return NextResponse.json({ error: 'Demolitore non trovato' }, { status: 404 });
  }

  if (!demolitore.cap || !demolitore.citta) {
    return NextResponse.json({ error: 'Profilo aziendale incompleto: CAP e città obbligatori.' }, { status: 400 });
  }

  const pesoGrammi = Number(body.pesoGrammi);
  const lunghezzaMm = Number(body.lunghezzaMm);
  const larghezzaMm = Number(body.larghezzaMm);
  const altezzaMm = Number(body.altezzaMm);

  try {
    const shipment = await acceptQuotation(session.id, {
      parcels: [{ type: 1, weight: pesoGrammi, length: lunghezzaMm, width: larghezzaMm, height: altezzaMm }],
      sender: {
        name: demolitore.ragioneSociale,
        address: demolitore.indirizzo,
        phone: demolitore.telefono,
        email: demolitore.email,
        country: 'IT',
        postalCode: demolitore.cap,
        city: demolitore.citta,
        province: demolitore.provincia,
      },
      consignee: {
        name: ordine.shippingName ?? ordine.buyerUsername ?? 'Acquirente',
        address: [ordine.shippingAddressLine1, ordine.shippingAddressLine2].filter(Boolean).join(' ') || 'Via Roma 1',
        phone: ordine.buyerPhone ?? '0000000000',
        email: ordine.buyerEmail ?? 'buyer@example.com',
        country: ordine.shippingCountry ?? 'IT',
        postalCode: ordine.shippingPostalCode ?? '',
        city: ordine.shippingCity ?? '',
        province: ordine.shippingProvince ? normalizeProvinciaIt(ordine.shippingProvince) : undefined,
      },
      quotation: {
        service: quotation.service,
        expectedDeliveryDate: quotation.expectedDeliveryDate,
        firstAvailablePickupDate: quotation.firstAvailablePickupDate,
        priceBreakdown: quotation.priceBreakdown,
      },
      labelFormat: 0,
      externalReference: `AD24-${ordine.ebayOrderId}`,
    });

    if (!shipment.id) {
      return NextResponse.json({ error: 'SpediamoPro non ha restituito un Shipment ID' }, { status: 500 });
    }

    // Download etichetta PDF e upload R2
    let labelUrl: string | null = null;
    try {
      const label = await getShipmentLabel(session.id, String(shipment.id));
      const key = `spedizioni/${ordine.demolitoreid}/${shipment.id}_${crypto.randomBytes(4).toString('hex')}.pdf`;
      await s3.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        Body: label.buffer,
        ContentType: label.contentType || 'application/pdf',
      }));
      labelUrl = `${process.env.R2_PUBLIC_URL!.replace(/\/$/, '')}/${key}`;
    } catch (e) {
      console.warn('Download label fallito:', e);
    }

    await prisma.spedizione.upsert({
      where: { ordineid: ordine.id },
      create: {
        ordineid: ordine.id,
        provider: 'spediamopro',
        spShipmentId: String(shipment.id),
        spQuotationId: String(quotation.service),
        carrier: shipment.courierService?.courier ?? null,
        trackingNumber: shipment.trackingCode ?? null,
        pesoGrammi,
        lunghezzaMm,
        larghezzaMm,
        altezzaMm,
        labelUrl,
        cost: quotation.totalPrice / 100,
      },
      update: {
        spShipmentId: String(shipment.id),
        spQuotationId: String(quotation.service),
        carrier: shipment.courierService?.courier ?? null,
        trackingNumber: shipment.trackingCode ?? null,
        labelUrl,
        cost: quotation.totalPrice / 100,
      },
    });

    await prisma.ordine.update({
      where: { id: ordine.id },
      data: {
        stato: 'SHIPPED',
        shippedAt: new Date(),
        trackingNumber: shipment.trackingCode ?? null,
        shippingCarrier: shipment.courierService?.courier ?? null,
      },
    });

    if (shipment.trackingCode) {
      try {
        await createShippingFulfillment(session.id, ordine.ebayOrderId, {
          lineItems: ordine.items
            .filter((i) => i.lineItemId)
            .map((i) => ({ lineItemId: i.lineItemId!, quantity: i.quantity })),
          shippedDate: new Date().toISOString(),
          shippingCarrierCode: spCourierToEbay(shipment.courierService?.courier),
          trackingNumber: shipment.trackingCode,
        });
      } catch (e) {
        console.warn('Notifica eBay fulfillment fallita (ignorato, probabile ordine TEST):', e);
      }
    }

    return NextResponse.json({
      ok: true,
      shipmentId: shipment.id,
      trackingNumber: shipment.trackingCode,
      carrier: shipment.courierService?.courier,
      labelUrl,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
