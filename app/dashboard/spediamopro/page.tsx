import { redirect } from 'next/navigation';
import { prisma } from '../../../lib/prisma';
import { getSession } from '../../../lib/session';
import Navbar from '../../../components/Navbar';
import DashboardSidebar from '../../../components/DashboardSidebar';
import SpediamoProPanel from './SpediamoProPanel';

export const dynamic = 'force-dynamic';

export default async function SpediamoProPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const [conn, demolitore] = await Promise.all([
    prisma.spediamoProConnection.findUnique({
      where: { demolitoreid: session.id },
      select: { id: true, environment: true, connectedAt: true },
    }),
    prisma.demolitore.findUnique({ where: { id: session.id }, select: { email: true } }),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="lg:hidden"><Navbar /></div>
      <div className="flex">
        <DashboardSidebar ragioneSociale={session.ragioneSociale} email={demolitore?.email ?? session.email} />
        <main className="ml-0 lg:ml-60 flex-1 p-4 sm:p-8 max-w-3xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Configurazione SpediamoPro</h1>
            <p className="text-gray-500 text-sm mt-1">
              Collega il tuo account SpediamoPro per generare etichette di spedizione direttamente dagli ordini eBay.
            </p>
          </div>

          <SpediamoProPanel
            connection={
              conn
                ? {
                    environment: conn.environment,
                    connectedAt: conn.connectedAt.toISOString(),
                  }
                : null
            }
          />

          <div className="mt-6 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Come ottenere l'Authcode</h2>
            <ol className="space-y-2 text-sm text-gray-700 list-decimal pl-5">
              <li>Accedi al tuo account SpediamoPro</li>
              <li>Vai su <strong>Profilo utente → Accesso API</strong></li>
              <li>Clicca su <strong>"Genera Authcode"</strong> (o copialo se già esiste)</li>
              <li>Incolla l'Authcode nel form qui sopra</li>
            </ol>
            <p className="text-xs text-gray-500 mt-3">
              L'Authcode viene salvato cifrato nel nostro database. Nessuno può vederlo in chiaro.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
