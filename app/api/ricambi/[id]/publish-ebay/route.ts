import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { getSession } from '../../../../../lib/session';
import {
  createOrReplaceInventoryItem,
  createOffer,
  publishOffer,
  createCompatibility,
  fetchSellerPolicies,
  fetchMerchantLocations,
} from '../../../../../lib/ebay/inventory';
import {
  buildInventoryItemPayload,
  buildOfferPayload,
  buildCompatibilityPayload,
} from '../../../../../lib/ebay/mapper';
import { getMarketplaceId } from '../../../../../lib/ebay/config';
import { applicaTemplate, toHtmlDescription } from '../../../../../lib/ebay/description-template';

type ErrBody = { error: string; detail?: unknown };

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json<ErrBody>({ error: 'Non autenticato' }, { status: 401 });

  const { id } = await params;
  const idNum = Number(id);
  if (isNaN(idNum)) return NextResponse.json<ErrBody>({ error: 'ID non valido' }, { status: 400 });

  const [ricambio, demolitore] = await Promise.all([
    prisma.ricambio.findUnique({
      where: { id: idNum },
      include: {
        foto: true,
        compatibilita: true,
        modelloAuto: { select: { annoInizio: true, annoFine: true } },
      },
    }),
    prisma.demolitore.findUnique({
      where: { id: session.id },
      select: { ragioneSociale: true, descrizioneTemplate: true },
    }),
  ]);
  if (!ricambio || ricambio.demolitoreid !== session.id) {
    return NextResponse.json<ErrBody>({ error: 'Ricambio non trovato' }, { status: 404 });
  }

  const connection = await prisma.ebayConnection.findUnique({ where: { demolitoreid: session.id } });
  if (!connection) {
    return NextResponse.json<ErrBody>({ error: 'eBay non collegato. Vai su /dashboard/ebay per collegare il tuo account.' }, { status: 400 });
  }
  if (connection.refreshExpiresAt.getTime() < Date.now()) {
    return NextResponse.json<ErrBody>({ error: 'Token eBay scaduto. Ricollega il tuo account dalla pagina eBay.' }, { status: 400 });
  }

  if (!ricambio.categoriaEbayId) {
    return NextResponse.json<ErrBody>({ error: 'Imposta una categoria eBay per il ricambio prima di pubblicare.' }, { status: 400 });
  }

  // SKU sequenziale per demolitore. Se il ricambio è già pubblicato, riusa lo SKU esistente.
  const existingListing = await prisma.ebayListing.findUnique({
    where: { ricambioid: ricambio.id },
    select: { sku: true },
  });
  let sku: string;
  if (existingListing) {
    sku = existingListing.sku;
  } else {
    const demolitoreListings = await prisma.ebayListing.findMany({
      where: { ricambio: { demolitoreid: session.id } },
      select: { sku: true },
    });
    const maxNum = demolitoreListings.reduce((max, l) => {
      const n = parseInt(l.sku, 10);
      return Number.isNaN(n) ? max : Math.max(max, n);
    }, 0);
    sku = String(maxNum + 1);
  }

  try {
    // 1. Policies + location
    const [policies, locations] = await Promise.all([
      fetchSellerPolicies(session.id, getMarketplaceId()),
      fetchMerchantLocations(session.id),
    ]);
    const fulfillment = policies.fulfillmentPolicies[0];
    const payment = policies.paymentPolicies[0];
    const returnP = policies.returnPolicies[0];
    if (!fulfillment || !payment || !returnP) {
      return NextResponse.json<ErrBody>({
        error: 'Configura le Business Policies (spedizione, pagamento, reso) nel tuo eBay Seller Hub prima di pubblicare.',
      }, { status: 400 });
    }
    const location = locations[0];
    if (!location) {
      return NextResponse.json<ErrBody>({
        error: 'Configura un Merchant Location (magazzino) nel tuo eBay Seller Hub prima di pubblicare.',
      }, { status: 400 });
    }

    // Applica template descrizione se presente (usato sia per inventory che offer)
    const templateText = demolitore?.descrizioneTemplate?.trim();
    const descrizioneFinale = templateText && demolitore
      ? toHtmlDescription(applicaTemplate(templateText, ricambio, demolitore))
      : ricambio.descrizione;
    const ricambioConTemplate = { ...ricambio, descrizione: descrizioneFinale };

    // 2. Inventory Item
    const inventoryPayload = buildInventoryItemPayload({
      ...ricambioConTemplate,
      prezzo: ricambio.prezzo,
    });
    await createOrReplaceInventoryItem(session.id, sku, inventoryPayload);

    // 3. Compatibility (se presente)
    if (ricambio.compatibilita.length > 0) {
      const compatPayload = buildCompatibilityPayload(ricambio.compatibilita);
      try {
        await createCompatibility(session.id, sku, compatPayload);
      } catch (e) {
        // Se la categoria non supporta compatibilità, eBay restituisce errore: ignoriamo
        console.warn('Compatibilità non applicata:', e);
      }
    }

    // 4. Offer — include template descrizione
    const offerPayload = buildOfferPayload({
      ricambio: { ...ricambioConTemplate, prezzo: ricambio.prezzo },
      sku,
      categoryId: ricambio.categoriaEbayId,
      fulfillmentPolicyId: fulfillment.fulfillmentPolicyId,
      paymentPolicyId: payment.paymentPolicyId,
      returnPolicyId: returnP.returnPolicyId,
      merchantLocationKey: location.merchantLocationKey,
    });
    const offer = await createOffer(session.id, offerPayload);

    // 5. Publish
    const listing = await publishOffer(session.id, offer.offerId);

    // 6. Salva tracking
    await prisma.ebayListing.upsert({
      where: { ricambioid: ricambio.id },
      create: {
        ricambioid: ricambio.id,
        sku,
        offerId: offer.offerId,
        listingId: listing.listingId,
        status: 'PUBLISHED',
        marketplaceId: getMarketplaceId(),
        lastSyncAt: new Date(),
      },
      update: {
        sku,
        offerId: offer.offerId,
        listingId: listing.listingId,
        status: 'PUBLISHED',
        lastError: null,
        lastSyncAt: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      listingId: listing.listingId,
      offerId: offer.offerId,
      status: 'PUBLISHED',
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    const body = (e as { body?: unknown }).body;

    await prisma.ebayListing.upsert({
      where: { ricambioid: ricambio.id },
      create: {
        ricambioid: ricambio.id,
        sku,
        status: 'FAILED',
        marketplaceId: getMarketplaceId(),
        lastError: msg.slice(0, 1000),
        lastSyncAt: new Date(),
      },
      update: {
        status: 'FAILED',
        lastError: msg.slice(0, 1000),
        lastSyncAt: new Date(),
      },
    });

    return NextResponse.json<ErrBody>({ error: msg, detail: body }, { status: 500 });
  }
}
