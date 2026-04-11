import { redirect } from 'next/navigation';
import { getSession } from '../../../lib/session';
import { prisma } from '../../../lib/prisma';
import VeicoloForm from './VeicoloForm';

function PlaceholderFoto() {
  return (
    <div className="w-full h-40 bg-gray-100 rounded-t-xl flex items-center justify-center">
      <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M4 16l4-4a2 2 0 012.83 0L14 15m2-2l1.17-1.17a2 2 0 012.83 0L22 14M14 8a2 2 0 11-4 0 2 2 0 014 0zM3 20h18a1 1 0 001-1V5a1 1 0 00-1-1H3a1 1 0 00-1 1v14a1 1 0 001 1z" />
      </svg>
    </div>
  );
}

export default async function VeicoliPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const veicoli = await prisma.veicolo.findMany({
    where: { demolitoreid: session.id },
    include: { foto: true, ricambi: true },
    orderBy: { id: 'desc' },
  });

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/dashboard" className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </a>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-red-600">auto</span>
              <span className="text-2xl font-bold text-gray-800">demo24</span>
            </div>
          </div>
          <span className="text-sm text-gray-500 hidden sm:block">{session.ragioneSociale}</span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Titolo pagina */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">I miei veicoli</h1>
          <p className="text-gray-500 mt-1">
            {veicoli.length === 0
              ? 'Nessun veicolo pubblicato ancora.'
              : `${veicoli.length} veicol${veicoli.length === 1 ? 'o pubblicato' : 'i pubblicati'}`}
          </p>
        </div>

        {/* Form per nuovo veicolo */}
        <VeicoloForm />

        {/* Lista veicoli */}
        {veicoli.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm">
            <svg className="w-16 h-16 text-gray-200 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM3 5h2l2 7h10l2-7H3z" />
            </svg>
            <p className="text-gray-400 text-lg">Pubblica il tuo primo veicolo usando il form qui sopra</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {veicoli.map((veicolo) => {
              const primaFoto = veicolo.foto[0]?.url ?? null;
              const ricambiDisponibili = veicolo.ricambi.filter((r) => r.disponibile);

              return (
                <div key={veicolo.id} className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
                  {/* Foto */}
                  {primaFoto ? (
                    <img
                      src={primaFoto}
                      alt={`${veicolo.marca} ${veicolo.modello}`}
                      className="w-full h-40 object-cover"
                    />
                  ) : (
                    <PlaceholderFoto />
                  )}

                  {/* Info veicolo */}
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h2 className="text-lg font-bold text-gray-800">
                          {veicolo.marca} {veicolo.modello}
                        </h2>
                        <p className="text-sm text-gray-500">{veicolo.anno}</p>
                      </div>
                      {/* Badge stato */}
                      <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                        Pubblicato
                      </span>
                    </div>

                    {/* Dettagli */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono font-semibold tracking-wider">
                        {veicolo.targa}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                        {veicolo.km.toLocaleString('it-IT')} km
                      </span>
                    </div>

                    {/* Ricambi */}
                    <div className="mt-auto">
                      {ricambiDisponibili.length > 0 ? (
                        <>
                          <p className="text-xs font-medium text-gray-500 mb-1.5">
                            {ricambiDisponibili.length} ricamb{ricambiDisponibili.length === 1 ? 'io' : 'i'} disponibil{ricambiDisponibili.length === 1 ? 'e' : 'i'}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {ricambiDisponibili.slice(0, 4).map((r) => (
                              <span key={r.id} className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs">
                                {r.nome}
                              </span>
                            ))}
                            {ricambiDisponibili.length > 4 && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                                +{ricambiDisponibili.length - 4} altri
                              </span>
                            )}
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-gray-400">Nessun ricambio specificato</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
