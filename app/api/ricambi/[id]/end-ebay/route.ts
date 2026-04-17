import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { getSession } from '../../../../../lib/session';
import { withdrawOffer } from '../../../../../lib/ebay/inventory';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const { id } = await params;
  const idNum = Number(id);
  if (Number.isNaN(idNum)) return NextResponse.json({ error: 'ID non valido' }, { status: 400 });

  const ricambio = await prisma.ricambio.findUnique({
    where: { id: idNum },
    select: { id: true, demolitoreid: true, ebayListing: { select: { offerId: true, status: true } } },
  });
  if (!ricambio || ricambio.demolitoreid !== session.id) {
    return NextResponse.json({ error: 'Ricambio non trovato' }, { status: 404 });
  }

  const offerId = ricambio.ebayListing?.offerId;
  if (!offerId) {
    return NextResponse.json({ error: 'Nessuna inserzione eBay attiva per questo ricambio' }, { status: 400 });
  }

  try {
    await withdrawOffer(session.id, offerId);
    await prisma.ebayListing.update({
      where: { ricambioid: ricambio.id },
      data: { status: 'ENDED', lastSyncAt: new Date(), lastError: null },
    });
    await prisma.ricambio.update({
      where: { id: ricambio.id },
      data: { pubblicato: false },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Errore sconosciuto';
    return NextResponse.json({ error: `Impossibile chiudere inserzione: ${msg}` }, { status: 500 });
  }
}
