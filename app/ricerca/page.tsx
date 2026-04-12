import type { Metadata } from 'next';
import { prisma } from '../../lib/prisma';
import SearchForm from './SearchForm';
import ContactReveal from './ContactReveal';
import Navbar from '../../components/Navbar';

export const metadata: Metadata = {
  title: 'Cerca ricambi auto usati — Trova il pezzo giusto',
  description:
    'Cerca ricambi auto usati tra migliaia di veicoli disponibili nei piazzali dei demolitori italiani. Filtra per marca, modello, anno, provincia e tipo di ricambio.',
  alternates: {
    canonical: '/ricerca',
  },
  openGraph: {
    title: 'Cerca ricambi auto usati — autodemo24',
    description:
      'Cerca ricambi auto usati tra migliaia di veicoli disponibili nei piazzali dei demolitori italiani.',
    url: '/ricerca',
  },
};

interface PageProps {
  searchParams: Promise<{
    ricambio?: string;
    marca?: string;
    modello?: string;
    anno?: string;
    annoDa?: string;
    annoA?: string;
    provincia?: string;
    carburante?: string;
    categoria?: string;
    siglaMotore?: string;
    cilindrata?: string;
  }>;
}

function PlaceholderFoto() {
  return (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
      <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M4 16l4-4a2 2 0 012.83 0L14 15m2-2l1.17-1.17a2 2 0 012.83 0L22 14M14 8a2 2 0 11-4 0 2 2 0 014 0zM3 20h18a1 1 0 001-1V5a1 1 0 00-1-1H3a1 1 0 00-1 1v14a1 1 0 001 1z" />
      </svg>
    </div>
  );
}

