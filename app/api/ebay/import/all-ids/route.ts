import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { getSession } from '../../../../../lib/session';
import { getMyEbaySelling, type EbayListingSummary } from '../../../../../lib/ebay/trading';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const PER_PAGE = 200;
const PARALLEL = 5;

type ListType = 'ActiveList' | 'SoldList';

async function fetchAllPages(
  demolitoreid: number,
  type: ListType,
): Promise<EbayListingSummary[]> {
  const first = await getMyEbaySelling(demolitoreid, type, 1, PER_PAGE);
  if (first.totalPages <= 1) return first.items;

  const remaining = Array.from({ length: first.totalPages - 1 }, (_, i) => i + 2);
  const collected: EbayListingSummary[] = [...first.items];

  for (let i = 0; i < remaining.length; i += PARALLEL) {
    const batch = remaining.slice(i, i + PARALLEL);
    const results = await Promise.all(
      batch.map((page) => getMyEbaySelling(demolitoreid, type, page, PER_PAGE)),
    );
    for (const r of results) collected.push(...r.items);
  }

  return collected;
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const conn = await prisma.ebayConnection.findUnique({ where: { demolitoreid: session.id } });
  if (!conn) return NextResponse.json({ error: 'eBay non collegato' }, { status: 400 });
  if (conn.refreshExpiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: 'Token eBay scaduto' }, { status: 400 });
  }

  const url = new URL(request.url);
  const listType = (url.searchParams.get('listType') ?? 'all').toLowerCase();

  try {
    const items: EbayListingSummary[] = [];
    if (listType === 'active' || listType === 'all') {
      items.push(...(await fetchAllPages(session.id, 'ActiveList')));
    }
    if (listType === 'sold' || listType === 'all') {
      items.push(...(await fetchAllPages(session.id, 'SoldList')));
    }

    const itemIDs = items.map((i) => i.itemID).filter(Boolean);
    const alreadyImported = itemIDs.length > 0
      ? await prisma.ebayListing.findMany({
          where: {
            listingId: { in: itemIDs },
            ricambio: { demolitoreid: session.id },
          },
          select: { listingId: true },
        })
      : [];
    const alreadyImportedSet = new Set(alreadyImported.map((e) => e.listingId).filter(Boolean) as string[]);

    return NextResponse.json({
      total: itemIDs.length,
      importableItemIDs: itemIDs.filter((id) => !alreadyImportedSet.has(id)),
      alreadyImportedCount: alreadyImportedSet.size,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Errore sconosciuto';
    console.error('import/all-ids error:', e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
