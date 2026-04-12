import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '../../../lib/prisma';
import { raggruppaRicambi } from '../../../lib/ricambi';
import PhotoGallery from './PhotoGallery';
import WhatsAppButton from './WhatsAppButton';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const idNum = Number(id);
  if (isNaN(idNum)) return {};

  const veicolo = await prisma.veicolo.findUnique({
    where: { id: idNum },
    include: {
      foto: { take: 1 },
      ricambi: { where: { disponibile: true }, select: { nome: true }, take: 10 },
      demolitore: { select: { ragioneSociale: true, provincia: true } },
    },
  });

  if (!veicolo) return {};

  const titolo = `${veicolo.marca} ${veicolo.modello} ${veicolo.anno} — Ricambi disponibili`;
  const ricambiNomi = veicolo.ricambi.map((r) => r.nome).join(', ');
  const descrizione = `Ricambi usati per ${veicolo.marca} ${veicolo.modello} ${veicolo.anno}${veicolo.versione ? ` ${veicolo.versione}` : ''} presso ${veicolo.demolitore.ragioneSociale} (${veicolo.demolitore.provincia}).${ricambiNomi ? ` Disponibili: ${ricambiNomi}.` : ''}`;
  const foto = veicolo.foto[0]?.url;

  return {
    title: titolo,
    description: descrizione.slice(0, 160),
    alternates: {
      canonical: `/veicoli/${veicolo.id}`,
    },
    openGraph: {
      title: titolo,
      description: descrizione.slice(0, 160),
      type: 'article',
      url: `/veicoli/${veicolo.id}`,
      ...(foto && {
        images: [{ url: foto, alt: `${veicolo.marca} ${veicolo.modello}` }],
      }),
    },
    twitter: {
      card: foto ? 'summary_large_image' : 'summary',
      title: titolo,
      description: descrizione.slice(0, 160),
      ...(foto && { images: [foto] }),
    },
  };
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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `Ricambi ${veicolo.marca} ${veicolo.modello} ${veicolo.anno}`,
    description: `Ricambi usati disponibili per ${veicolo.marca} ${veicolo.modello} ${veicolo.anno}${veicolo.versione ? ` ${veicolo.versione}` : ''}. ${nomiRicambi.length} ricambi disponibili.`,
    brand: { '@type': 'Brand', name: veicolo.marca },
    ...(veicolo.foto[0] && { image: veicolo.foto[0].url }),
    offers: {
      '@type': 'Offer',
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'AutoDealer',
        name: veicolo.demolitore.ragioneSociale,
        address: {
          '@type': 'PostalAddress',
          addressLocality: veicolo.demolitore.provincia,
          addressCountry: 'IT',
        },
      },
    },
    vehicleIdentificationNumber: veicolo.targa,
    productionDate: String(veicolo.anno),
    mileageFromOdometer: {
      '@type': 'QuantitativeValue',
      value: veicolo.km,
      unitCode: 'KMT',
    },
    ...(veicolo.carburante && { fuelType: veicolo.carburante }),
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* ── Navbar ── */}
      <header className="bg-[#003580] text-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/ricerca" className="text-white/70 hover:text-white flex items-center gap-1 text-sm transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Torna alla ricerca
            </a>
            <a href="/" className="flex items-center gap-1">
              <span className="text-xl font-bold text-white">auto</span>
              <span className="text-xl font-bold text-[#FF6600]">demo24</span>
            </a>
          </div>
          <div className="flex items-center gap-4">
            <a href="/login" className="text-sm text-white/80 hover:text-white">Accedi</a>
            <a href="/registrati"
              className="px-4 py-2 bg-[#FF6600] hover:bg-orange-600 text-white rounded-lg text-sm font-semibold transition-colors">
              Registrati gratis
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full">
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
              <h1 className="text-3xl font-extrabold text-gray-900">
                {veicolo.marca} {veicolo.modello}
              </h1>
              {veicolo.versione && (
                <p className="text-base text-gray-500 mt-1">{veicolo.versione}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#003580]/8 text-[#003580] rounded-lg text-sm font-medium border border-[#003580]/10">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {veicolo.anno}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#003580]/8 text-[#003580] rounded-lg text-sm font-medium border border-[#003580]/10">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM3 5h2l2 7h10l2-7H3z" />
                  </svg>
                  {veicolo.km.toLocaleString('it-IT')} km
                </span>
                {veicolo.carburante && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#003580]/8 text-[#003580] rounded-lg text-sm font-medium border border-[#003580]/10">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 13h12l3-13H3z" />
                    </svg>
                    {veicolo.carburante}
                  </span>
                )}
                {veicolo.potenzaKw != null && veicolo.potenzaKw > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#003580]/8 text-[#003580] rounded-lg text-sm font-medium border border-[#003580]/10">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {veicolo.potenzaKw} kW ({Math.round(veicolo.potenzaKw * 1.36)} CV)
                  </span>
                )}
              </div>
            </div>

            {/* Dati tecnici */}
            {(veicolo.cilindrata || veicolo.carburante || veicolo.potenzaKw || veicolo.siglaMotore) && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-sm font-bold text-[#003580] uppercase tracking-wide mb-4">Dati tecnici</h2>
                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                  {veicolo.cilindrata && (
                    <div>
                      <dt className="text-xs text-gray-400 mb-0.5">Cilindrata</dt>
                      <dd className="text-sm font-semibold text-gray-800">{veicolo.cilindrata} cc</dd>
                    </div>
                  )}
                  {veicolo.carburante && (
                    <div>
                      <dt className="text-xs text-gray-400 mb-0.5">Alimentazione</dt>
                      <dd className="text-sm font-semibold text-gray-800">{veicolo.carburante}</dd>
                    </div>
                  )}
                  {veicolo.potenzaKw != null && veicolo.potenzaKw > 0 && (
                    <div>
                      <dt className="text-xs text-gray-400 mb-0.5">Potenza</dt>
                      <dd className="text-sm font-semibold text-gray-800">{veicolo.potenzaKw} kW ({Math.round(veicolo.potenzaKw * 1.36)} CV)</dd>
                    </div>
                  )}
                  {veicolo.siglaMotore && (
                    <div>
                      <dt className="text-xs text-gray-400 mb-0.5">Codice motore</dt>
                      <dd className="text-sm font-semibold text-gray-800 font-mono">{veicolo.siglaMotore}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {/* Ricambi disponibili */}
            <div>
              <h2 className="text-xl font-extrabold text-gray-900 mb-4">
                Ricambi disponibili
                <span className="ml-2 text-base font-normal text-gray-400">
                  ({veicolo.ricambi.length})
                </span>
              </h2>

              {veicolo.ricambi.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-12 text-center">
                  <svg className="w-12 h-12 text-gray-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <p className="text-gray-400 text-sm">Nessun ricambio specificato per questo veicolo.</p>
                </div>
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
                            className="px-3 py-1.5 bg-[#003580]/8 text-[#003580] rounded-lg text-sm font-medium border border-[#003580]/10"
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
          <div className="lg:sticky lg:top-20 self-start">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Demolitore</p>
                <h3 className="text-lg font-bold text-gray-900">{veicolo.demolitore.ragioneSociale}</h3>
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
                  <div className="w-9 h-9 bg-[#003580]/10 group-hover:bg-[#003580]/20 rounded-lg flex items-center justify-center transition-colors">
                    <svg className="w-4 h-4 text-[#003580]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-[#003580]">
                    {veicolo.demolitore.telefono}
                  </span>
                </a>

                <a
                  href={`mailto:${veicolo.demolitore.email}`}
                  className="flex items-center gap-3 group"
                >
                  <div className="w-9 h-9 bg-[#003580]/10 group-hover:bg-[#003580]/20 rounded-lg flex items-center justify-center transition-colors">
                    <svg className="w-4 h-4 text-[#003580]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-600 group-hover:text-[#003580] break-all">
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
