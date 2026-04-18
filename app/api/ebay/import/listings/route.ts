import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { getSession } from '../../../../../lib/session';
import { getMyEbaySelling, type EbayListingSummary } from '../../../../../lib/ebay/trading';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const conn = await prisma.ebayConnection.findUnique({ where: { demolitoreid: session.id } });
  if (!conn) return NextResponse.json({ error: 'eBay non collegato' }, { status: 400 });
  if (conn.refreshExpiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: 'Token eBay scaduto, ricollega l\'account' }, { status: 400 });
  }

  const url = new URL(request.url);
  const listType = (url.searchParams.get('listType') ?? 'all').toLowerCase();
  const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'));
  const entriesPerPage = Math.min(200, Math.max(10, Number(url.searchParams.get('perPage') ?? '50')));

  try {
    let items: EbayListingSummary[] = [];
    let totalPages = 0;
    let totalItems = 0;

    if (listType === 'active') {
      const r = await getMyEbaySelling(session.id, 'ActiveList', page, entriesPerPage);
      items = r.items;
      totalPages = r.totalPages;
      totalItems = r.totalItems;
    } else if (listType === 'sold') {
      const r = await getMyEbaySelling(session.id, 'SoldList', page, entriesPerPage);
      items = r.items;
      totalPages = r.totalPages;
      totalItems = r.totalItems;
    } else {
      // all: merge active + sold (page applies solo a active per semplicità MVP)
      const [active, sold] = await Promise.all([
        getMyEbaySelling(session.id, 'ActiveList', page, entriesPerPage),
        page === 1 ? getMyEbaySelling(session.id, 'SoldList', 1, 50) : Promise.resolve({ items: [], totalPages: 0, totalItems: 0 }),
      ]);
      items = [...active.items, ...sold.items];
      totalPages = active.totalPages;
      totalItems = active.totalItems + sold.totalItems;
    }

    // Marca già importati
    const itemIDs = items.map((i) => i.itemID).filter(Boolean);
    const existing = itemIDs.length > 0
      ? await prisma.ebayListing.findMany({
          where: {
            listingId: { in: itemIDs },
            ricambio: { demolitoreid: session.id },
          },
          select: { listingId: true, ricambioid: true, ricambio: { select: { codice: true } } },
        })
      : [];
    const byListingId = new Map<string, { ricambioId: number; codice: string }>();
    for (const e of existing) {
      if (e.listingId) byListingId.set(e.listingId, { ricambioId: e.ricambioid, codice: e.ricambio.codice });
    }

    const enriched = items.map((it) => {
      const hit = byListingId.get(it.itemID);
      return {
        ...it,
        alreadyImported: !!hit,
        ricambioId: hit?.ricambioId ?? null,
        ricambioCodice: hit?.codice ?? null,
      };
    });

    return NextResponse.json({ items: enriched, page, totalPages, totalItems });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Errore sconosciuto';
    console.error('import/listings error:', e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