export default async function RicercaPage({ searchParams }: PageProps) {
  const raw = await searchParams;

  const ricambio = raw.ricambio?.trim() || undefined;
  const marca = raw.marca?.trim() || undefined;
  const modello = raw.modello?.trim() || undefined;
  const annoNum = raw.anno && !isNaN(Number(raw.anno)) ? Number(raw.anno) : undefined;
  const annoDa = raw.annoDa && !isNaN(Number(raw.annoDa)) ? Number(raw.annoDa) : undefined;
  const annoA = raw.annoA && !isNaN(Number(raw.annoA)) ? Number(raw.annoA) : undefined;
  const provincia = raw.provincia?.trim() || undefined;
  const carburante = raw.carburante?.trim() || undefined;
  const categoria = raw.categoria?.trim() || undefined;
  const siglaMotore = raw.siglaMotore?.trim() || undefined;
  const cilindrata = raw.cilindrata?.trim() || undefined;

  // Build ricambi filter: combine ricambio text search and categoria
  const ricambiFilter = (ricambio || categoria)
    ? {
        ricambi: {
          some: {
            disponibile: true,
            ...(ricambio && { nome: { contains: ricambio, mode: 'insensitive' as const } }),
            ...(categoria && { categoria: { contains: categoria, mode: 'insensitive' as const } }),
          },
        },
      }
    : {};

  const veicoli = await prisma.veicolo.findMany({
    where: {
      ...ricambiFilter,
      ...(marca && { marca: { contains: marca, mode: 'insensitive' as const } }),
      ...(modello && { modello: { contains: modello, mode: 'insensitive' as const } }),
      ...(annoNum && { anno: annoNum }),
      ...(annoDa && { anno: { gte: annoDa } }),
      ...(annoA && { anno: { ...(annoDa ? { gte: annoDa } : {}), lte: annoA } }),
      ...(carburante && { carburante: { contains: carburante, mode: 'insensitive' as const } }),
      ...(siglaMotore && { siglaMotore: { contains: siglaMotore, mode: 'insensitive' as const } }),
      ...(cilindrata && { cilindrata: { contains: cilindrata, mode: 'insensitive' as const } }),
      ...(provincia && { demolitore: { provincia: { contains: provincia, mode: 'insensitive' as const } } }),
    },
    include: {
      foto: { take: 1, orderBy: { copertina: 'desc' } },
      ricambi: { where: { disponibile: true } },
      demolitore: { select: { ragioneSociale: true, provincia: true, telefono: true, email: true } },
      _count: { select: { foto: true } },
    },
    orderBy: { id: 'desc' },
    take: 60,
  });

  const activeFilters = [
    ricambio && `Ricambio: ${ricambio}`,
    categoria && `Categoria: ${categoria}`,
    marca && `Marca: ${marca}`,
    modello && `Modello: ${modello}`,
    annoNum && `Anno: ${annoNum}`,
    annoDa && `Da: ${annoDa}`,
    annoA && `A: ${annoA}`,
    provincia && `Provincia: ${provincia}`,
    carburante && `Alimentazione: ${carburante}`,
    siglaMotore && `Motore: ${siglaMotore}`,
    cilindrata && `Cilindrata: ${cilindrata}`,
  ].filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8 flex gap-7 flex-1 w-full">

        {/* ── Sidebar filtri ── */}
        <aside className="w-64 shrink-0 hidden lg:block">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sticky top-20">
            <h2 className="text-sm font-bold text-[#003580] uppercase tracking-wide mb-5 pb-3 border-b border-gray-100">
              Filtra risultati
            </h2>
            <SearchForm
              ricambio={ricambio}
              marca={marca}
              modello={modello}
              anno={annoNum?.toString()}
              annoDa={annoDa?.toString()}
              annoA={annoA?.toString()}
              provincia={provincia}
              carburante={carburante}
              categoria={categoria}
              siglaMotore={siglaMotore}
              cilindrata={cilindrata}
            />
          </div>
        </aside>

        {/* ── Risultati ── */}
        <main className="flex-1 min-w-0">
          {/* Header risultati */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {veicoli.length} {veicoli.length === 1 ? 'veicolo trovato' : 'veicoli trovati'}
              </h1>
              {activeFilters.length > 0 && (
                <p className="text-sm text-gray-500 mt-0.5">
                  Filtri attivi: {activeFilters.join(' · ')}
                </p>
              )}
            </div>
            {activeFilters.length > 0 && (
              <a href="/ricerca"
                className="ml-auto text-xs text-gray-500 hover:text-[#003580] underline">
                Rimuovi filtri
              </a>
            )}
          </div>

          {/* Filtri mobile */}
          <div className="lg:hidden mb-5 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <details>
              <summary className="text-sm font-semibold text-[#003580] cursor-pointer">
                Filtra risultati
              </summary>
              <div className="mt-4">
                <SearchForm ricambio={ricambio} marca={marca} modello={modello} anno={annoNum?.toString()} annoDa={annoDa?.toString()} annoA={annoA?.toString()} provincia={provincia} carburante={carburante} categoria={categoria} siglaMotore={siglaMotore} cilindrata={cilindrata} />
              </div>
            </details>
          </div>

          {veicoli.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 py-24 text-center">
              <svg className="w-16 h-16 text-gray-200 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM3 5h2l2 7h10l2-7H3z" />
              </svg>
              <p className="text-gray-500 text-lg font-semibold mb-1">Nessun veicolo trovato</p>
              <p className="text-gray-400 text-sm">Prova a modificare i filtri di ricerca</p>
            </div>
          ) : (
            <div className="space-y-4">
              {veicoli.map((veicolo) => {
                const primaFoto = veicolo.foto[0]?.url ?? null;
                const ricambi = veicolo.ricambi;

                return (
                  <a key={veicolo.id} href={`/veicoli/${veicolo.id}`}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row overflow-hidden hover:shadow-lg hover:border-gray-200 transition-all group block">

                    {/* Foto */}
                    <div className="shrink-0 w-full sm:w-60 md:w-72 h-48 sm:h-auto relative overflow-hidden">
                      {primaFoto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={primaFoto} alt={`${veicolo.marca} ${veicolo.modello}`}
                          className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-300 sm:min-h-[180px]" />
                      ) : (
                        <div className="sm:min-h-[180px] h-full">
                          <PlaceholderFoto />
                        </div>
                      )}
                      {/* Conteggio foto */}
                      {veicolo._count.foto > 0 && (
                        <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M4 16l4-4a2 2 0 012.83 0L14 15m2-2l1.17-1.17a2 2 0 012.83 0L22 14M14 8a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          {veicolo._count.foto}
                        </div>
                      )}
                    </div>

                    {/* Contenuto */}
                    <div className="flex-1 p-5 min-w-0 flex flex-col">
                      {/* Titolo */}
                      <h2 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-[#003580] transition-colors">
                        {veicolo.marca} {veicolo.modello}
                      </h2>
                      {veicolo.versione && (
                        <p className="text-sm text-gray-500 mt-0.5">{veicolo.versione}</p>
                      )}

                      {/* Specs — riga orizzontale con separatori */}
                      <div className="flex flex-wrap items-center gap-x-1 gap-y-1 mt-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {veicolo.anno}
                        </span>
                        <span className="text-gray-300 mx-1">|</span>
                        <span>{veicolo.km.toLocaleString('it-IT')} km</span>
                        {veicolo.carburante && (
                          <>
                            <span className="text-gray-300 mx-1">|</span>
                            <span>{veicolo.carburante}</span>
                          </>
                        )}
                        {veicolo.potenzaKw != null && veicolo.potenzaKw > 0 && (
                          <>
                            <span className="text-gray-300 mx-1">|</span>
                            <span>{veicolo.potenzaKw} kW ({Math.round(veicolo.potenzaKw * 1.36)} CV)</span>
                          </>
                        )}
                      </div>

                      {/* Ricambi — stile pulito a lista */}
                      {ricambi.length > 0 && (
                        <div className="mt-4 flex-1">
                          <p className="text-xs font-bold text-[#003580] uppercase tracking-wider mb-2">
                            {ricambi.length} ricambi disponibili
                          </p>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {ricambi.slice(0, 8).map((r) => r.nome).join(' · ')}
                            {ricambi.length > 8 && ` · +${ricambi.length - 8} altri`}
                          </p>
                        </div>
                      )}

                      {/* Demolitore */}
                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-xs text-gray-500">
                            {veicolo.demolitore.ragioneSociale}
                            {veicolo.demolitore.provincia && ` — ${veicolo.demolitore.provincia}`}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-[#003580] group-hover:text-[#FF6600] transition-colors">
                          Dettagli →
                        </span>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-[#001f4d] text-white/50 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <a href="/" className="inline-flex items-center gap-1 mb-2">
            <span className="font-bold text-white">auto</span>
            <span className="font-bold text-[#FF6600]">demo24</span>
          </a>
          <p className="text-sm">Il portale italiano dei demolitori auto</p>
        </div>
      </footer>
    </div>
  );
}
