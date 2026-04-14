import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import type { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  const annoRaw = req.nextUrl.searchParams.get('anno');
  const anno = annoRaw ? Number(annoRaw) : null;

  const where: Prisma.ModelloAutoWhereInput | undefined =
    anno && Number.isInteger(anno)
      ? {
          annoInizio: { lte: anno },
          OR: [{ annoFine: null }, { annoFine: { gte: anno } }],
        }
      : undefined;

  const rows = await prisma.modelloAuto.findMany({
    where,
    distinct: ['marca'],
    select: { marca: true },
    orderBy: { marca: 'asc' },
  });
  return NextResponse.json(rows.map((r) => r.marca));
}
