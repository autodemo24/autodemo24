import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getSession } from '../../../../lib/session';
import { parseQrPayload } from '../../../../lib/ricambio-codes';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  let body: { payload?: string; codice?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 }); }

  let id: number | null = null;
  if (body.payload) {
    const parsed = parseQrPayload(body.payload);
    if (parsed) id = parsed.id;
  }

  const ricambio = id
    ? await prisma.ricambio.findUnique({ where: { id } })
    : body.codice
      ? await prisma.ricambio.findUnique({ where: { codice: body.codice.trim().toUpperCase() } })
      : null;

  if (!ricambio) return NextResponse.json({ error: 'Ricambio non trovato' }, { status: 404 });
  if (ricambio.demolitoreid !== session.id) {
    return NextResponse.json({ error: 'Ricambio di un altro demolitore' }, { status: 403 });
  }

  return NextResponse.json({ id: ricambio.id, codice: ricambio.codice });
}
