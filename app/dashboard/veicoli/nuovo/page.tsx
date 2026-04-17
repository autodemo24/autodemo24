import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '../../../../lib/session';
import { prisma } from '../../../../lib/prisma';
import VeicoloForm from '../VeicoloForm';
import DashboardShell from '../../../../components/DashboardShell';

export default async function NuovoVeicoloPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const demolitore = await prisma.demolitore.findUnique({
    where: { id: session.id },
    select: { email: true },
  });

  return (
    <DashboardShell ragioneSociale={session.ragioneSociale} email={demolitore?.email ?? session.email}>
      <div className="max-w-4xl mx-auto p-4 sm:p-8">
        <div className="mb-6">
          <Link href="/dashboard/veicoli" className="text-xs text-gray-500 hover:text-gray-700">
            ← Torna ai veicoli
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Nuovo veicolo sorgente</h1>
          <p className="text-gray-500 text-sm mt-1">
            Registra un&apos;auto in ingresso. I ricambi si collegano a questo veicolo dalla sezione Ricambi.
          </p>
        </div>
        <VeicoloForm mode="create" />
      </div>
    </DashboardShell>
  );
}
