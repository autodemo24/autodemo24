import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '../../../lib/session';
import { prisma } from '../../../lib/prisma';
import Navbar from '../../../components/Navbar';
import DashboardSidebar from '../../../components/DashboardSidebar';
import SyncEbayButton from './SyncEbayButton';
import RicambiTable from './RicambiTable';
import { generaTitoloRicambio } from '../../../lib/titolo-ricambio';
import type { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

const TABS: Array<{ key: string; label: string; filter: Prisma.RicambioWhereInput }> = [
  { key: 'in_corso', label: 'In corso', filter: { stato: { in: ['DISPONIBILE', 'RISERVATO'] }, pubblicato: true } },
  { key: 'non_attive', label: 'Non attive', filter: { stato: { in: ['VENDUTO', 'RITIRATO'] } } },
  { key: 'bozze', label: 'Bozze', filter: { pubblicato: false, stato: { in: ['DISPONIBILE', 'RISERVATO'] } } },
];
type TabKey = string;

function fmtEuro(v: number): string {
  return v.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function DashboardRicambiPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | undefined>> }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const sp = await searchParams;
  const tabKey: TabKey = TABS.some((t) => t.key === sp.tab) ? sp.tab as TabKey : 'in_corso';
  const tab = TABS.find((t) => t.key === tabKey) ?? TABS[0];
  const q = sp.q?.trim() || undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const perPage = 50;

  const where: Prisma.RicambioWhereInput = {
    demolitoreid: session.id,
    ...tab.filter,
    ...(q && {
      OR: [
        { nome: { contains: q, mode: 'insensitive' as const } },
        { titolo: { contains: q, mode: 'insensitive' as const } },
        { codice: { contains: q, mode: 'insensitive' as const } },
        { marca: { contains: q, mode: 'insensitive' as const } },
        { modello: { contains: q, mode: 'insensitive' as const } },
        { ubicazione: { contains: q, mode: 'insensitive' as const } },
      ],
    }),
  };

  const [ricambi, demolitore, totalCount, tabGroups, aggSum] = await Promise.all([
    prisma.ricambio.findMany({
      where,
      select: {
        id: true,
        codice: true,
        nome: true,
        titolo: true,
        marca: true,
        modello: true,
        anno: true,
        codiceOe: true,
        mpn: true,
        ubicazione: true,
        prezzo: true,
        stato: true,
        quantita: true,
        createdAt: true,
        foto: {
          select: { url: true },
          orderBy: [{ copertina: 'desc' }, { id: 'asc' }],
          take: 1,
        },
        ebayListing: { select: { status: true, listingId: true } },
        compatibilita: {
          orderBy: { id: 'asc' },
          take: 1,
          select: { marca: true, modello: true, annoInizio: true, annoFine: true, versione: true },
        },
        modelloAuto: { select: { serie: true, annoInizio: true, annoFine: true } },
      },
      orderBy: { id: 'desc' },
      take: perPage,
      skip: (page - 1) * perPage,
    }),
    prisma.demolitore.findUnique({ where: { id: session.id }, select: { email: true } }),
    prisma.ricambio.count({ where }),
    prisma.ricambio.groupBy({
      by: ['stato', 'pubblicato'],
      where: { demolitoreid: session.id },
      _count: { _all: true },
    }),
    prisma.ricambio.aggregate({
      where,
      _sum: { prezzo: true },
    }),
  ]);

  // Calcola tutti i contatori tab da tabGroups (stato, pubblicato) in una sola query
  let countInCorso = 0, countBozze = 0, countNonAttive = 0, countAll = 0;
  for (const g of tabGroups) {
    const n = g._count._all;
    countAll += n;
    if (g.stato === 'VENDUTO' || g.stato === 'RITIRATO') {
      countNonAttive += n;
    } else if (g.stato === 'DISPONIBILE' || g.stato === 'RISERVATO') {
      if (g.pubblicato) countInCorso += n;
      else countBozze += n;
    }
  }

  const tabsWithCount = [
    { ...TABS[0], count: countInCorso },
    { ...TABS[1], count: countNonAttive },
    { ...TABS[2], count: countBozze },
  ];

  const totalValue = Number(aggSum._sum.prezzo ?? 0);
  const totalQta = ricambi.reduce((a, r) => a + (r.quantita ?? 1), 0);
  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
  const rangeFrom = totalCount === 0 ? 0 : (page - 1) * perPage + 1;
  const rangeTo = Math.min(page * perPage, totalCount);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="lg:hidden"><Navbar /></div>
      <div className="flex">
        <DashboardSidebar ragioneSociale={session.ragioneSociale} email={demolitore?.email ?? session.email} />
        <main className="ml-0 lg:ml-60 flex-1 p-4 sm:p-6 min-w-0">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
              <h1 className="text-2xl font-bold text-gray-900">
                Gestisci i ricambi <span className="text-gray-500 font-semibold">({countAll.toLocaleString('it-IT')})</span>
              </h1>
              {/* Tabs inline */}
              <nav className="flex flex-wrap gap-2">
                {tabsWithCount.map((t) => {
                  const isActive = t.key === tabKey;
                  return (
                    <Link
                      key={t.key}
                      href={`/dashboard/ricambi?tab=${t.key}`}
                      className={`px-4 py-2 rounded-full text-base font-semibold transition-colors ${
                        isActive
                          ? 'bg-[#003580] text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {t.label} <span className={`text-sm ml-1 ${isActive ? 'text-white/80' : 'text-gray-400'}`}>({t.count})</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <SyncEbayButton />
              <Link href="/dashboard/scansiona"
                className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 hover:border-[#003580] text-gray-700 hover:text-[#003580] rounded-full text-base font-semibold transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h4v4H4zM16 4h4v4h-4zM4 16h4v4H4zM16 16h4v4h-4zM10 4v4M14 4v4M4 10h4M4 14h4M10 10h10M14 14h6" />
                </svg>
                Scansiona QR
              </Link>
              <Link href="/dashboard/ricambi/nuovo"
                className="flex items-center gap-2 px-6 py-2.5 bg-[#003580] hover:bg-[#002560] text-white rounded-full text-base font-semibold transition-colors">
                Crea un'inserzione
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </Link>
            </div>
          </div>

              {/* Search */}
              <form action="/dashboard/ricambi" className="mb-4">
                <input type="hidden" name="tab" value={tabKey} />
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
                  </svg>
                  <input
                    type="text"
                    name="q"
                    defaultValue={q ?? ''}
                    placeholder="Cerca per titolo, codice prodotto o n° oggetto"
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-full text-sm focus:outline-none focus:border-[#003580] bg-white"
                  />
                </div>
              </form>

              {/* Stats bar */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-3 text-sm">
                <span className="text-gray-700">
                  <strong>Risultati:</strong> {rangeFrom}-{rangeTo} di {totalCount.toLocaleString('it-IT')}
                </span>
                <span className="text-gray-700">
                  <strong>Totale:</strong> € {fmtEuro(totalValue)}
                </span>
                <span className="text-gray-700">
                  <strong>Q.tà:</strong> {totalQta.toLocaleString('it-IT')}
                </span>
                <span className="text-gray-500 ml-auto hidden sm:inline">
                  Pagina <span className="font-semibold text-gray-900">{page}</span> / {totalPages}
                </span>
              </div>

              {/* Table */}
              <RicambiTable
                ricambi={ricambi.map((r) => {
                  const titoloEffettivo = r.titolo?.trim() || generaTitoloRicambio({
                    nome: r.nome,
                    marca: r.marca,
                    modello: r.modello,
                    anno: r.anno,
                    codiceOe: r.codiceOe,
                    mpn: r.mpn,
                    compatibilita: r.compatibilita.map((c) => ({
                      marca: c.marca,
                      modello: c.modello,
                      annoInizio: c.annoInizio,
                      annoFine: c.annoFine,
                      versione: c.versione,
                    })),
                    modelloAuto: r.modelloAuto,
                  }) || r.nome;
                  return {
                    id: r.id,
                    codice: r.codice,
                    titolo: titoloEffettivo,
                    nome: r.nome,
                    marca: r.marca,
                    modello: r.modello,
                    anno: r.anno,
                    ubicazione: r.ubicazione,
                    prezzo: r.prezzo.toString(),
                    stato: r.stato,
                    quantita: r.quantita ?? 1,
                    createdAt: r.createdAt.toISOString(),
                    coverUrl: r.foto[0]?.url ?? null,
                    ebayStatus: r.ebayListing?.status ?? null,
                    ebayListingId: r.ebayListing?.listingId ?? null,
                  };
                })}
              />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              {page > 1 && (
                <Link
                  href={`/dashboard/ricambi?tab=${tabKey}&page=${page - 1}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-sm"
                >
                  ← Precedente
                </Link>
              )}
              <span className="px-4 py-2 text-sm text-gray-600">
                Pagina {page} di {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`/dashboard/ricambi?tab=${tabKey}&page=${page + 1}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-sm"
                >
                  Successiva →
                </Link>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
