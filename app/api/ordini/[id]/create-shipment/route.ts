import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from '../../../../../lib/prisma';
import { getSession } from '../../../../../lib/session';
import { acceptQuotation } from '../../../../../lib/spediamopro/quotations';
import { getShipmentLabel } from '../../../../../lib/spediamopro/shipments';
import { createShippingFulfillment } from '../../../../../lib/ebay/fulfillment';

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

function spToEbayCarrier(carrier: string | null | undefined): string {
  if (!carrier) return 'OTHER';
  const c = carrier.toUpperCase();
  if (c.includes('POSTE')) return 'POSTE_ITALIANE';
  if (c.includes('SDA')) return 'SDA';
  if (c.includes('BRT')) return 'BRT';
  if (c.includes('GLS')) return 'GLS';
  if (c.includes('DHL')) return 'DHL';
  if (c.includes('UPS')) return 'UPS';
  if (c.includes('FEDEX')) return 'FEDEX';
  if (c.includes('TNT')) return 'TNT';
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
    quotationId?: string;
    pesoGrammi?: number;
    lunghezzaMm?: number;
    larghezzaMm?: number;
    altezzaMm?: number;
    cost?: number;
  };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 });
  }

  const quotationId = body.quotationId;
  if (!quotationId) return NextResponse.json({ error: 'quotationId obbligatorio' }, { status: 400 });

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
    return NextResponse.json({
      error: 'Profilo aziendale incompleto: CAP e città obbligatori.',
    }, { status: 400 });
  }

  try {
    // 1. Accetta quotazione
    const shipment = await acceptQuotation(session.id, {
      quotationId,
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
        address: [ordine.shippingAddressLine1, ordine.shippingAddressLine2].filter(Boolean).join(' ') || '-',
        phone: ordine.buyerPhone ?? '0000000000',
        email: ordine.buyerEmail ?? undefined,
        country: ordine.shippingCountry ?? 'IT',
        postalCode: ordine.shippingPostalCode ?? '',
        city: ordine.shippingCity ?? '',
        province: ordine.shippingProvince ?? undefined,
      },
      labelFormat: 0,
      yourReference: `AD24-${ordine.ebayOrderId}`,
    });

    if (!shipment.id) {
      return NextResponse.json({ error: 'SpediamoPro non ha restituito un Shipment ID' }, { status: 500 });
    }

    // 2. Scarica etichetta PDF e caricala su R2
    let labelUrl: string | null = null;
    try {
      const label = await getShipmentLabel(session.id, shipment.id);
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
      // Non blocchiamo: utente potrà riprovare a scaricare dall'endpoint dedicato
    }

    // 3. Salva spedizione in DB
    await prisma.spedizione.upsert({
      where: { ordineid: ordine.id },
      create: {
        ordineid: ordine.id,
        provider: 'spediamopro',
        spShipmentId: shipment.id,
        spQuotationId: quotationId,
        carrier: shipment.carrier ?? null,
        trackingNumber: shipment.trackingNumber ?? null,
        pesoGrammi: Number(body.pesoGrammi ?? 0),
        lunghezzaMm: Number(body.lunghezzaMm ?? 0),
        larghezzaMm: Number(body.larghezzaMm ?? 0),
        altezzaMm: Number(body.altezzaMm ?? 0),
        labelUrl,
        cost: body.cost ?? null,
      },
      update: {
        spShipmentId: shipment.id,
        spQuotationId: quotationId,
        carrier: shipment.carrier ?? null,
        trackingNumber: shipment.trackingNumber ?? null,
        labelUrl,
        cost: body.cost ?? null,
      },
    });

    // 4. Aggiorna ordine + chiama eBay Fulfillment
    await prisma.ordine.update({
      where: { id: ordine.id },
      data: {
        stato: 'SHIPPED',
        shippedAt: new Date(),
        trackingNumber: shipment.trackingNumber ?? null,
        shippingCarrier: shipment.carrier ?? null,
      },
    });

    if (shipment.trackingNumber) {
      try {
        await createShippingFulfillment(session.id, ordine.ebayOrderId, {
          lineItems: ordine.items
            .filter((i) => i.lineItemId)
            .map((i) => ({ lineItemId: i.lineItemId!, quantity: i.quantity })),
          shippedDate: new Date().toISOString(),
          shippingCarrierCode: spToEbayCarrier(shipment.carrier),
          trackingNumber: shipment.trackingNumber,
        });
      } catch (e) {
        console.warn('Notifica eBay fulfillment fallita:', e);
      }
    }

    return NextResponse.json({
      ok: true,
      shipmentId: shipment.id,
      trackingNumber: shipment.trackingNumber,
      carrier: shipment.carrier,
      labelUrl,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
