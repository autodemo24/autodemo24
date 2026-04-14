import { NextResponse } from 'next/server';
import { getSession } from '../../../../lib/session';
import { prisma } from '../../../../lib/prisma';
import { RICAMBI_GRUPPI } from '../../../../lib/ricambi';

// Genera lista classi nello stesso ordine del tool di annotazione
function vocaToId(voce: string): string {
  return voce.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
}

const CLASS_NAMES = RICAMBI_GRUPPI.flatMap((g) => g.voci.map(vocaToId));

// GET /api/annotations/export — esporta tutte le annotazioni in formato YOLO
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const all = await (prisma as any).aiAnnotation.findMany({ orderBy: { fotoUrl: 'asc' } }) as {
    fotoUrl: string; classe: string; x: number; y: number; w: number; h: number;
  }[];

  // Raggruppa per foto
  const byFoto = new Map<string, typeof all>();
  for (const a of all) {
    const list = byFoto.get(a.fotoUrl) ?? [];
    list.push(a);
    byFoto.set(a.fotoUrl, list);
  }

  // Genera output YOLO
  const files: { fotoUrl: string; yoloTxt: string }[] = [];
  for (const [fotoUrl, anns] of byFoto) {
    const lines = anns
      .map((a) => {
        const classId = CLASS_NAMES.indexOf(a.classe);
        if (classId === -1) return null;
        const xCenter = a.x + a.w / 2;
        const yCenter = a.y + a.h / 2;
        return `${classId} ${xCenter.toFixed(6)} ${yCenter.toFixed(6)} ${a.w.toFixed(6)} ${a.h.toFixed(6)}`;
      })
      .filter(Boolean);
    files.push({ fotoUrl, yoloTxt: lines.join('\n') });
  }

  return NextResponse.json({
    totalPhotos: byFoto.size,
    totalAnnotations: all.length,
    totalClasses: CLASS_NAMES.length,
    classNames: CLASS_NAMES,
    files,
  });
}
