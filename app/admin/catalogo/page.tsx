import { redirect } from 'next/navigation';
import { getAdminSession } from '../../../lib/admin-session';
import { prisma } from '../../../lib/prisma';
import AdminSidebar from '../../../components/AdminSidebar';
import CatalogoTable from './CatalogoTable';

export const dynamic = 'force-dynamic';

export default async function AdminCatalogoPage() {
  const admin = await getAdminSession();
  if (!admin) redirect('/admin/login');

  const modelli = await prisma.modelloAuto.findMany({
    orderBy: [{ marca: 'asc' }, { modello: 'asc' }, { annoInizio: 'asc' }],
    include: { _count: { select: { ricambi: true } } },
  });

  const rows = modelli.map((m) => ({
    id: m.id,
    marca: m.marca,
    modello: m.modello,
    serie: m.serie,
    annoInizio: m.annoInizio,
    annoFine: m.annoFine,
    ricambiCount: m._count.ricambi,
  }));

  const marche = Array.from(new Set(rows.map((r) => r.marca))).sort();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />

      <main className="ml-60 flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900">Catalogo modelli auto</h1>
          <p className="text-gray-500 text-sm mt-1">
            {rows.length === 0
              ? 'Nessun modello in catalogo. Inseriscine uno per cominciare.'
              : `${rows.length} modelli in catalogo · ${marche.length} marche`}
          </p>
        </div>

        <CatalogoTable rows={rows} marche={marche} />
      </main>
    </div>
  );
}
