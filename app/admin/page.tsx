import { redirect } from 'next/navigation';
import { getAdminSession } from '../../lib/admin-session';
import { prisma } from '../../lib/prisma';
import { PIANI, type PianoKey } from '../../lib/piani';
import AdminSidebar from '../../components/AdminSidebar';

export default async function AdminDashboard() {
  const admin = await getAdminSession();
  if (!admin) redirect('/admin/login');

  const [totDemolitori, totVeicoli, demolitori] = await Promise.all([
    prisma.demolitore.count(),
    prisma.veicolo.count(),
    prisma.demolitore.findMany({ select: { piano: true } }),
  ]);

  const abbonamentiAttivi = demolitori.filter((d) => d.piano !== 'FREE').length;

  // Calcolo entrate mensili stimate
  const entrateMensili = demolitori.reduce((acc, d) => {
    const piano = d.piano as PianoKey;
    return acc + (PIANI[piano]?.prezzo ?? 0);
  }, 0);

  const cards = [
    {
      title: 'Demolitori registrati',
      value: totDemolitori,
      color: 'bg-[#003580]',
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      title: 'Veicoli pubblicati',
      value: totVeicoli,
      color: 'bg-[#003580]',
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM3 5h2l2 7h10l2-7H3z" />
        </svg>
      ),
    },
    {
      title: 'Abbonamenti attivi',
      value: abbonamentiAttivi,
      color: 'bg-[#FF6600]',
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'Entrate mensili stimate',
      value: `€${entrateMensili.toFixed(2).replace('.', ',')}`,
      color: 'bg-[#FF6600]',
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />

      <main className="ml-60 flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900">Dashboard Admin</h1>
          <p className="text-gray-500 text-sm mt-1">Panoramica generale della piattaforma</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map(({ title, value, color, icon }) => (
            <div key={title} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-4`}>
                {icon}
              </div>
              <p className="text-3xl font-extrabold text-gray-900 mb-1">{value}</p>
              <p className="text-sm text-gray-500">{title}</p>
            </div>
          ))}
        </div>

        {/* Piano breakdown */}
        <div className="mt-8 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-5">
            Distribuzione abbonamenti
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {(Object.keys(PIANI) as PianoKey[]).map((key) => {
              const count = demolitori.filter((d) => d.piano === key).length;
              return (
                <div key={key} className="text-center p-4 rounded-xl bg-gray-50">
                  <p className="text-2xl font-extrabold text-gray-900">{count}</p>
                  <p className="text-xs text-gray-500 mt-1 font-semibold">{PIANI[key].label}</p>
                  <p className="text-xs text-gray-400">
                    {PIANI[key].prezzo === 0 ? 'Gratuito' : `€${PIANI[key].prezzo}/mese`}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
