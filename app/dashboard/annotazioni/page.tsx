import { redirect } from 'next/navigation';
import { getSession } from '../../../lib/session';
import { prisma } from '../../../lib/prisma';
import DashboardSidebar from '../../../components/DashboardSidebar';
import Navbar from '../../../components/Navbar';
import AnnotationTool from './AnnotationTool';

export default async function AnnotazioniPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const demolitore = await prisma.demolitore.findUnique({
    where: { id: session.id },
    select: { ragioneSociale: true, email: true },
  });
  if (!demolitore) redirect('/login');

  // Carica tutte le foto dei veicoli di questo demolitore
  const veicoli = await prisma.veicolo.findMany({
    where: { demolitoreid: session.id },
    select: {
      id: true,
      marca: true,
      modello: true,
      anno: true,
      targa: true,
      foto: { select: { id: true, url: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Conta annotazioni per foto
  const countMap = new Map<string, number>();
  try {
    const allFotoUrls = veicoli.flatMap((v) => v.foto.map((f) => f.url));
    if (allFotoUrls.length > 0) {
      const allAnnotations = await (prisma as any).aiAnnotation.findMany({
        where: { fotoUrl: { in: allFotoUrls } },
        select: { fotoUrl: true },
      }) as { fotoUrl: string }[];
      for (const a of allAnnotations) {
        countMap.set(a.fotoUrl, (countMap.get(a.fotoUrl) ?? 0) + 1);
      }
    }
  } catch {
    // Modello non ancora disponibile — ignora
  }

  const fotoList = veicoli.flatMap((v) =>
    v.foto.map((f) => ({
      url: f.url,
      veicolo: `${v.marca} ${v.modello} (${v.anno})`,
      targa: v.targa,
      annotazioni: countMap.get(f.url) ?? 0,
    }))
  );

  // Statistiche
  const totalFoto = fotoList.length;
  const fotoAnnotate = fotoList.filter((f) => f.annotazioni > 0).length;
  const totalAnnotazioni = fotoList.reduce((sum, f) => sum + f.annotazioni, 0);

  return (
    <>
      <Navbar />
      <DashboardSidebar ragioneSociale={demolitore.ragioneSociale} email={demolitore.email} />
      <main className="lg:ml-60 min-h-screen bg-gray-50">
        <div className="p-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-base font-bold text-gray-800">Training AI</h1>
            <div className="flex gap-2 text-xs">
              <span className="px-2 py-1 bg-white rounded shadow-sm font-semibold text-[#003580]">{fotoAnnotate}/{totalFoto} foto</span>
              <span className="px-2 py-1 bg-white rounded shadow-sm font-semibold text-[#FF6600]">{totalAnnotazioni} annotazioni</span>
            </div>
          </div>
          <AnnotationTool fotos={fotoList} totalAnnotazioni={totalAnnotazioni} />
        </div>
      </main>
    </>
  );
}
