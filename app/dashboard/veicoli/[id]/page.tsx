import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '../../../../lib/session';
import { prisma } from '../../../../lib/prisma';
import VeicoloForm from '../VeicoloForm';
import DashboardShell from '../../../../components/DashboardShell';

export default async function EditVeicoloPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { id } = await params;
  const idNum = Number(id);
  if (isNaN(idNum)) notFound();

  const [veicolo, demolitore] = await Promise.all([
    prisma.veicolo.findUnique({ where: { id: idNum } }),
    prisma.demolitore.findUnique({ where: { id: session.id }, select: { email: true } }),
  ]);

  if (!veicolo || veicolo.demolitoreid !== session.id) notFound();

  return (
    <DashboardShell ragioneSociale={session.ragioneSociale} email={demolitore?.email ?? session.email}>
      <div className="max-w-4xl mx-auto p-4 sm:p-8">
        <div className="mb-6">
          <Link href="/dashboard/veicoli" className="text-xs text-gray-500 hover:text-gray-700">
            ← Torna ai veicoli
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Modifica veicolo</h1>
          <p className="text-gray-500 text-sm mt-1 font-mono">{veicolo.targa}</p>
        </div>

        <VeicoloForm
          mode="edit"
          veicoloId={veicolo.id}
          initial={{
            marca: veicolo.marca,
            modello: veicolo.modello,
            versione: veicolo.versione,
            anno: veicolo.anno,
            targa: veicolo.targa,
            km: veicolo.km,
            cilindrata: veicolo.cilindrata,
            siglaMotore: veicolo.siglaMotore,
            carburante: veicolo.carburante,
            potenzaKw: veicolo.potenzaKw,
          }}
        />
      </div>
    </DashboardShell>
  );
}
