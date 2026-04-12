import { redirect } from 'next/navigation';
import { getSession } from '../../lib/session';
import { prisma } from '../../lib/prisma';
import { getMaxTarga, PIANI, type PianoKey } from '../../lib/piani';
import DashboardSidebar from '../../components/DashboardSidebar';

function inizioMese() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function Dashboard() {
  const session = await getSession();
  if (!session) redirect('/login');

  const [totVeicoli, demolitore, targaMese] = await Promise.all([
    prisma.veicolo.count({ where: { demolitoreid: session.id } }),
    prisma.demolitore.findUnique({ where: { id: session.id }, select: { piano: true, email: true } }),
    prisma.targaLookup.count({ where: { demolitoreid: session.id, createdAt: { gte: inizioMese() } } }),
  ]);

  const piano = (demolitore?.piano ?? 'FREE') as PianoKey;
  const maxTarga = getMaxTarga(piano);
  const pianoInfo = PIANI[piano];

  const cards = [
    {
      title: 'Veicoli pubblicati',
      value: totVeicoli,
      sub: 'nel tuo piazzale',
      href: '/dashboard/veicoli',
      cta: 'Gestisci veicoli',
      icon: (
        <svg className="w-6 h-6 text-[#003580]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM3 5h2l2 7h10l2-7H3z" />
        </svg>
      ),
    },
    {
      title: 'Ricerche targa',
      value: targaMese,
      sub: `di ${maxTarga === Infinity ? '∞' : maxTarga} questo mese`,
      href: '/dashboard/veicoli',
      cta: 'Pubblica veicolo',
      icon: (
        <svg className="w-6 h-6 text-[#003580]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DashboardSidebar ragioneSociale={session.ragioneSociale} email={demolitore?.email ?? session.email} />

      <main className="ml-60 flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Benvenuto, {session.ragioneSociale}</p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
          {cards.map(({ title, value, sub, href, cta, icon }) => (
            <div key={title} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 bg-[#003580]/8 rounded-xl flex items-center justify-center">
                  {icon}
                </div>
              </div>
              <p className="text-3xl font-extrabold text-gray-900 mb-0.5">{value}</p>
              <p className="text-xs text-gray-400 mb-4">{title} · {sub}</p>
              <a href={href}
                className="inline-flex items-center text-xs font-semibold text-[#003580] hover:text-[#003580]/70 transition-colors">
                {cta} →
              </a>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-5">Azioni rapide</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a href="/dashboard/veicoli"
              className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-[#003580]/30 hover:bg-[#003580]/3 transition-all group">
              <div className="w-10 h-10 bg-[#003580]/10 rounded-lg flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-[#003580]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 group-hover:text-[#003580]">Pubblica un veicolo</p>
                <p className="text-xs text-gray-400">Aggiungi un nuovo veicolo al piazzale</p>
              </div>
            </a>
            <a href="/dashboard/profilo"
              className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-[#003580]/30 hover:bg-[#003580]/3 transition-all group">
              <div className="w-10 h-10 bg-[#003580]/10 rounded-lg flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-[#003580]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 group-hover:text-[#003580]">Modifica profilo</p>
                <p className="text-xs text-gray-400">Aggiorna i dati della tua azienda</p>
              </div>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
