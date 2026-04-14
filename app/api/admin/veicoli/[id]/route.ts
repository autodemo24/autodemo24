import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '../../../../../lib/admin-session';
import { prisma } from '../../../../../lib/prisma';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const { id } = await params;
  const veicoloId = Number(id);

  await prisma.$transaction([
    prisma.ricambio.updateMany({ where: { veicoloid: veicoloId }, data: { veicoloid: null } }),
    prisma.fotoVeicolo.deleteMany({ where: { veicoloid: veicoloId } }),
    prisma.veicolo.delete({ where: { id: veicoloId } }),
  ]);

  return NextResponse.json({ ok: true });
}
