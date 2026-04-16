import { NextResponse } from 'next/server';
import { getSession } from '../../../../lib/session';
import { syncListingsForDemolitore } from '../../../../lib/ebay/sync';

// Endpoint per bottone "Sincronizza eBay" sul dashboard: aggiorna gli annunci
// del demolitore loggato allineandoli a eBay (ENDED, UNPUBLISHED, ecc).
export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  try {
    const results = await syncListingsForDemolitore(session.id);
    const summary = {
      total: results.length,
      updated: results.filter((r) => r.updated).length,
      errors: results.filter((r) => r.error).length,
      venduti: results.filter((r) => r.ricambioNewStato === 'VENDUTO').length,
    };
    return NextResponse.json({ ok: true, summary, results });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
