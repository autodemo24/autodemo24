import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '../../../../lib/session';
import { prisma } from '../../../../lib/prisma';
import Navbar from '../../../../components/Navbar';
import DashboardSidebar from '../../../../components/DashboardSidebar';
import RicambioForm from '../RicambioForm';

export default async function EditRicambioPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { id } = await params;
  const idNum = Number(id);
  if (isNaN(idNum)) notFound();

  const [ricambio, demolitore, veicoli] = await Promise.all([
    prisma.ricambio.findUnique({
      where: { id: idNum },
      include: { foto: { orderBy: { copertina: 'desc' } } },
    }),
    prisma.demolitore.findUnique({ where: { id: session.id }, select: { email: true } }),
    prisma.veicolo.findMany({
      where: { demolitoreid: session.id },
      select: { id: true, marca: true, modello: true, anno: true, targa: true },
      orderBy: { id: 'desc' },
    }),
  ]);

  if (!ricambio || ricambio.demolitoreid !== session.id) notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="lg:hidden"><Navbar /></div>
      <div className="flex">
        <DashboardSidebar ragioneSociale={session.ragioneSociale} email={demolitore?.email ?? session.email} />
        <main className="ml-0 lg:ml-60 flex-1 p-4 sm:p-8 max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Link href="/dashboard/ricambi" className="text-xs text-gray-500 hover:text-gray-700">
                ← Torna ai ricambi
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 mt-1">Modifica ricambio</h1>
              <p className="text-gray-500 text-sm mt-1 font-mono">{ricambio.codice}</p>
            </div>
            <Link href={`/dashboard/ricambi/${ricambio.id}/qr`}
              className="px-4 py-2 border border-gray-300 text-gray-700 hover:text-[#003580] hover:border-[#003580] rounded-lg text-sm font-semibold">
              Stampa QR
            </Link>
          </div>

          <RicambioForm
            mode="edit"
            ricambioId={ricambio.id}
            initial={{
              nome: ricambio.nome,
              categoria: ricambio.categoria,
              marca: ricambio.marca,
              modello: ricambio.modello,
              anno: ricambio.anno,
              descrizione: ricambio.descrizione,
              prezzo: ricambio.prezzo.toString(),
              ubicazione: ricambio.ubicazione,
              stato: ricambio.stato,
              pubblicato: ricambio.pubblicato,
              veicoloid: ricambio.veicoloid,
              modelloAutoId: ricambio.modelloAutoId,
              foto: ricambio.foto.map((f) => ({ id: f.id, url: f.url, copertina: f.copertina })),
            }}
            veicoliSorgente={veicoli}
          />
        </main>
      </div>
    </div>
  );
}
