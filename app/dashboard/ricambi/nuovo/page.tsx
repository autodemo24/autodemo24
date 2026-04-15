import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '../../../../lib/session';
import { prisma } from '../../../../lib/prisma';
import Navbar from '../../../../components/Navbar';
import DashboardSidebar from '../../../../components/DashboardSidebar';
import RicambioForm from '../RicambioForm';

export default async function NuovoRicambioPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const [demolitore, veicoli, ebayConn] = await Promise.all([
    prisma.demolitore.findUnique({ where: { id: session.id }, select: { email: true } }),
    prisma.veicolo.findMany({
      where: { demolitoreid: session.id },
      select: { id: true, marca: true, modello: true, anno: true, targa: true },
      orderBy: { id: 'desc' },
    }),
    prisma.ebayConnection.findUnique({
      where: { demolitoreid: session.id },
      select: { refreshExpiresAt: true },
    }),
  ]);
  const ebayConnected = !!ebayConn && ebayConn.refreshExpiresAt.getTime() > Date.now();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="lg:hidden"><Navbar /></div>
      <div className="flex">
        <DashboardSidebar ragioneSociale={session.ragioneSociale} email={demolitore?.email ?? session.email} />
        <main className="ml-0 lg:ml-60 flex-1 p-4 sm:p-8 max-w-4xl">
          <div className="mb-6">
            <Link href="/dashboard/ricambi" className="text-xs text-gray-500 hover:text-gray-700">
              ← Torna ai ricambi
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">Nuovo ricambio</h1>
            <p className="text-gray-500 text-sm mt-1">
              Inserisci un singolo ricambio. Il codice QR verrà generato automaticamente dopo il salvataggio.
            </p>
          </div>
          <RicambioForm mode="create" veicoliSorgente={veicoli} ebayConnected={ebayConnected} />
        </main>
      </div>
    </div>
  );
}
