import { prisma } from '../prisma';
import { getOffer } from './inventory';

export type SyncResult = {
  listingId: number;
  sku: string;
  before: string;
  after: string;
  updated: boolean;
  ricambioNewStato?: string;
  error?: string;
};

// Sincronizza lo stato di un singolo EbayListing con eBay.
// Ritorna oggetto con cosa è cambiato, gestisce errori senza propagare (best-effort).
async function syncOne(listing: {
  id: number;
  ricambioid: number;
  demolitoreid: number;
  sku: string;
  offerId: string | null;
  status: string;
}): Promise<SyncResult> {
  const result: SyncResult = {
    listingId: listing.id,
    sku: listing.sku,
    before: listing.status,
    after: listing.status,
    updated: false,
  };

  if (!listing.offerId) {
    result.error = 'Nessun offerId da controllare';
    return result;
  }

  try {
    const offer = await getOffer(listing.demolitoreid, listing.offerId);
    const ebayStatus = String(offer.status).toUpperCase();
    let newStatus = listing.status;

    if (ebayStatus === 'PUBLISHED') newStatus = 'PUBLISHED';
    else if (ebayStatus === 'ENDED') newStatus = 'ENDED';
    else if (ebayStatus === 'UNPUBLISHED') newStatus = 'UNPUBLISHED';
    else newStatus = ebayStatus;

    result.after = newStatus;

    if (newStatus === listing.status) {
      // Niente da aggiornare
      await prisma.ebayListing.update({
        where: { id: listing.id },
        data: { lastSyncAt: new Date(), lastError: null },
      });
      return result;
    }

    // Stato cambiato
    await prisma.ebayListing.update({
      where: { id: listing.id },
      data: { status: newStatus, lastSyncAt: new Date(), lastError: null },
    });
    result.updated = true;

    // Se l'annuncio è finito (ENDED), assumiamo che sia stato venduto.
    // Se l'utente l'ha ritirato manualmente, aggiornerà a mano lo stato sul portale.
    if (newStatus === 'ENDED') {
      const ricambio = await prisma.ricambio.findUnique({
        where: { id: listing.ricambioid },
        select: { stato: true },
      });
      if (ricambio && ricambio.stato === 'DISPONIBILE') {
        await prisma.ricambio.update({
          where: { id: listing.ricambioid },
          data: { stato: 'VENDUTO', venditoIl: new Date() },
        });
        result.ricambioNewStato = 'VENDUTO';
      }
    }

    return result;
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    result.error = msg;
    await prisma.ebayListing.update({
      where: { id: listing.id },
      data: { lastError: msg.slice(0, 1000), lastSyncAt: new Date() },
    });
    return result;
  }
}

export async function syncListingsForDemolitore(demolitoreid: number): Promise<SyncResult[]> {
  const listings = await prisma.ebayListing.findMany({
    where: {
      status: { in: ['PUBLISHED', 'UNPUBLISHED'] },
      ricambio: { demolitoreid },
    },
    include: { ricambio: { select: { demolitoreid: true } } },
  });

  const results: SyncResult[] = [];
  for (const l of listings) {
    const r = await syncOne({
      id: l.id,
      ricambioid: l.ricambioid,
      demolitoreid: l.ricambio.demolitoreid,
      sku: l.sku,
      offerId: l.offerId,
      status: l.status,
    });
    results.push(r);
  }
  return results;
}

export async function syncAllListings(): Promise<{ totalDemolitori: number; totalListings: number; updated: number; errors: number }> {
  // Fetch tutti gli EbayListing attivi con il demolitore
  const listings = await prisma.ebayListing.findMany({
    where: { status: { in: ['PUBLISHED', 'UNPUBLISHED'] } },
    include: { ricambio: { select: { demolitoreid: true } } },
  });

  const demolitoreIds = new Set<number>();
  let updated = 0;
  let errors = 0;

  for (const l of listings) {
    demolitoreIds.add(l.ricambio.demolitoreid);
    const r = await syncOne({
      id: l.id,
      ricambioid: l.ricambioid,
      demolitoreid: l.ricambio.demolitoreid,
      sku: l.sku,
      offerId: l.offerId,
      status: l.status,
    });
    if (r.updated) updated++;
    if (r.error) errors++;
  }

  return {
    totalDemolitori: demolitoreIds.size,
    totalListings: listings.length,
    updated,
    errors,
  };
}
