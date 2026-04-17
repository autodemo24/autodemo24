import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '../../../lib/session';
import { prisma } from '../../../lib/prisma';
import DashboardShell from '../../../components/DashboardShell';
import QrScanner from './QrScanner';

export default async function ScansionaPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const demolitore = await prisma.demolitore.findUnique({
    where: { id: session.id },
    select: { email: true },
  });

  return (
    <DashboardShell ragioneSociale={session.ragioneSociale} email={demolitore?.email ?? session.email}>
      <div className="max-w-3xl mx-auto p-4 sm:p-8">
        <div className="mb-6">
          <Link href="/dashboard/ricambi" className="text-xs text-gray-500 hover:text-gray-700">
            ← Torna ai ricambi
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Scansiona QR</h1>
          <p className="text-gray-500 text-sm mt-1">
            Inquadra l&apos;etichetta QR di un ricambio per aprirlo rapidamente. Usa la fotocamera posteriore del telefono per risultati migliori.
          </p>
        </div>

        <QrScanner />
      </div>
    </DashboardShell>
  );
}
