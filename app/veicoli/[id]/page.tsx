import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '../../../lib/prisma';
import { raggruppaRicambi } from '../../../lib/ricambi';
import PhotoGallery from './PhotoGallery';
import WhatsAppButton from './WhatsAppButton';
import ShareButtons from './ShareButtons';
import Navbar from '../../../components/Navbar';

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
      foto: { take: 1, orderBy: { copertina: 'desc' } },
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
    alternates: { canonical: `/veicoli/${veicolo.id}` },
    openGraph: {
      title: titolo,
      description: descrizione.slice(0, 160),
      type: 'article',
      url: `/veicoli/${veicolo.id}`,
      ...(foto && { images: [{ url: foto, alt: `${veicolo.marca} ${veicolo.modello}` }] }),
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
      foto: { orderBy: { copertina: 'desc' } },
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
    <div className="min-h-screen bg-[#f0f0f0] flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar backTo={{ href: '/ricerca', label: 'Torna alla ricerca' }} />

      <div className="max-w-5xl mx-auto px-4 py-6 flex-1 w-full">

        {/* ── Card bianca principale ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

          {/* Barra superiore con azioni */}
          <div className="flex items-center justify-end px-5 py-2.5 border-b border-gray-100">
            <ShareButtons />
          </div>

          {/* Foto + Info affiancate */}
          <div className="grid grid-cols-1 lg:grid-cols-5">

            {/* Foto principale — riempie il lato sinistro */}
            <div className="lg:col-span-3">
              <PhotoGallery
                fotos={veicolo.foto}
                alt={`${veicolo.marca} ${veicolo.modello}`}
              />
            </div>

            {/* Info veicolo a destra */}
            <div className="lg:col-span-2 p-6 lg:pl-7 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h1 className="text-[22px] font-bold text-gray-900 leading-tight">
                    {veicolo.marca} {veicolo.modello}
                  </h1>
                  {veicolo.versione && (
                    <p className="text-sm text-gray-500 mt-1 leading-snug">{veicolo.versione}</p>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm text-gray-500">{veicolo.demolitore.provincia}</span>
                </div>

                <div className="flex flex-wrap items-center gap-x-2 text-[13px] text-gray-500">
                  <span>{veicolo.anno}</span>
                  <span className="text-gray-300">&middot;</span>
                  <span>{veicolo.km.toLocaleString('it-IT')} km</span>
                  {veicolo.carburante && (
                    <>
                      <span className="text-gray-300">&middot;</span>
                      <span>{veicolo.carburante}</span>
                    </>
                  )}
                  {veicolo.potenzaKw != null && veicolo.potenzaKw > 0 && (
                    <>
                      <span className="text-gray-300">&middot;</span>
                      <span>{veicolo.potenzaKw} kW ({Math.round(veicolo.potenzaKw * 1.36)} CV)</span>
                    </>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Demolitore</p>
                  <p className="text-sm font-bold text-gray-900">{veicolo.demolitore.ragioneSociale}</p>
                  {veicolo.demolitore.indirizzo && (
                    <p className="text-xs text-gray-400 mt-0.5">{veicolo.demolitore.indirizzo}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2.5 mt-6">
                <WhatsAppButton
                  telefono={veicolo.demolitore.telefono}
                  marca={veicolo.marca}
                  modello={veicolo.modello}
                  anno={veicolo.anno}
                  ricambi={nomiRicambi}
                />
                <a
                  href={`tel:${veicolo.demolitore.telefono}`}
                  className="flex items-center justify-center gap-2 w-full px-5 py-2.5 border-2 border-[#003580] text-[#003580] rounded-lg text-sm font-bold hover:bg-[#003580]/5 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Mostra numero
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ── Dati tecnici ── */}
        {(veicolo.cilindrata || veicolo.carburante || veicolo.potenzaKw || veicolo.siglaMotore) && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mt-4 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Dati tecnici</h2>
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

        {/* ── Ricambi disponibili ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mt-4 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Ricambi disponibili
            <span className="ml-2 text-base font-normal text-gray-400">
              ({veicolo.ricambi.length})
            </span>
          </h2>

          {veicolo.ricambi.length === 0 ? (
            <div className="py-12 text-center">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p className="text-gray-400 text-sm">Nessun ricambio specificato per questo veicolo.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {categorieRicambi.map(({ categoria, voci }) => (
                <div key={categoria}>
                  <h3 className="text-xs font-bold text-[#003580] uppercase tracking-wider mb-2">
                    {categoria}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {voci.map((nome) => (
                      <span
                        key={nome}
                        className="px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium border border-gray-200"
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

      {/* Footer */}
      <footer className="bg-[#001f4d] text-white/50 py-8 mt-auto">
        <div className="max-w-5xl mx-auto px-4 text-center">
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
