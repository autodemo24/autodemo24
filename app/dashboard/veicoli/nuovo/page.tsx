import { redirect } from 'next/navigation';
import { getSession } from '../../../../lib/session';
import { prisma } from '../../../../lib/prisma';
import { getMaxTarga, type PianoKey } from '../../../../lib/piani';
import VeicoloForm from '../VeicoloForm';
import Navbar from '../../../../components/Navbar';
import DashboardSidebar from '../../../../components/DashboardSidebar';

function inizioMese() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function NuovoVeicoloPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const [demolitore, targaMese] = await Promise.all([
    prisma.demolitore.findUnique({
      where: { id: session.id },
      select: { piano: true, email: true },
    }),
    prisma.targaLookup.count({
      where: { demolitoreid: session.id, createdAt: { gte: inizioMese() } },
    }),
  ]);

  const piano = (demolitore?.piano ?? 'FREE') as PianoKey;
  const maxTarga = getMaxTarga(piano);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="lg:hidden">
        <Navbar />
      </div>

      <div className="flex">
        <DashboardSidebar ragioneSociale={session.ragioneSociale} email={demolitore?.email ?? session.email} />

        <main className="ml-0 lg:ml-60 flex-1 p-4 sm:p-8">
          <div className="mb-6">
            <a href="/dashboard/veicoli"
              className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-4">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Torna ai miei veicoli
            </a>
            <h1 className="text-2xl font-bold text-gray-900">Pubblica un nuovo veicolo</h1>
            <p className="text-gray-500 text-sm mt-1">Compila i dati del veicolo e carica le foto</p>
          </div>

          <VeicoloForm targaUsate={targaMese} targaMax={maxTarga} />
        </main>
      </div>
    </div>
  );
}
