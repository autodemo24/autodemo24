import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getSession } from '../../../lib/session';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const url = new URL(request.url);
  const onlyMine = url.searchParams.get('onlyMine') !== '0';

  try {
    const veicoli = await prisma.veicolo.findMany({
      where: onlyMine ? { demolitoreid: session.id } : {},
      include: {
        _count: { select: { ricambi: true } },
      },
      orderBy: { id: 'desc' },
    });
    return NextResponse.json(veicoli);
  } catch {
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 }); }

  const { marca, modello, anno, targa, km, versione, cilindrata, siglaMotore, carburante, potenzaKw } = body as {
    marca: string; modello: string; anno: number; targa: string; km: number;
    versione?: string | null; cilindrata?: string | null; siglaMotore?: string | null;
    carburante?: string | null; potenzaKw?: number | null;
  };

  if (!marca?.trim() || !modello?.trim() || !anno || !targa?.trim() || km === undefined) {
    return NextResponse.json({ error: 'Tutti i campi obbligatori devono essere compilati' }, { status: 400 });
  }

  const targaNorm = targa.trim().toUpperCase();
  if (!/^[A-Z]{2}\d{3}[A-Z]{2}$/.test(targaNorm)) {
    return NextResponse.json({ error: 'Formato targa non valido (es. AB123CD)' }, { status: 400 });
  }

  const annoNum = Number(anno);
  if (isNaN(annoNum) || annoNum < 1900 || annoNum > new Date().getFullYear() + 1) {
    return NextResponse.json({ error: 'Anno non valido' }, { status: 400 });
  }

  const kmNum = Number(km);
  if (isNaN(kmNum) || kmNum < 0) {
    return NextResponse.json({ error: 'Chilometraggio non valido' }, { status: 400 });
  }

  try {
    const veicolo = await prisma.veicolo.create({
      data: {
        marca: marca.trim(),
        modello: modello.trim(),
        anno: annoNum,
        targa: targaNorm,
        km: kmNum,
        versione: versione?.trim() || null,
        cilindrata: cilindrata?.trim() || null,
        siglaMotore: siglaMotore?.trim() || null,
        carburante: carburante?.trim() || null,
        potenzaKw: potenzaKw ?? null,
        demolitoreid: session.id,
      },
    });
    return NextResponse.json(veicolo, { status: 201 });
  } catch (err: unknown) {
    const prismaErr = err as { code?: string };
    if (prismaErr?.code === 'P2002') {
      return NextResponse.json({ error: 'Targa già presente nel sistema' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Errore del server. Riprova più tardi.' }, { status: 500 });
  }
}
