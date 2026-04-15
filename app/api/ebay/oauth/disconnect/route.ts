import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { getSession } from '../../../../../lib/session';

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  await prisma.ebayConnection.deleteMany({ where: { demolitoreid: session.id } });

  return NextResponse.json({ ok: true });
}
