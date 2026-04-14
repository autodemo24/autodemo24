import { redirect } from 'next/navigation';
import { getSession } from '../../../lib/session';
import { prisma } from '../../../lib/prisma';
import VeicoliView from './VeicoliView';
import Navbar from '../../../components/Navbar';
import DashboardSidebar from '../../../components/DashboardSidebar';

export default async function VeicoliPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const [veicoli, demolitore] = await Promise.all([
    prisma.veicolo.findMany({
      where: { demolitoreid: session.id },
      include: { _count: { select: { ricambi: true } } },
      orderBy: { id: 'desc' },
    }),
    prisma.demolitore.findUnique({
      where: { id: session.id },
      select: { email: true },
    }),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="lg:hidden">
        <Navbar />
      </div>

      <div className="flex">
        <DashboardSidebar ragioneSociale={session.ragioneSociale} email={demolitore?.email ?? session.email} />

        <main className="ml-0 lg:ml-60 flex-1 p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Veicoli sorgente</h1>
              <p className="text-gray-500 text-sm mt-1">
                Registra le auto in ingresso per tracciare la provenienza dei ricambi. La vendita avviene a livello di singolo ricambio.
              </p>
            </div>
            <a href="/dashboard/veicoli/nuovo"
              className="flex items-center gap-2 px-5 py-2.5 bg-[#003580] hover:bg-[#002560] text-white rounded-lg text-sm font-semibold transition-colors shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Nuovo veicolo
            </a>
          </div>

          <VeicoliView veicoli={veicoli} />
        </main>
      </div>
    </div>
  );
}
