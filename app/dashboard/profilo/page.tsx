import { redirect } from 'next/navigation';
import { getSession } from '../../../lib/session';
import { prisma } from '../../../lib/prisma';
import ProfiloForm from './ProfiloForm';
import DashboardShell from '../../../components/DashboardShell';

export default async function ProfiloPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const demolitore = await prisma.demolitore.findUnique({
    where: { id: session.id },
    select: {
      ragioneSociale: true,
      piva: true,
      email: true,
      telefono: true,
      indirizzo: true,
      cap: true,
      citta: true,
      provincia: true,
      descrizione: true,
    },
  });

  if (!demolitore) redirect('/login');

  return (
    <DashboardShell ragioneSociale={session.ragioneSociale} email={demolitore.email}>
      <div className="max-w-3xl mx-auto p-4 sm:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Il mio profilo</h1>
          <p className="text-gray-500 text-sm mt-1">Modifica i dati della tua azienda visibili sul portale.</p>
        </div>

        <ProfiloForm initial={demolitore} />
      </div>
    </DashboardShell>
  );
}
