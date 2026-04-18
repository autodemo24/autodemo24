import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '../../../../lib/prisma';
import { getSession } from '../../../../lib/session';
import DashboardShell from '../../../../components/DashboardShell';
import ImportWizard from './ImportWizard';

export default async function ImportPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const [connection, demolitore] = await Promise.all([
    prisma.ebayConnection.findUnique({
      where: { demolitoreid: session.id },
      select: { id: true, ebayUserId: true, environment: true, refreshExpiresAt: true },
    }),
    prisma.demolitore.findUnique({
      where: { id: session.id },
      select: { email: true },
    }),
  ]);

  const refreshExpired = connection ? connection.refreshExpiresAt.getTime() < Date.now() : false;
  const connected = connection && !refreshExpired;

  return (
    <DashboardShell ragioneSociale={session.ragioneSociale} email={demolitore?.email ?? session.email}>
      <div className="max-w-7xl mx-auto p-4 sm:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Importa inserzioni da eBay</h1>
            <p className="text-sm text-gray-600 mt-1">
              Scarica nel tuo magazzino Autigo le inserzioni del tuo account eBay.
              Le foto vengono copiate su Autigo, l&apos;ubicazione viene impostata su{' '}
              <span className="font-semibold">DA ASSEGNARE</span> e potrai completarla dopo.
            </p>
          </div>

          {!connected ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6">
              <h2 className="text-lg font-semibold text-red-900">eBay non collegato</h2>
              <p className="text-sm text-red-800 mt-1">
                {refreshExpired
                  ? 'Il token è scaduto. Ricollega il tuo account per procedere con l\'import.'
                  : 'Collega prima il tuo account eBay per importare le inserzioni.'}
              </p>
              <Link
                href="/dashboard/ebay"
                className="inline-flex items-center gap-2 mt-4 px-4 h-10 rounded-lg bg-[#0073E6] hover:bg-[#005bb8] text-white text-sm font-semibold transition-colors"
              >
                Vai alla configurazione eBay
              </Link>
            </div>
          ) : (
            <ImportWizard ebayUserId={connection.ebayUserId ?? '(utente eBay)'} environment={connection.environment} />
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
