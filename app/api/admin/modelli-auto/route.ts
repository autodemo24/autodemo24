import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '../../../../lib/admin-session';
import { prisma } from '../../../../lib/prisma';

const ANNO_MIN = 1900;
const ANNO_MAX = new Date().getFullYear() + 1;

function validateBody(body: Record<string, unknown>): { error: string } | {
  marca: string; modello: string; serie: string | null; annoInizio: number; annoFine: number | null;
} {
  const marca = typeof body.marca === 'string' ? body.marca.trim() : '';
  const modello = typeof body.modello === 'string' ? body.modello.trim() : '';
  const serieRaw = typeof body.serie === 'string' ? body.serie.trim() : '';
  const serie = serieRaw === '' ? null : serieRaw;
  const annoInizio = Number(body.annoInizio);
  const annoFineRaw = body.annoFine;
  const annoFine = annoFineRaw === null || annoFineRaw === undefined || annoFineRaw === ''
    ? null
    : Number(annoFineRaw);

  if (!marca || marca.length > 80) return { error: 'Marca obbligatoria (max 80 caratteri)' };
  if (!modello || modello.length > 80) return { error: 'Modello obbligatorio (max 80 caratteri)' };
  if (serie && serie.length > 60) return { error: 'Serie max 60 caratteri' };
  if (!Number.isInteger(annoInizio) || annoInizio < ANNO_MIN || annoInizio > ANNO_MAX) {
    return { error: `Anno inizio non valido (${ANNO_MIN}-${ANNO_MAX})` };
  }
  if (annoFine !== null) {
    if (!Number.isInteger(annoFine) || annoFine < annoInizio || annoFine > ANNO_MAX) {
      return { error: 'Anno fine non valido (deve essere ≥ anno inizio)' };
    }
  }

  return { marca, modello, serie, annoInizio, annoFine };
}

export async function GET(_req: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const modelli = await prisma.modelloAuto.findMany({
    orderBy: [{ marca: 'asc' }, { modello: 'asc' }, { annoInizio: 'asc' }],
    include: { _count: { select: { ricambi: true } } },
  });

  return NextResponse.json(modelli);
}

export async function POST(req: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 }); }

  const v = validateBody(body);
  if ('error' in v) return NextResponse.json(v, { status: 400 });

  try {
    const created = await prisma.modelloAuto.create({ data: v });
    return NextResponse.json(created, { status: 201 });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === 'P2002') {
      return NextResponse.json({ error: 'Modello duplicato (stessa marca, modello, serie e anno inizio)' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}
