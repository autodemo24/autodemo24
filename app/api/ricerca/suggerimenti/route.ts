import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) return NextResponse.json({ suggestions: [] });

  const ricambi = await prisma.ricambio.findMany({
    where: {
      pubblicato: true,
      stato: { in: ['DISPONIBILE', 'RISERVATO'] },
      OR: [
        { nome: { contains: q, mode: 'insensitive' } },
        { titolo: { contains: q, mode: 'insensitive' } },
        { marca: { contains: q, mode: 'insensitive' } },
        { modello: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: {
      titolo: true,
      nome: true,
      marca: true,
      modello: true,
      anno: true,
    },
    take: 30,
    orderBy: { id: 'desc' },
  });

  const set = new Set<string>();
  for (const r of ricambi) {
    const base = (r.titolo?.trim() || r.nome).toLowerCase();
    if (base) set.add(base);
    if (r.marca && r.modello) {
      set.add(`${r.nome.toLowerCase()} ${r.marca.toLowerCase()} ${r.modello.toLowerCase()}`);
    }
    if (set.size >= 10) break;
  }

  return NextResponse.json({ suggestions: Array.from(set).slice(0, 10) });
}
