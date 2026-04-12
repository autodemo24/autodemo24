import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '../../../../../lib/admin-session';
import { prisma } from '../../../../../lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const { id } = await params;
  const { attivo } = await req.json();

  await prisma.demolitore.update({
    where: { id: Number(id) },
    data: { attivo: Boolean(attivo) },
  });

  return NextResponse.json({ ok: true });
}
