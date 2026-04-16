import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { getSession } from '../../../../../lib/session';
import { requestQuotations } from '../../../../../lib/spediamopro/quotations';
import { normalizeProvinciaIt } from '../../../../../lib/ebay/province-it';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const { id } = await params;
  const idNum = Number(id);
  if (isNaN(idNum)) return NextResponse.json({ error: 'ID non valido' }, { status: 400 });

  let body: { pesoGrammi?: number; lunghezzaMm?: number; larghezzaMm?: number; altezzaMm?: number };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 });
  }

  const pesoGrammi = Number(body.pesoGrammi);
  const lunghezzaMm = Number(body.lunghezzaMm);
  const larghezzaMm = Number(body.larghezzaMm);
  const altezzaMm = Number(body.altezzaMm);

  if (!pesoGrammi || !lunghezzaMm || !larghezzaMm || !altezzaMm) {
    return NextResponse.json({ error: 'Peso e dimensioni obbligatori (in grammi/mm)' }, { status: 400 });
  }

  const ordine = await prisma.ordine.findUnique({ where: { id: idNum } });
  if (!ordine || ordine.demolitoreid !== session.id) {
    return NextResponse.json({ error: 'Ordine non trovato' }, { status: 404 });
  }

  const demolitore = await prisma.demolitore.findUnique({ where: { id: session.id } });
  if (!demolitore) return NextResponse.json({ error: 'Demolitore non trovato' }, { status: 404 });

  if (!demolitore.cap || !demolitore.citta) {
    return NextResponse.json({
      error: 'Profilo aziendale incompleto: CAP e città obbligatori.',
    }, { status: 400 });
  }

  try {
    const quotations = await requestQuotations(session.id, {
      parcels: [{ type: 1, weight: pesoGrammi, length: lunghezzaMm, width: larghezzaMm, height: altezzaMm }],
      sender: {
        country: 'IT',
        postalCode: demolitore.cap,
        city: demolitore.citta,
        province: normalizeProvinciaIt(demolitore.provincia),
      },
      consignee: {
        country: ordine.shippingCountry ?? 'IT',
        postalCode: ordine.shippingPostalCode ?? '',
        city: ordine.shippingCity ?? '',
        province: ordine.shippingProvince ? normalizeProvinciaIt(ordine.shippingProvince) : undefined,
      },
    });
    return NextResponse.json({ quotations });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    console.error('SpediamoPro quotations error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
