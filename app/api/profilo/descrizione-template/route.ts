import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getSession } from '../../../../lib/session';

const MAX_LEN = 4000;

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  let body: { template?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 });
  }

  const raw = typeof body.template === 'string' ? body.template.trim() : null;
  if (raw && raw.length > MAX_LEN) {
    return NextResponse.json({ error: `Template troppo lungo (max ${MAX_LEN} caratteri)` }, { status: 400 });
  }

  await prisma.demolitore.update({
    where: { id: session.id },
    data: { descrizioneTemplate: raw || null },
  });

  return NextResponse.json({ ok: true });
}
