import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getSession } from '../../../lib/session';
import { generaCodice, generaQrPayload } from '../../../lib/ricambio-codes';
import type { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const marca = url.searchParams.get('marca') ?? undefined;
  const modello = url.searchParams.get('modello') ?? undefined;
  const anno = url.searchParams.get('anno') ? Number(url.searchParams.get('anno')) : undefined;
  const categoria = url.searchParams.get('categoria') ?? undefined;
  const stato = url.searchParams.get('stato') ?? undefined;
  const ubicazione = url.searchParams.get('ubicazione') ?? undefined;
  const provincia = url.searchParams.get('provincia') ?? undefined;
  const q = url.searchParams.get('q') ?? undefined;
  const onlyMine = url.searchParams.get('onlyMine') === '1';

  const session = await getSession();

  const where: Prisma.RicambioWhereInput = {
    ...(onlyMine && session ? { demolitoreid: session.id } : { pubblicato: true }),
    ...(marca && { marca: { contains: marca, mode: 'insensitive' as const } }),
    ...(modello && { modello: { contains: modello, mode: 'insensitive' as const } }),
    ...(anno && { anno }),
    ...(categoria && { categoria }),
    ...(stato && { stato: stato as Prisma.EnumStatoRicambioFilter['equals'] }),
    ...(ubicazione && { ubicazione: { contains: ubicazione, mode: 'insensitive' as const } }),
    ...(provincia && { demolitore: { provincia: { contains: provincia, mode: 'insensitive' as const } } }),
    ...(q && {
      OR: [
        { nome: { contains: q, mode: 'insensitive' as const } },
        { descrizione: { contains: q, mode: 'insensitive' as const } },
        { codice: { contains: q, mode: 'insensitive' as const } },
      ],
    }),
  };

  try {
    const ricambi = await prisma.ricambio.findMany({
      where,
      include: {
        foto: true,
        demolitore: { select: { id: true, ragioneSociale: true, provincia: true } },
      },
      orderBy: { id: 'desc' },
      take: 200,
    });
    return NextResponse.json(ricambi);
  } catch {
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 });
  }

  const {
    nome, categoria, marca, modello, anno,
    descrizione, prezzo, ubicazione, veicoloid, modelloAutoId, fotoUrls,
  } = body as {
    nome: string;
    categoria: string;
    marca: string;
    modello: string;
    anno?: number | null;
    descrizione?: string;
    prezzo: number | string;
    ubicazione: string;
    veicoloid?: number | null;
    modelloAutoId?: number | null;
    fotoUrls?: string[];
  };

  if (!nome?.trim() || !categoria?.trim() || !marca?.trim() || !modello?.trim() || !ubicazione?.trim()) {
    return NextResponse.json({ error: 'Compila tutti i campi obbligatori' }, { status: 400 });
  }

  const prezzoNum = Number(prezzo);
  if (isNaN(prezzoNum) || prezzoNum < 0) {
    return NextResponse.json({ error: 'Prezzo non valido' }, { status: 400 });
  }

  const annoNum = anno ? Number(anno) : null;
  if (annoNum !== null && (isNaN(annoNum) || annoNum < 1900 || annoNum > new Date().getFullYear() + 1)) {
    return NextResponse.json({ error: 'Anno non valido' }, { status: 400 });
  }

  if (veicoloid) {
    const v = await prisma.veicolo.findUnique({ where: { id: Number(veicoloid) }, select: { demolitoreid: true } });
    if (!v || v.demolitoreid !== session.id) {
      return NextResponse.json({ error: 'Veicolo sorgente non valido' }, { status: 400 });
    }
  }

  if (modelloAutoId) {
    const m = await prisma.modelloAuto.findUnique({ where: { id: Number(modelloAutoId) }, select: { id: true } });
    if (!m) {
      return NextResponse.json({ error: 'Modello del catalogo non valido' }, { status: 400 });
    }
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      const tmp = await tx.ricambio.create({
        data: {
          codice: `TMP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          qrPayload: `TMP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          nome: nome.trim(),
          categoria: categoria.trim(),
          marca: marca.trim(),
          modello: modello.trim(),
          anno: annoNum,
          descrizione: descrizione?.trim() || null,
          prezzo: prezzoNum,
          ubicazione: ubicazione.trim().toUpperCase(),
          demolitoreid: session.id,
          veicoloid: veicoloid ? Number(veicoloid) : null,
          modelloAutoId: modelloAutoId ? Number(modelloAutoId) : null,
          foto: fotoUrls && fotoUrls.length > 0
            ? { create: fotoUrls.map((url, i) => ({ url, copertina: i === 0 })) }
            : undefined,
        },
      });
      const codice = generaCodice(tmp.id);
      const qrPayload = generaQrPayload(tmp.id, codice, session.id);
      return tx.ricambio.update({
        where: { id: tmp.id },
        data: { codice, qrPayload },
        include: { foto: true },
      });
    });

    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Errore del server. Riprova più tardi.' }, { status: 500 });
  }
}
