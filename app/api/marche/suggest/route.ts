import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getSession } from '../../../../lib/session';

// POST /api/marche/suggest
// Aggiunge un ModelloAuto non verificato a partire da un suggerimento runtime
// (tipicamente da CarQuery lato client, quando l'utente inserisce una
// marca/modello non presente nel catalogo curato).
//
// Il record viene creato con verified=false per permettere all'admin di
// validare periodicamente le aggiunte.
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  let body: { marca?: string; modello?: string; anno?: number };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 });
  }

  const marca = (body.marca ?? '').trim();
  const modello = (body.modello ?? '').trim();
  const anno = Number.isInteger(body.anno) ? Number(body.anno) : null;

  if (!marca || !modello) {
    return NextResponse.json({ error: 'Marca e modello sono obbligatori' }, { status: 400 });
  }

  const annoInizio = anno ?? new Date().getFullYear();

  const existing = await prisma.modelloAuto.findFirst({
    where: { marca, modello, serie: null, annoInizio },
    select: { id: true, sources: true },
  });

  if (existing) {
    const nuove = ['carquery', 'user'].filter((s) => !existing.sources.includes(s));
    if (nuove.length > 0) {
      await prisma.modelloAuto.update({
        where: { id: existing.id },
        data: { sources: { set: [...existing.sources, ...nuove] } },
      });
    }
    return NextResponse.json({ id: existing.id, created: false });
  }

  const created = await prisma.modelloAuto.create({
    data: {
      marca,
      modello,
      serie: null,
      annoInizio,
      annoFine: null,
      sources: ['carquery', 'user'],
      verified: false,
    },
    select: { id: true },
  });

  return NextResponse.json({ id: created.id, created: true });
}
