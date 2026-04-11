import { notFound } from 'next/navigation';
import { prisma } from '../../../lib/prisma';
import { raggruppaRicambi } from '../../../lib/ricambi';
import PhotoGallery from './PhotoGallery';
import WhatsAppButton from './WhatsAppButton';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function VeicoloPage({ params }: PageProps) {
  const { id } = await params;
  const idNum = Number(id);
  if (isNaN(idNum)) notFound();

  const veicolo = await prisma.veicolo.findUnique({
    where: { id: idNum },
    include: {
      foto: true,
      ricambi: { where: { disponibile: true }, orderBy: { nome: 'asc' } },
      demolitore: {
        select: {
          ragioneSociale: true,
          provincia: true,
          indirizzo: true,
          telefono: true,
          email: true,
        },
      },
    },
  });

  if (!veicolo) notFound();

  const categorieRicambi = raggruppaRicambi(veicolo.ricambi.map((r) => r.nome));
  const nomiRicambi = veicolo.ricambi.map((r) => r.nome);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a
              href="/ricerca"
              className="text-gray-400 hover:text-gray-600 flex items-center gap-1 text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Ricerca
            </a>
            <span className="text-gray-200">/</span>
            <a href="/" className="flex items-center gap-1">
              <span className="text-xl font-bold text-red-600">auto</span>
              <span className="text-xl font-bold text-gray-800">demo24</span>
            </a>
          </div>
          <div className="flex gap-3">
            <a href="/login" className="px-3 py-1.5 text-gray-600 hover:text-red-600 font-medium text-sm">
              Accedi
            </a>
            <a href="/registrati" className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm">
              Registrati
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Galleria */}
        <PhotoGallery
          fotos={veicolo.foto}
          alt={`${veicolo.marca} ${veicolo.modello}`}
        />

        {/* Griglia contenuto */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Colonna sinistra (2/3) ── */}
          <div className="lg:col-span-2 space-y-8">

            {/* Titolo e badge */}
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                {veicolo.marca} {veicolo.modello}
              </h1>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {veicolo.anno}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM3 5h2l2 7h10l2-7H3z" />
                  </svg>
                  {veicolo.km.toLocaleString('it-IT')} km
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-mono font-semibold tracking-widest">
                  {veicolo.targa}
                </span>
              </div>
            </div>

            {/* Ricambi disponibili */}
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Ricambi disponibili
                <span className="ml-2 text-base font-normal text-gray-400">
                  ({veicolo.ricambi.length})
                </span>
              </h2>

              {veicolo.ricambi.length === 0 ? (
                <p className="text-gray-400 text-sm">Nessun ricambio specificato per questo veicolo.</p>
              ) : (
                <div className="space-y-5">
                  {categorieRicambi.map(({ categoria, voci }) => (
                    <div key={categoria}>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        {categoria}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {voci.map((nome) => (
                          <span
                            key={nome}
                            className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm font-medium"
                          >
                            {nome}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Colonna destra: contatto (sticky) ── */}
          <div className="lg:sticky lg:top-8 self-start">
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-5">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Demolitore</p>
                <h3 className="text-lg font-bold text-gray-800">{veicolo.demolitore.ragioneSociale}</h3>
                {veicolo.demolitore.provincia && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm text-gray-500">{veicolo.demolitore.provincia}</span>
                  </div>
                )}
                {veicolo.demolitore.indirizzo && (
                  <p className="text-xs text-gray-400 mt-0.5 pl-5">{veicolo.demolitore.indirizzo}</p>
                )}
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-3">
                <a
                  href={`tel:${veicolo.demolitore.telefono}`}
                  className="flex items-center gap-3 group"
                >
                  <div className="w-8 h-8 bg-gray-100 group-hover:bg-red-50 rounded-lg flex items-center justify-center transition-colors">
                    <svg className="w-4 h-4 text-gray-500 group-hover:text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-red-600">
                    {veicolo.demolitore.telefono}
                  </span>
                </a>

                <a
                  href={`mailto:${veicolo.demolitore.email}`}
                  className="flex items-center gap-3 group"
                >
                  <div className="w-8 h-8 bg-gray-100 group-hover:bg-red-50 rounded-lg flex items-center justify-center transition-colors">
                    <svg className="w-4 h-4 text-gray-500 group-hover:text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-600 group-hover:text-red-600 break-all">
                    {veicolo.demolitore.email}
                  </span>
                </a>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <WhatsAppButton
                  telefono={veicolo.demolitore.telefono}
                  marca={veicolo.marca}
                  modello={veicolo.modello}
                  anno={veicolo.anno}
                  ricambi={nomiRicambi}
                />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 py-8 text-center mt-16">
        <a href="/" className="text-lg font-bold text-white mb-2 block">autodemo24.it</a>
        <p>Il portale italiano dei demolitori auto</p>
      </footer>
    </main>
  );
}
