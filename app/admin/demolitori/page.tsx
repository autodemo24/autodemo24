import { redirect } from 'next/navigation';
import { getAdminSession } from '../../../lib/admin-session';
import { prisma } from '../../../lib/prisma';
import { PIANI, type PianoKey } from '../../../lib/piani';
import AdminSidebar from '../../../components/AdminSidebar';
import DemolitoriTable from './DemolitoriTable';

export default async function AdminDemolitori() {
  const admin = await getAdminSession();
  if (!admin) redirect('/admin/login');

  const demolitori = await prisma.demolitore.findMany({
    select: {
      id: true,
      ragioneSociale: true,
      email: true,
      provincia: true,
      piano: true,
      attivo: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const rows = demolitori.map((d) => ({
    ...d,
    pianoLabel: PIANI[d.piano as PianoKey]?.label ?? d.piano,
    createdAt: d.createdAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />

      <main className="ml-60 flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900">Demolitori</h1>
          <p className="text-gray-500 text-sm mt-1">{demolitori.length} demolitori registrati</p>
        </div>

        <DemolitoriTable rows={rows} />
      </main>
    </div>
  );
}
