import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getSession } from '../../../../lib/session';
import { createMerchantLocation, fetchMerchantLocations } from '../../../../lib/ebay/inventory';
import { normalizeProvinciaIt } from '../../../../lib/ebay/province-it';

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

  const parsed = parseItalianAddress(demolitore.indirizzo);
  if (!parsed) {
    return NextResponse.json({
      error: 'Indirizzo profilo incompleto. Inserisci un indirizzo del tipo "Via Roma 10, 20100 Milano" nel profilo aziendale.',
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
      addressLine1: parsed.addressLine1,
      city: parsed.city,
      stateOrProvince: normalizeProvinciaIt(demolitore.provincia),
      postalCode: parsed.postalCode,
      country: 'IT',
      phone: formatPhoneIt(demolitore.telefono),
    });

    return NextResponse.json({ ok: true, created: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function parseItalianAddress(raw: string): { addressLine1: string; postalCode: string; city: string } | null {
  const cap = raw.match(/\b(\d{5})\b/);
  if (!cap) return null;
  const [before, after] = raw.split(cap[0]);
  // Rimuovi virgole e spazi in eccesso dall'indirizzo (tolleranza formati "Via X, 10" e "Via X 10,")
  const addressLine1 = before.replace(/[,\s]+$/, '').replace(/,/g, '').replace(/\s+/g, ' ').trim();
  const city = after.replace(/^[,\s]+/, '').trim();
  if (!addressLine1 || !city) return null;
  return { addressLine1, postalCode: cap[0], city };
}

function formatPhoneIt(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('39') && digits.length >= 11) return `+${digits}`;
  if (digits.length === 10) return `+39${digits}`;
  return `+${digits}`;
}
