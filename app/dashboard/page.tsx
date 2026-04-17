import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '../../lib/session';
import { prisma } from '../../lib/prisma';
import DashboardShell from '../../components/DashboardShell';

export default async function Dashboard() {
  const session = await getSession();
  if (!session) redirect('/login');

  const [totDisponibili, totVenduti, totRiservati, totVeicoli, demolitore] = await Promise.all([
    prisma.ricambio.count({ where: { demolitoreid: session.id, stato: 'DISPONIBILE' } }),
    prisma.ricambio.count({ where: { demolitoreid: session.id, stato: 'VENDUTO' } }),
    prisma.ricambio.count({ where: { demolitoreid: session.id, stato: 'RISERVATO' } }),
    prisma.veicolo.count({ where: { demolitoreid: session.id } }),
    prisma.demolitore.findUnique({ where: { id: session.id }, select: { email: true } }),
  ]);

  const cards = [
    {
      title: 'Ricambi disponibili',
      value: totDisponibili,
      sub: 'in vendita ora',
      href: '/dashboard/ricambi?stato=DISPONIBILE',
      cta: 'Vedi disponibili',
      color: 'bg-green-100 text-green-800',
    },
    {
      title: 'Ricambi riservati',
      value: totRiservati,
      sub: 'in attesa di consegna',
      href: '/dashboard/ricambi?stato=RISERVATO',
      cta: 'Gestisci riservati',
      color: 'bg-yellow-100 text-yellow-800',
    },
    {
      title: 'Ricambi venduti',
      value: totVenduti,
      sub: 'cronologia vendite',
      href: '/dashboard/ricambi?stato=VENDUTO',
      cta: 'Storico vendite',
      color: 'bg-gray-200 text-gray-700',
    },
    {
      title: 'Veicoli sorgente',
      value: totVeicoli,
      sub: 'auto registrate',
      href: '/dashboard/veicoli',
      cta: 'Gestisci veicoli',
      color: 'bg-blue-100 text-blue-800',
    },
  ];

  return (
    <DashboardShell ragioneSociale={session.ragioneSociale} email={demolitore?.email ?? session.email}>
      <div className="max-w-7xl mx-auto p-4 sm:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Panoramica</h1>
          <p className="text-gray-500 text-sm mt-1">Benvenuto, {session.ragioneSociale}</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10">
            {cards.map(({ title, value, sub, href, cta, color }) => (
              <Link key={title} href={href}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:border-[#003580]/30 transition-colors">
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold mb-4 ${color}`}>{title}</span>
                <p className="text-3xl font-extrabold text-gray-900 mb-0.5">{value}</p>
                <p className="text-xs text-gray-400 mb-4">{sub}</p>
                <span className="inline-flex items-center text-xs font-semibold text-[#003580]">
                  {cta} →
                </span>
              </Link>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-5">Azioni rapide</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link href="/dashboard/ricambi/nuovo"
                className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-[#FF6600] transition-all group">
                <div className="w-10 h-10 bg-[#FF6600]/10 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-[#FF6600]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-[#FF6600]">Nuovo ricambio</p>
                  <p className="text-xs text-gray-400">Registra un ricambio in magazzino</p>
                </div>
              </Link>
              <Link href="/dashboard/scansiona"
                className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-[#003580]/30 transition-all group">
                <div className="w-10 h-10 bg-[#003580]/10 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-[#003580]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h4v4H4zM16 4h4v4h-4zM4 16h4v4H4zM16 16h4v4h-4zM10 4v4M14 4v4M4 10h4M4 14h4M10 10h10M14 14h6" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-[#003580]">Scansiona QR</p>
                  <p className="text-xs text-gray-400">Apri un ricambio dal QR stampato</p>
                </div>
              </Link>
              <Link href="/dashboard/profilo"
                className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-[#003580]/30 transition-all group">
                <div className="w-10 h-10 bg-[#003580]/10 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-[#003580]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-[#003580]">Modifica profilo</p>
                  <p className="text-xs text-gray-400">Aggiorna i dati aziendali</p>
                </div>
              </Link>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
