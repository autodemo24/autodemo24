import { prisma } from '../../lib/prisma';
import SearchForm from './SearchForm';
import ContactReveal from './ContactReveal';

interface PageProps {
  searchParams: Promise<{
    marca?: string;
    modello?: string;
    anno?: string;
    provincia?: string;
    carburante?: string;
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

  const marca = raw.marca?.trim() || undefined;
  const modello = raw.modello?.trim() || undefined;
  const annoNum = raw.anno && !isNaN(Number(raw.anno)) ? Number(raw.anno) : undefined;
  const provincia = raw.provincia?.trim() || undefined;
  const carburante = raw.carburante?.trim() || undefined;

  const veicoli = await prisma.veicolo.findMany({
    where: {
      ...(marca && { marca: { contains: marca, mode: 'insensitive' as const } }),
      ...(modello && { modello: { contains: modello, mode: 'insensitive' as const } }),
      ...(annoNum && { anno: annoNum }),
      ...(carburante && { carburante: { contains: carburante, mode: 'insensitive' as const } }),
      ...(provincia && { demolitore: { provincia: { contains: provincia, mode: 'insensitive' as const } } }),
    },
    include: {
      foto: { take: 1 },
      ricambi: { where: { disponibile: true } },
      demolitore: { select: { ragioneSociale: true, provincia: true, telefono: true, email: true } },
    },
    orderBy: { id: 'desc' },
    take: 60,
  });

  const activeFilters = [
    marca && `Marca: ${marca}`,
    modello && `Modello: ${modello}`,
    annoNum && `Anno: ${annoNum}`,
    provincia && `Provincia: ${provincia}`,
    carburante && `Alimentazione: ${carburante}`,
  ].filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── Navbar ── */}
      <header className="bg-[#003580] text-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-1">
            <span className="text-xl font-bold text-white">auto</span>
            <span className="text-xl font-bold text-[#FF6600]">demo24</span>
          </a>
          <div className="flex items-center gap-4">
            <a href="/login" className="text-sm text-white/80 hover:text-white">Accedi</a>
            <a href="/registrati"
              className="px-4 py-2 bg-[#FF6600] hover:bg-orange-600 text-white rounded-lg text-sm font-semibold transition-colors">
              Registrati gratis
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 flex gap-7 flex-1 w-full">

        {/* ── Sidebar filtri ── */}
        <aside className="w-64 shrink-0 hidden lg:block">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sticky top-20">
            <h2 className="text-sm font-bold text-[#003580] uppercase tracking-wide mb-5 pb-3 border-b border-gray-100">
              Filtra risultati
            </h2>
            <SearchForm
              marca={marca}
              modello={modello}
              anno={annoNum?.toString()}
              provincia={provincia}
              carburante={carburante}
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
                className="ml-auto text-xs text-gray-500 hover:text-red-600 underline">
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
                <SearchForm marca={marca} modello={modello} anno={annoNum?.toString()} provincia={provincia} carburante={carburante} />
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
                  <div key={veicolo.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 flex overflow-hidden hover:border-[#003580]/30 hover:shadow-md transition-all">

                    {/* Foto */}
                    <a href={`/veicoli/${veicolo.id}`} className="shrink-0 w-52 sm:w-64 h-auto relative block">
                      {primaFoto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={primaFoto} alt={`${veicolo.marca} ${veicolo.modello}`}
                          className="w-full h-full object-cover hover:opacity-95 transition-opacity min-h-[160px]" />
                      ) : (
                        <div className="min-h-[160px] h-full">
                          <PlaceholderFoto />
                        </div>
                      )}
                    </a>

                    {/* Contenuto principale */}
                    <div className="flex-1 p-5 min-w-0 flex flex-col">
                      {/* Titolo */}
                      <div className="mb-3">
                        <a href={`/veicoli/${veicolo.id}`} className="hover:text-[#003580] transition-colors">
                          <h2 className="text-xl font-bold text-gray-900 leading-tight">
                            {veicolo.marca} {veicolo.modello}
                          </h2>
                        </a>
                        {veicolo.versione && (
                          <p className="text-sm text-gray-500 mt-0.5">{veicolo.versione}</p>
                        )}
                      </div>

                      {/* Spec badges */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm font-semibold text-gray-700">{veicolo.anno}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM3 5h2l2 7h10l2-7H3z" />
                          </svg>
                          <span className="text-sm font-semibold text-gray-700">{veicolo.km.toLocaleString('it-IT')} km</span>
                        </div>
                        {veicolo.carburante && (
                          <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M3 6l3 13h12l3-13H3z" />
                            </svg>
                            <span className="text-sm font-semibold text-gray-700">{veicolo.carburante}</span>
                          </div>
                        )}
                        {veicolo.potenzaKw != null && veicolo.potenzaKw > 0 && (
                          <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span className="text-sm font-semibold text-gray-700">
                              {veicolo.potenzaKw} kW ({Math.round(veicolo.potenzaKw * 1.36)} CV)
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Ricambi */}
                      <div className="flex-1">
                        {ricambi.length > 0 ? (
                          <>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                              {ricambi.length} ricambi disponibili
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {ricambi.slice(0, 6).map((r) => (
                                <span key={r.id}
                                  className="px-2.5 py-1 bg-[#003580]/8 text-[#003580] rounded-lg text-xs font-medium border border-[#003580]/10">
                                  {r.nome}
                                </span>
                              ))}
                              {ricambi.length > 6 && (
                                <span className="px-2.5 py-1 bg-gray-100 text-gray-500 rounded-lg text-xs font-medium">
                                  +{ricambi.length - 6} altri
                                </span>
                              )}
                            </div>
                          </>
                        ) : (
                          <p className="text-xs text-gray-400">Nessun ricambio specificato</p>
                        )}
                      </div>

                      {/* Demolitore */}
                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-1.5">
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
                    </div>

                    {/* Colonna contatto destra */}
                    <div className="hidden sm:flex w-44 shrink-0 border-l border-gray-100 p-4 flex-col justify-between">
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Targa</p>
                        <p className="font-mono font-bold text-gray-800 tracking-widest">{veicolo.targa}</p>
                      </div>
                      <div className="mt-4">
                        <ContactReveal
                          ragioneSociale={veicolo.demolitore.ragioneSociale}
                          telefono={veicolo.demolitore.telefono}
                          email={veicolo.demolitore.email}
                        />
                        <a href={`/veicoli/${veicolo.id}`}
                          className="mt-2 block text-center text-xs text-[#003580] hover:text-[#003580]/70 font-medium transition-colors">
                          Vedi dettagli →
                        </a>
                      </div>
                    </div>
                  </div>
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
