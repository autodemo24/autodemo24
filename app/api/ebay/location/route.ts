import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getSession } from '../../../../lib/session';
import { createMerchantLocation, fetchMerchantLocations } from '../../../../lib/ebay/inventory';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  try {
    const locations = await fetchMerchantLocations(session.id);
    return NextResponse.json({ locations });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const demolitore = await prisma.demolitore.findUnique({ where: { id: session.id } });
  if (!demolitore) return NextResponse.json({ error: 'Demolitore non trovato' }, { status: 404 });

  if (!demolitore.cap || !demolitore.citta) {
    return NextResponse.json({
      error: 'Profilo aziendale incompleto: CAP e città obbligatori. Vai su Profilo aziendale e compilali.',
    }, { status: 400 });
  }

  try {
    const existing = await fetchMerchantLocations(session.id);
    if (existing.length > 0) {
      return NextResponse.json({
        ok: true,
        alreadyExists: true,
        locations: existing,
      });
    }

    await createMerchantLocation(session.id, {
      merchantLocationKey: `autodemo24_main_${session.id}`,
      name: demolitore.ragioneSociale.slice(0, 60),
      addressLine1: demolitore.indirizzo,
      city: demolitore.citta,
      stateOrProvince: demolitore.provincia,
      postalCode: demolitore.cap,
      country: 'IT',
    });

    return NextResponse.json({ ok: true, created: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
