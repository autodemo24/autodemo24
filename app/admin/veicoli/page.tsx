import { redirect } from 'next/navigation';
import { getAdminSession } from '../../../lib/admin-session';
import { prisma } from '../../../lib/prisma';
import AdminSidebar from '../../../components/AdminSidebar';
import VeicoliTable from './VeicoliTable';

export default async function AdminVeicoli() {
  const admin = await getAdminSession();
  if (!admin) redirect('/admin/login');

  const veicoli = await prisma.veicolo.findMany({
    select: {
      id: true,
      marca: true,
      modello: true,
      createdAt: true,
      foto: { take: 1, select: { url: true } },
      demolitore: { select: { ragioneSociale: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const rows = veicoli.map((v) => ({
    id: v.id,
    marca: v.marca,
    modello: v.modello,
    demolitore: v.demolitore.ragioneSociale,
    foto: v.foto[0]?.url ?? null,
    createdAt: v.createdAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />

      <main className="ml-60 flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900">Veicoli</h1>
          <p className="text-gray-500 text-sm mt-1">{veicoli.length} veicoli pubblicati</p>
        </div>

        <VeicoliTable rows={rows} />
      </main>
    </div>
  );
}
