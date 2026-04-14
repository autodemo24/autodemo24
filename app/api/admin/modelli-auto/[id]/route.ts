import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '../../../../../lib/admin-session';
import { prisma } from '../../../../../lib/prisma';

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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const { id } = await params;
  const idNum = Number(id);
  if (!Number.isInteger(idNum)) return NextResponse.json({ error: 'ID non valido' }, { status: 400 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 }); }

  const v = validateBody(body);
  if ('error' in v) return NextResponse.json(v, { status: 400 });

  try {
    await prisma.modelloAuto.update({ where: { id: idNum }, data: v });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === 'P2002') {
      return NextResponse.json({ error: 'Modello duplicato (stessa marca, modello, serie e anno inizio)' }, { status: 409 });
    }
    if (code === 'P2025') {
      return NextResponse.json({ error: 'Modello non trovato' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const { id } = await params;
  const idNum = Number(id);
  if (!Number.isInteger(idNum)) return NextResponse.json({ error: 'ID non valido' }, { status: 400 });

  try {
    // FK su Ricambio è onDelete: SetNull → cancellazione consentita
    await prisma.modelloAuto.delete({ where: { id: idNum } });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === 'P2025') {
      return NextResponse.json({ error: 'Modello non trovato' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}
