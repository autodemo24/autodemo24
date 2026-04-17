import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '../../../lib/session';
import { prisma } from '../../../lib/prisma';
import DashboardShell from '../../../components/DashboardShell';
import type { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

const TABS = [
  { key: 'tutti', label: 'Ordini eBay', filter: {} },
  { key: 'daSpedire', label: 'In attesa di spedizione', filter: { stato: 'PAID' } },
  { key: 'spediti', label: 'Spediti', filter: { stato: 'SHIPPED' } },
  { key: 'annullati', label: 'Annullati', filter: { stato: 'CANCELLED' } },
] as const;

function fmt(v: unknown): string {
  const n = Number(v);
  return isNaN(n) ? '—' : `€ ${n.toFixed(2)}`;
}

function StatoBadge({ stato }: { stato: string }) {
  const map: Record<string, string> = {
    CREATED: 'bg-gray-100 text-gray-700',
    PAID: 'bg-yellow-100 text-yellow-800',
    SHIPPED: 'bg-green-100 text-green-800',
    DELIVERED: 'bg-green-200 text-green-900',
    CANCELLED: 'bg-red-100 text-red-800',
  };
  const labels: Record<string, string> = {
    CREATED: 'creato',
    PAID: 'pagato, da spedire',
    SHIPPED: 'spedito',
    DELIVERED: 'consegnato',
    CANCELLED: 'annullato',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${map[stato] ?? 'bg-gray-100 text-gray-600'}`}>
      {labels[stato] ?? stato.toLowerCase()}
    </span>
  );
}

export default async function OrdiniPage({
  searchParams,
}: { searchParams: Promise<{ tab?: string; q?: string; dal?: string; al?: string }> }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const sp = await searchParams;
  const tabKey = sp.tab && TABS.some((t) => t.key === sp.tab) ? sp.tab as typeof TABS[number]['key'] : 'tutti';
  const tab = TABS.find((t) => t.key === tabKey) ?? TABS[0];

  const where: Prisma.OrdineWhereInput = {
    demolitoreid: session.id,
    ...('filter' in tab ? tab.filter : {}),
    ...(sp.q && {
      OR: [
        { ebayOrderId: { contains: sp.q, mode: 'insensitive' as const } },
        { buyerUsername: { contains: sp.q, mode: 'insensitive' as const } },
        { shippingName: { contains: sp.q, mode: 'insensitive' as const } },
      ],
    }),
    ...(sp.dal && { createdAt: { gte: new Date(sp.dal) } }),
    ...(sp.al && { createdAt: { lte: new Date(sp.al + 'T23:59:59') } }),
  };

  const [ordini, demolitore, counts, totaleGlobale] = await Promise.all([
    prisma.ordine.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
    prisma.demolitore.findUnique({ where: { id: session.id }, select: { email: true } }),
    prisma.ordine.groupBy({
      by: ['stato'],
      where: { demolitoreid: session.id },
      _count: { _all: true },
    }),
    prisma.ordine.aggregate({
      where: { demolitoreid: session.id, stato: { not: 'CANCELLED' } },
      _sum: { totalAmount: true },
    }),
  ]);

  const countByStato = Object.fromEntries(counts.map((c) => [c.stato, c._count._all]));
  const totale = Number(totaleGlobale._sum.totalAmount ?? 0);

  return (
    <DashboardShell ragioneSociale={session.ragioneSociale} email={demolitore?.email ?? session.email}>
      <div className="max-w-7xl mx-auto p-4 sm:p-8">
        <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-6 h-6 text-[#FF6600]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Ordini dal tuo negozio eBay
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {ordini.length === 0 ? 'Nessun ordine ricevuto ancora.' : `${ordini.length} ordini visualizzati`}
            </p>
          </div>

          {/* KPI riga */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-gradient-to-br from-[#003580] to-[#002560] text-white rounded-xl p-4">
              <p className="text-xs uppercase tracking-wide opacity-80">Vendite totali</p>
              <p className="text-2xl font-bold mt-1">€ {totale.toFixed(2)}</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Da spedire</p>
              <p className="text-2xl font-bold text-yellow-700 mt-1">{countByStato.PAID ?? 0}</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Spediti</p>
              <p className="text-2xl font-bold text-green-700 mt-1">{countByStato.SHIPPED ?? 0}</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Totali</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {Object.values(countByStato).reduce((a, b) => a + (b as number), 0)}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-4 border-b border-gray-200 overflow-x-auto">
            <div className="flex gap-1 min-w-max">
              {TABS.map((t) => {
                const active = t.key === tabKey;
                const count = t.key === 'tutti'
                  ? Object.values(countByStato).reduce((a, b) => a + (b as number), 0)
                  : (countByStato[('stato' in t.filter ? t.filter.stato : null) as string] ?? 0);
                return (
                  <Link
                    key={t.key}
                    href={`/dashboard/ordini?tab=${t.key}`}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
                      active
                        ? 'border-[#003580] text-[#003580]'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {t.label} {count > 0 && <span className="ml-1 text-xs opacity-70">({count})</span>}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Filtri ricerca */}
          <form action="/dashboard/ordini" className="mb-4 flex flex-wrap gap-2 items-center">
            <input type="hidden" name="tab" value={tabKey} />
            <input
              type="text"
              name="q"
              defaultValue={sp.q ?? ''}
              placeholder="Cerca numero, acquirente, nome"
              className="flex-1 min-w-[200px] px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#003580]"
            />
            <input type="date" name="dal" defaultValue={sp.dal ?? ''} className="px-2 py-2 text-sm border border-gray-300 rounded-lg" />
            <input type="date" name="al" defaultValue={sp.al ?? ''} className="px-2 py-2 text-sm border border-gray-300 rounded-lg" />
            <button type="submit" className="px-4 py-2 bg-[#FF6600] text-white rounded-lg text-sm font-semibold">Cerca</button>
          </form>

          {/* Tabella ordini */}
          {ordini.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center">
              <p className="text-gray-500">Nessun ordine trovato con i filtri correnti.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold">Numero</th>
                      <th className="text-left px-4 py-3 font-semibold">Data</th>
                      <th className="text-left px-4 py-3 font-semibold">Acquirente</th>
                      <th className="text-left px-4 py-3 font-semibold">Articoli</th>
                      <th className="text-right px-4 py-3 font-semibold">Importo</th>
                      <th className="text-left px-4 py-3 font-semibold">Stato</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {ordini.map((o) => (
                      <tr key={o.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs text-gray-700">{o.ebayOrderId}</td>
                        <td className="px-4 py-3 text-gray-700">
                          {new Date(o.createdAt).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-gray-900 text-sm">{o.shippingName ?? o.buyerUsername ?? '—'}</p>
                          {o.shippingCity && <p className="text-xs text-gray-500">{o.shippingCity} {o.shippingPostalCode}</p>}
                        </td>
                        <td className="px-4 py-3 text-gray-700 text-xs">
                          {o.items.length} × {o.items[0]?.titolo ? o.items[0].titolo.slice(0, 40) : '—'}
                        </td>
                        <td className="px-4 py-3 font-semibold text-right">{fmt(o.totalAmount)}</td>
                        <td className="px-4 py-3"><StatoBadge stato={o.stato} /></td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/dashboard/ordini/${o.id}`} className="text-[#003580] hover:underline text-xs font-semibold">
                            Dettaglio
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
      </div>
    </DashboardShell>
  );
}
