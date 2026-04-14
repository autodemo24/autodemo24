import { redirect, notFound } from 'next/navigation';
import { prisma } from '../../../lib/prisma';

export default async function VeicoloRedirectPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idNum = Number(id);
  if (isNaN(idNum)) notFound();

  const veicolo = await prisma.veicolo.findUnique({
    where: { id: idNum },
    select: { marca: true, modello: true },
  });
  if (!veicolo) notFound();

  const params2 = new URLSearchParams({ marca: veicolo.marca, modello: veicolo.modello });
  redirect(`/ricambi?${params2.toString()}`);
}
