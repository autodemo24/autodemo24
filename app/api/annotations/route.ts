import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '../../../lib/session';
import { prisma } from '../../../lib/prisma';

// GET /api/annotations?fotoUrl=... — carica annotazioni di una foto
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const fotoUrl = req.nextUrl.searchParams.get('fotoUrl');
  if (!fotoUrl) return NextResponse.json({ error: 'fotoUrl obbligatorio' }, { status: 400 });

  const annotations = await prisma.aiAnnotation.findMany({
    where: { fotoUrl },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(annotations);
}

// POST /api/annotations — salva annotazioni di una foto (sovrascrive le precedenti)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const body = await req.json();
  const { fotoUrl, annotations } = body as {
    fotoUrl: string;
    annotations: { classe: string; x: number; y: number; w: number; h: number }[];
  };

  if (!fotoUrl || !annotations) {
    return NextResponse.json({ error: 'fotoUrl e annotations obbligatori' }, { status: 400 });
  }

  // Cancella le vecchie annotazioni e salva le nuove
  await prisma.aiAnnotation.deleteMany({ where: { fotoUrl } });

  if (annotations.length > 0) {
    await prisma.aiAnnotation.createMany({
      data: annotations.map((a) => ({
        fotoUrl,
        classe: a.classe,
        x: a.x,
        y: a.y,
        w: a.w,
        h: a.h,
      })),
    });
  }

  return NextResponse.json({ status: 'saved', count: annotations.length });
}
