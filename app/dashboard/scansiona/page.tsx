import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '../../../lib/session';
import { prisma } from '../../../lib/prisma';
import Navbar from '../../../components/Navbar';
import DashboardSidebar from '../../../components/DashboardSidebar';
import QrScanner from './QrScanner';

export default async function ScansionaPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const demolitore = await prisma.demolitore.findUnique({
    where: { id: session.id },
    select: { email: true },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="lg:hidden"><Navbar /></div>
      <div className="flex">
        <DashboardSidebar ragioneSociale={session.ragioneSociale} email={demolitore?.email ?? session.email} />
        <main className="ml-0 lg:ml-60 flex-1 p-4 sm:p-8 max-w-3xl">
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
        </main>
      </div>
    </div>
  );
}
