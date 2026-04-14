import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '../../lib/prisma';
import Navbar from '../../components/Navbar';
import RicambiSearchForm from './RicambiSearchForm';
import RicambiSortBar from './RicambiSortBar';
import type { Prisma } from '@prisma/client';

export const metadata: Metadata = {
  title: 'Ricambi auto usati — autodemo24',
  description:
    'Cerca ricambi auto usati originali dai demolitori italiani. Filtra per marca, modello, anno, categoria e provincia.',
  alternates: { canonical: '/ricambi' },
};

export const dynamic = 'force-dynamic';

function fmtPrezzo(v: unknown): string {
  const n = Number(v);
  return isNaN(n) ? '—' : `€ ${n.toFixed(2)}`;
}

export default async function PublicRicambiPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const marca = sp.marca || undefined;
  const modello = sp.modello || undefined;
  const annoNum = sp.anno ? Number(sp.anno) : undefined;
  const categoria = sp.categoria || undefined;
  const provincia = sp.provincia || undefined;
  const q = sp.q || undefined;
  const sort = sp.sort || 'rilevanti';

  const orderBy: Prisma.RicambioOrderByWithRelationInput =
    sort === 'prezzo-asc' ? { prezzo: 'asc' }
    : sort === 'prezzo-desc' ? { prezzo: 'desc' }
    : sort === 'recenti' ? { createdAt: 'desc' }
    : { id: 'desc' };

  const where: Prisma.RicambioWhereInput = {
    pubblicato: true,
    stato: 'DISPONIBILE',
    ...(marca && { marca: { equals: marca, mode: 'insensitive' as const } }),
    ...(modello && { modello: { equals: modello, mode: 'insensitive' as const } }),
    ...(annoNum && !isNaN(annoNum) && { anno: annoNum }),
    ...(categoria && { categoria }),
    ...(provincia && { demolitore: { provincia: { contains: provincia, mode: 'insensitive' as const } } }),
    ...(q && {
      OR: [
        { nome: { contains: q, mode: 'insensitive' as const } },
        { descrizione: { contains: q, mode: 'insensitive' as const } },
      ],
    }),
  };

  const [ricambi, marcheAvail, categorieAvail] = await Promise.all([
    prisma.ricambio.findMany({
      where,
      include: {
        foto: { orderBy: { copertina: 'desc' }, take: 1 },
        demolitore: { select: { ragioneSociale: true, provincia: true } },
      },
      orderBy,
      take: 120,
    }),
    prisma.ricambio.findMany({
      where: { pubblicato: true, stato: 'DISPONIBILE' },
      distinct: ['marca'],
      select: { marca: true },
      orderBy: { marca: 'asc' },
    }),
    prisma.ricambio.findMany({
      where: { pubblicato: true, stato: 'DISPONIBILE' },
      distinct: ['categoria'],
      select: { categoria: true },
      orderBy: { categoria: 'asc' },
    }),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6 flex-1 w-full">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar filtri */}
          <aside className="w-full lg:w-64 shrink-0">
            <div className="lg:sticky lg:top-24">
              <RicambiSearchForm
                marche={marcheAvail.map((m) => m.marca)}
                categorie={categorieAvail.map((c) => c.categoria)}
                initial={{ marca, modello, anno: sp.anno, categoria, provincia, q }}
              />
            </div>
          </aside>

          {/* Colonna risultati */}
          <div className="flex-1 min-w-0">
            <RicambiSortBar totale={ricambi.length} query={q} />

            {ricambi.length === 0 && (
              <p className="text-sm text-gray-500 mb-4">
                Nessun ricambio trovato con i filtri correnti.
              </p>
            )}

            {/* ── Lista risultati stile eBay ── */}
            <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
          {ricambi.map((r) => {
            const cover = r.foto[0];
            const titolo = `${r.nome.toUpperCase()} PER ${r.marca.toUpperCase()} ${r.modello}${r.anno ? ` ${r.anno}` : ''}`;
            return (
              <div key={r.id} className="flex flex-col sm:flex-row gap-4 p-4 hover:bg-gray-50/50 transition-colors">
                {/* Foto */}
                <Link href={`/ricambi/${r.id}`} className="shrink-0">
                  <div className="w-full sm:w-44 h-44 rounded-lg bg-white overflow-hidden border border-gray-200 flex items-center justify-center p-2">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cover.url} alt={r.nome} className="max-w-full max-h-full object-contain" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Contenuto */}
                <div className="flex-1 min-w-0 flex flex-col">
                  <Link href={`/ricambi/${r.id}`}
                    className="text-[15px] font-normal text-gray-900 hover:text-[#003580] hover:underline line-clamp-2 leading-snug">
                    {titolo}
                  </Link>
                  <p className="text-[12px] text-gray-500 mt-0.5">Di seconda mano</p>

                  {/* Spacer + riga prezzo */}
                  <div className="mt-auto pt-3">
                    <p className="text-xl font-bold text-gray-900">{fmtPrezzo(r.prezzo)}</p>
                    <p className="text-[13px] text-gray-700 mt-0.5">Compralo Subito</p>
                    <p className="text-[13px] text-gray-500">Consegna gratuita</p>
                  </div>
                </div>

                {/* Box venditore */}
                <div className="sm:w-56 shrink-0 flex flex-col justify-between gap-2">
                  <div className="border border-gray-200 rounded-lg p-3 flex items-start gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#003580]/10 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-[#003580]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-[#003580] truncate">
                        {r.demolitore.ragioneSociale}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {r.demolitore.provincia}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 self-start text-[11px] font-semibold text-[#C08631] bg-[#FDF4E3] border border-[#EBCF9B] rounded-full px-2 py-0.5">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 1l3.09 6.26L22 8.27l-5 4.87 1.18 6.88L12 16.77l-6.18 3.25L7 13.14 2 8.27l6.91-1.01L12 1z" />
                    </svg>
                    autenticato
                  </span>
                </div>
              </div>
            );
          })}
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-[#001f4d] text-white/50 py-8 mt-10">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <Link href="/" className="inline-flex items-center gap-1 mb-2">
            <span className="font-bold text-white">auto</span>
            <span className="font-bold text-[#FF6600]">demo24</span>
          </Link>
          <p className="text-sm">Il portale italiano dei demolitori auto</p>
        </div>
      </footer>
    </div>
  );
}
