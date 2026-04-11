import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getSession } from '../../../lib/session';
import type { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const marca = url.searchParams.get('marca') ?? undefined;
  const modello = url.searchParams.get('modello') ?? undefined;
  const anno = url.searchParams.get('anno') ? Number(url.searchParams.get('anno')) : undefined;
  const provincia = url.searchParams.get('provincia') ?? undefined;

  const where: Prisma.VeicoloWhereInput = {};
  if (marca) where.marca = { contains: marca, mode: 'insensitive' };
  if (modello) where.modello = { contains: modello, mode: 'insensitive' };
  if (anno) where.anno = anno;
  if (provincia) where.demolitore = { provincia: { contains: provincia, mode: 'insensitive' } };

  try {
    const veicoli = await prisma.veicolo.findMany({
      where,
      include: {
        foto: true,
        ricambi: true,
        demolitore: { select: { id: true, ragioneSociale: true, provincia: true } },
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
  if (!session) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 });
  }

  const { marca, modello, anno, targa, km, ricambi, fotoUrls } = body as {
    marca: string;
    modello: string;
    anno: number;
    targa: string;
    km: number;
    ricambi?: string[];
    fotoUrls?: string[];
  };

  if (!marca?.trim() || !modello?.trim() || !anno || !targa?.trim() || !km) {
    return NextResponse.json({ error: 'Tutti i campi obbligatori devono essere compilati' }, { status: 400 });
  }

  const targaNormalizzata = targa.trim().toUpperCase();
  if (!/^[A-Z]{2}\d{3}[A-Z]{2}$/.test(targaNormalizzata)) {
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
        targa: targaNormalizzata,
        km: kmNum,
        demolitoreid: session.id,
        ricambi: {
          create: (ricambi ?? []).map((nome) => ({ nome, disponibile: true })),
        },
        foto: fotoUrls && fotoUrls.length > 0
          ? { create: fotoUrls.map((url) => ({ url })) }
          : undefined,
      },
      include: { ricambi: true, foto: true },
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
