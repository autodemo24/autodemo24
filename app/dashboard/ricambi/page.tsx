import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '../../../lib/session';
import { prisma } from '../../../lib/prisma';
import Navbar from '../../../components/Navbar';
import DashboardSidebar from '../../../components/DashboardSidebar';
import RicambiFilters from './RicambiFilters';
import type { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

const STATI = ['DISPONIBILE', 'RISERVATO', 'VENDUTO', 'RITIRATO'] as const;

function fmtPrezzo(v: unknown): string {
  const n = Number(v);
  return isNaN(n) ? '—' : `€ ${n.toFixed(2)}`;
}

export default async function DashboardRicambiPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | undefined>> }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const sp = await searchParams;
  const stato = sp.stato && (STATI as readonly string[]).includes(sp.stato) ? sp.stato as (typeof STATI)[number] : undefined;
  const categoria = sp.categoria || undefined;
  const ubicazione = sp.ubicazione || undefined;
  const q = sp.q || undefined;

  const where: Prisma.RicambioWhereInput = {
    demolitoreid: session.id,
    ...(stato && { stato }),
    ...(categoria && { categoria }),
    ...(ubicazione && { ubicazione: { contains: ubicazione, mode: 'insensitive' as const } }),
    ...(q && {
      OR: [
        { nome: { contains: q, mode: 'insensitive' as const } },
        { codice: { contains: q, mode: 'insensitive' as const } },
        { descrizione: { contains: q, mode: 'insensitive' as const } },
      ],
    }),
  };

  const [ricambi, demolitore, counts, categorie] = await Promise.all([
    prisma.ricambio.findMany({
      where,
      include: { foto: { orderBy: { copertina: 'desc' } } },
      orderBy: { id: 'desc' },
      take: 500,
    }),
    prisma.demolitore.findUnique({ where: { id: session.id }, select: { email: true } }),
    prisma.ricambio.groupBy({
      by: ['stato'],
      where: { demolitoreid: session.id },
      _count: { _all: true },
    }),
    prisma.ricambio.findMany({
      where: { demolitoreid: session.id },
      distinct: ['categoria'],
      select: { categoria: true },
      orderBy: { categoria: 'asc' },
    }),
  ]);

  const countByStato: Record<string, number> = Object.fromEntries(counts.map((c) => [c.stato, c._count._all]));
  const totale = counts.reduce((a, c) => a + c._count._all, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="lg:hidden"><Navbar /></div>
      <div className="flex">
        <DashboardSidebar ragioneSociale={session.ragioneSociale} email={demolitore?.email ?? session.email} />
        <main className="ml-0 lg:ml-60 flex-1 p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">I miei ricambi</h1>
              <p className="text-gray-500 text-sm mt-1">
                {totale === 0 ? 'Nessun ricambio inserito ancora.' : `${totale} ricambi totali`}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Link href="/dashboard/scansiona"
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 hover:border-[#003580] text-gray-700 hover:text-[#003580] rounded-lg text-sm font-semibold transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h4v4H4zM16 4h4v4h-4zM4 16h4v4H4zM16 16h4v4h-4zM10 4v4M14 4v4M4 10h4M4 14h4M10 10h10M14 14h6" />
                </svg>
                Scansiona QR
              </Link>
              <Link href="/dashboard/ricambi/nuovo"
                className="flex items-center gap-2 px-5 py-2.5 bg-[#FF6600] hover:bg-[#d4580a] text-white rounded-lg text-sm font-semibold transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Nuovo ricambio
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {STATI.map((s) => (
              <div key={s} className="bg-white border border-gray-100 rounded-xl p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide">{s.toLowerCase()}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{countByStato[s] ?? 0}</p>
              </div>
            ))}
          </div>

          <RicambiFilters
            categorie={categorie.map((c) => c.categoria)}
            initial={{ stato, categoria, ubicazione, q }}
          />

          {ricambi.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center">
              <p className="text-gray-500">Nessun ricambio trovato con i filtri correnti.</p>
              <Link href="/dashboard/ricambi/nuovo"
                className="inline-block mt-4 px-5 py-2.5 bg-[#003580] hover:bg-[#002560] text-white rounded-lg text-sm font-semibold">
                Inserisci il primo ricambio
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold">Foto</th>
                      <th className="text-left px-4 py-3 font-semibold">Codice</th>
                      <th className="text-left px-4 py-3 font-semibold">Nome</th>
                      <th className="text-left px-4 py-3 font-semibold">Auto</th>
                      <th className="text-left px-4 py-3 font-semibold">Ubicazione</th>
                      <th className="text-left px-4 py-3 font-semibold">Prezzo</th>
                      <th className="text-left px-4 py-3 font-semibold">Stato</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {ricambi.map((r) => {
                      const cover = r.foto.find((f) => f.copertina) ?? r.foto[0];
                      return (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            {cover ? (
                              <img src={cover.url} alt="" className="w-14 h-14 object-cover rounded-md" />
                            ) : (
                              <div className="w-14 h-14 bg-gray-100 rounded-md flex items-center justify-center text-gray-400">—</div>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-gray-600">{r.codice}</td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-gray-900">{r.nome}</p>
                            <p className="text-xs text-gray-500">{r.categoria}</p>
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {r.marca} {r.modello}{r.anno ? ` (${r.anno})` : ''}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">{r.ubicazione}</td>
                          <td className="px-4 py-3 font-semibold">{fmtPrezzo(r.prezzo)}</td>
                          <td className="px-4 py-3">
                            <StatoBadge stato={r.stato} />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link href={`/dashboard/ricambi/${r.id}`} className="text-[#003580] hover:underline text-xs font-semibold mr-3">
                              Modifica
                            </Link>
                            <Link href={`/dashboard/ricambi/${r.id}/qr`} className="text-gray-600 hover:text-gray-900 text-xs font-semibold">
                              QR
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function StatoBadge({ stato }: { stato: string }) {
  const map: Record<string, string> = {
    DISPONIBILE: 'bg-green-100 text-green-800',
    RISERVATO: 'bg-yellow-100 text-yellow-800',
    VENDUTO: 'bg-gray-200 text-gray-700',
    RITIRATO: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${map[stato] ?? 'bg-gray-100 text-gray-600'}`}>
      {stato.toLowerCase()}
    </span>
  );
}
