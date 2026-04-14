import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import type { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  const marca = (req.nextUrl.searchParams.get('marca') ?? '').trim();
  const annoRaw = req.nextUrl.searchParams.get('anno');
  const anno = annoRaw ? Number(annoRaw) : null;

  if (!marca) return NextResponse.json([]);

  const where: Prisma.ModelloAutoWhereInput = {
    marca: { equals: marca, mode: 'insensitive' },
    ...(anno && Number.isInteger(anno)
      ? {
          annoInizio: { lte: anno },
          OR: [{ annoFine: null }, { annoFine: { gte: anno } }],
        }
      : {}),
  };

  const modelli = await prisma.modelloAuto.findMany({
    where,
    select: { id: true, marca: true, modello: true, serie: true, annoInizio: true, annoFine: true },
    orderBy: [{ modello: 'asc' }, { annoInizio: 'asc' }],
  });

  return NextResponse.json(modelli);
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
