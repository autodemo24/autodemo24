import { prisma } from '../../lib/prisma';
import SearchForm from './SearchForm';
import ContactReveal from './ContactReveal';

interface PageProps {
  searchParams: Promise<{
    marca?: string;
    modello?: string;
    anno?: string;
    provincia?: string;
  }>;
}

function PlaceholderFoto() {
  return (
    <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
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

  const veicoli = await prisma.veicolo.findMany({
    where: {
      ...(marca && { marca: { contains: marca, mode: 'insensitive' as const } }),
      ...(modello && { modello: { contains: modello, mode: 'insensitive' as const } }),
      ...(annoNum && { anno: annoNum }),
      ...(provincia && { demolitore: { provincia: { contains: provincia, mode: 'insensitive' as const } } }),
    },
    include: {
      foto: { take: 1 },
      ricambi: { where: { disponibile: true } },
      demolitore: {
        select: {
          ragioneSociale: true,
          provincia: true,
          telefono: true,
          email: true,
        },
      },
    },
    orderBy: { id: 'desc' },
    take: 60,
  });

  const hasFilters = marca || modello || annoNum || provincia;

  const activeFilters = [
    marca && `Marca: ${marca}`,
    modello && `Modello: ${modello}`,
    annoNum && `Anno: ${annoNum}`,
    provincia && `Provincia: ${provincia}`,
  ].filter(Boolean) as string[];

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-red-600">auto</span>
            <span className="text-2xl font-bold text-gray-800">demo24</span>
          </a>
          <div className="flex gap-3">
            <a href="/login" className="px-4 py-2 text-gray-600 hover:text-red-600 font-medium text-sm">
              Accedi
            </a>
            <a href="/registrati" className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm">
              Sei un demolitore? Registrati
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Barra di ricerca */}
        <div className="mb-6">
          <SearchForm
            marca={marca}
            modello={modello}
            anno={annoNum?.toString()}
            provincia={provincia}
          />
        </div>

        {/* Filtri attivi + conteggio */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-800">{veicoli.length}</span>{' '}
            veicol{veicoli.length === 1 ? 'o trovato' : 'i trovati'}
            {hasFilters ? ' per i filtri selezionati' : ' — mostrando tutti i veicoli'}
          </p>
          {activeFilters.map((f) => (
            <span key={f} className="inline-flex items-center px-2.5 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium">
              {f}
            </span>
          ))}
          {hasFilters && (
            <a href="/ricerca" className="text-xs text-gray-400 hover:text-gray-600 underline">
              Rimuovi filtri
            </a>
          )}
        </div>

        {/* Risultati */}
        {veicoli.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm py-20 text-center">
            <svg className="w-16 h-16 text-gray-200 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM3 5h2l2 7h10l2-7H3z" />
            </svg>
            <p className="text-gray-400 text-lg mb-2">Nessun veicolo trovato</p>
            <p className="text-gray-400 text-sm">Prova a modificare i filtri di ricerca</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {veicoli.map((veicolo) => {
              const primaFoto = veicolo.foto[0]?.url ?? null;
              const ricambi = veicolo.ricambi;

              return (
                <div key={veicolo.id} className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
                  {/* Foto — cliccabile */}
                  <a href={`/veicoli/${veicolo.id}`} className="block">
                  {primaFoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={primaFoto}
                      alt={`${veicolo.marca} ${veicolo.modello}`}
                      className="w-full h-48 object-cover hover:opacity-90 transition-opacity"
                    />
                  ) : (
                    <PlaceholderFoto />
                  )}
                  </a>

                  {/* Body */}
                  <div className="p-4 flex flex-col flex-1 gap-3">
                    {/* Titolo — cliccabile */}
                    <div>
                      <a href={`/veicoli/${veicolo.id}`} className="hover:text-red-600 transition-colors">
                        <h2 className="text-lg font-bold text-gray-800 leading-tight">
                          {veicolo.marca} {veicolo.modello}
                        </h2>
                        {veicolo.versione && (
                          <p className="text-xs text-gray-500 mt-0.5 leading-tight">{veicolo.versione}</p>
                        )}
                      </a>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className="text-sm text-gray-500">{veicolo.anno}</span>
                        <span className="text-gray-300">·</span>
                        <span className="text-sm text-gray-500">
                          {veicolo.km.toLocaleString('it-IT')} km
                        </span>
                        {veicolo.cilindrata && (
                          <>
                            <span className="text-gray-300">·</span>
                            <span className="text-sm text-gray-500">{veicolo.cilindrata} cc</span>
                          </>
                        )}
                        {veicolo.carburante && (
                          <>
                            <span className="text-gray-300">·</span>
                            <span className="text-sm text-gray-500">{veicolo.carburante}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Demolitore */}
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

                    {/* Ricambi disponibili */}
                    <div className="flex-1">
                      {ricambi.length > 0 ? (
                        <>
                          <p className="text-xs font-medium text-gray-500 mb-1.5">
                            {ricambi.length} ricamb{ricambi.length === 1 ? 'io' : 'i'} disponibil{ricambi.length === 1 ? 'e' : 'i'}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {ricambi.slice(0, 5).map((r) => (
                              <span key={r.id} className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs">
                                {r.nome}
                              </span>
                            ))}
                            {ricambi.length > 5 && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                                +{ricambi.length - 5} altri
                              </span>
                            )}
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-gray-400">Nessun ricambio specificato</p>
                      )}
                    </div>

                    {/* Contatto */}
                    <div className="mt-1">
                      <ContactReveal
                        ragioneSociale={veicolo.demolitore.ragioneSociale}
                        telefono={veicolo.demolitore.telefono}
                        email={veicolo.demolitore.email}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 py-8 text-center mt-16">
        <a href="/" className="text-lg font-bold text-white mb-2 block">autodemo24.it</a>
        <p>Il portale italiano dei demolitori auto</p>
      </footer>
    </main>
  );
}
