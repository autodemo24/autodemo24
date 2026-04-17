import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '../../../../lib/session';
import { prisma } from '../../../../lib/prisma';
import FormShell from '../../../../components/FormShell';
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
    <FormShell
      ragioneSociale={session.ragioneSociale}
      email={demolitore?.email ?? session.email}
      headerLeft={
        <Link href="/dashboard/ricambi" className="text-xs text-gray-500 hover:text-gray-700">
          ← Torna ai ricambi
        </Link>
      }
      headerTitle={<h1 className="text-xl font-bold text-gray-900">Nuova inserzione ricambio</h1>}
    >
      <RicambioForm mode="create" veicoliSorgente={veicoli} ebayConnected={ebayConnected} />
    </FormShell>
  );
}
