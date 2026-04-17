import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '../../../../lib/session';
import { prisma } from '../../../../lib/prisma';
import RicambioForm from '../RicambioForm';

export default async function NuovoRicambioPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const [veicoli, ebayConn] = await Promise.all([
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
      <main>
        <div className="px-4 py-3 bg-white border-b border-gray-200">
          <Link href="/dashboard/ricambi" className="text-xs text-gray-500 hover:text-gray-700">
            ← Torna ai ricambi
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Nuova inserzione ricambio</h1>
        </div>
        <RicambioForm mode="create" veicoliSorgente={veicoli} ebayConnected={ebayConnected} />
      </main>
    </div>
  );
}
