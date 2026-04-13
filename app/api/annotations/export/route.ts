import { NextResponse } from 'next/server';
import { getSession } from '../../../../lib/session';
import { prisma } from '../../../../lib/prisma';

const CLASS_NAMES = [
  'faro_ant_sx', 'faro_ant_dx', 'parafango_ant_sx', 'parafango_ant_dx',
  'paraurti_ant', 'paraurti_post', 'cofano', 'portiera_ant_sx',
  'portiera_ant_dx', 'specchietto_sx',
];

// GET /api/annotations/export — esporta tutte le annotazioni in formato YOLO
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const all = await prisma.aiAnnotation.findMany({ orderBy: { fotoUrl: 'asc' } });

  // Raggruppa per foto
  const byFoto = new Map<string, typeof all>();
  for (const a of all) {
    const list = byFoto.get(a.fotoUrl) ?? [];
    list.push(a);
    byFoto.set(a.fotoUrl, list);
  }

  // Genera output YOLO: ogni foto produce un .txt con righe "class_id x_center y_center w h"
  const files: { fotoUrl: string; yoloTxt: string }[] = [];
  for (const [fotoUrl, anns] of byFoto) {
    const lines = anns
      .map((a) => {
        const classId = CLASS_NAMES.indexOf(a.classe);
        if (classId === -1) return null;
        // Converti da x,y,w,h (top-left) a x_center,y_center,w,h (YOLO format)
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
    classNames: CLASS_NAMES,
    files,
  });
}
