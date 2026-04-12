import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '../../../../lib/prisma';
import { raggruppaRicambi } from '../../../../lib/ricambi';

interface PageProps {
  params: Promise<{ marca: string; modello: string }>;
}

function decodeSeoSlug(slug: string): string {
  return decodeURIComponent(slug).replace(/-/g, ' ');
}

function toSeoSlug(value: string): string {
  return encodeURIComponent(value.toLowerCase().replace(/\s+/g, '-'));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { marca, modello } = await params;
  const marcaDecoded = decodeSeoSlug(marca);
  const modelloDecoded = decodeSeoSlug(modello);

  const count = await prisma.veicolo.count({
    where: {
      marca: { equals: marcaDecoded, mode: 'insensitive' },
      modello: { equals: modelloDecoded, mode: 'insensitive' },
      pubblicato: true,
      ricambi: { some: { disponibile: true } },
    },
  });

  if (count === 0) return {};

  const titolo = `Ricambi usati ${marcaDecoded} ${modelloDecoded} — Pezzi disponibili dai demolitori`;
  const descrizione = `Trova ricambi usati per ${marcaDecoded} ${modelloDecoded} da ${count} ${count === 1 ? 'veicolo disponibile' : 'veicoli disponibili'} presso i demolitori italiani. Paraurti, fari, motori, interni e molto altro.`;

  return {
    title: titolo,
    description: descrizione,
    alternates: {
      canonical: `/ricambi/${toSeoSlug(marcaDecoded)}/${toSeoSlug(modelloDecoded)}`,
    },
    openGraph: {
      title: titolo,
      description: descrizione,
      url: `/ricambi/${toSeoSlug(marcaDecoded)}/${toSeoSlug(modelloDecoded)}`,
    },
  };
}

export default async function RicambiMarcaModelloPage({ params }: PageProps) {
  const { marca, modello } = await params;
  const marcaDecoded = decodeSeoSlug(marca);
  const modelloDecoded = decodeSeoSlug(modello);

  const veicoli = await prisma.veicolo.findMany({
    where: {
      marca: { equals: marcaDecoded, mode: 'insensitive' },
      modello: { equals: modelloDecoded, mode: 'insensitive' },
      pubblicato: true,
      ricambi: { some: { disponibile: true } },
    },
    include: {
      foto: { take: 1 },
      ricambi: { where: { disponibile: true }, orderBy: { nome: 'asc' } },
      demolitore: { select: { ragioneSociale: true, provincia: true } },
    },
    orderBy: { id: 'desc' },
  });

  if (veicoli.length === 0) notFound();

  // Raccogliamo tutti i nomi ricambi unici
  const tuttiRicambiSet = new Set<string>();
  veicoli.forEach((v) => v.ricambi.forEach((r) => tuttiRicambiSet.add(r.nome)));
  const tuttiRicambiNomi = Array.from(tuttiRicambiSet).sort();
  const categorieRicambi = raggruppaRicambi(tuttiRicambiNomi);

  const totDemolitori = new Set(veicoli.map((v) => v.demolitore.ragioneSociale)).size;

  // Prendiamo marca/modello dal primo risultato per avere il case corretto
  const marcaDisplay = veicoli[0].marca;
  const modelloDisplay = veicoli[0].modello;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Ricambi usati ${marcaDisplay} ${modelloDisplay}`,
    description: `${tuttiRicambiNomi.length} ricambi usati disponibili per ${marcaDisplay} ${modelloDisplay} da ${totDemolitori} demolitori italiani.`,
    numberOfItems: tuttiRicambiNomi.length,
    itemListElement: tuttiRicambiNomi.map((nome, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Product',
        name: `${nome} ${marcaDisplay} ${modelloDisplay}`,
        description: `${nome} usato per ${marcaDisplay} ${modelloDisplay}`,
        brand: { '@type': 'Brand', name: marcaDisplay },
        offers: {
          '@type': 'Offer',
          availability: 'https://schema.org/InStock',
        },
      },
    })),
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Navbar */}
      <header className="bg-[#003580] text-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-1">
              <span className="text-xl font-bold text-white">auto</span>
              <span className="text-xl font-bold text-[#FF6600]">demo24</span>
            </a>
          </div>
          <div className="flex items-center gap-4">
            <a href="/ricerca" className="text-sm text-white/80 hover:text-white">Cerca</a>
            <a href="/login" className="text-sm text-white/80 hover:text-white">Accedi</a>
            <a href="/registrati"
              className="px-4 py-2 bg-[#FF6600] hover:bg-orange-600 text-white rounded-lg text-sm font-semibold transition-colors">
              Registrati gratis
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-10 flex-1 w-full">

        {/* Breadcrumb */}
        <nav className="text-sm text-gray-400 mb-6 flex items-center gap-1.5">
          <a href="/" className="hover:text-[#003580]">Home</a>
          <span>/</span>
          <a href="/ricambi" className="hover:text-[#003580]">Ricambi</a>
          <span>/</span>
          <a href={`/ricambi/${toSeoSlug(marcaDisplay)}`} className="hover:text-[#003580]">{marcaDisplay}</a>
          <span>/</span>
          <span className="text-gray-600">{modelloDisplay}</span>
        </nav>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
            Ricambi usati {marcaDisplay} {modelloDisplay}
          </h1>
          <p className="mt-3 text-gray-500 text-lg">
            {tuttiRicambiNomi.length} ricambi disponibili da {veicoli.length} {veicoli.length === 1 ? 'veicolo' : 'veicoli'} presso {totDemolitori} {totDemolitori === 1 ? 'demolitore' : 'demolitori'}
          </p>
        </div>

        {/* Tutti i ricambi disponibili */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-5">
            Tutti i ricambi disponibili per {marcaDisplay} {modelloDisplay}
          </h2>
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
        </section>

        {/* Lista veicoli */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-5">
            Veicoli {marcaDisplay} {modelloDisplay} disponibili
          </h2>
          <div className="space-y-4">
            {veicoli.map((veicolo) => {
              const foto = veicolo.foto[0]?.url;
              return (
                <a
                  key={veicolo.id}
                  href={`/veicoli/${veicolo.id}`}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row overflow-hidden hover:shadow-lg hover:border-gray-200 transition-all group"
                >
                  {/* Foto */}
                  <div className="shrink-0 w-full sm:w-56 h-48 sm:h-auto relative bg-gray-100">
                    {foto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={foto}
                        alt={`${veicolo.marca} ${veicolo.modello} ${veicolo.anno}`}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300 sm:min-h-[180px]"
                      />
                    ) : (
                      <div className="w-full h-full sm:min-h-[180px] flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M4 16l4-4a2 2 0 012.83 0L14 15m2-2l1.17-1.17a2 2 0 012.83 0L22 14M14 8a2 2 0 11-4 0 2 2 0 014 0zM3 20h18a1 1 0 001-1V5a1 1 0 00-1-1H3a1 1 0 00-1 1v14a1 1 0 001 1z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Contenuto */}
                  <div className="flex-1 p-5 min-w-0 flex flex-col">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#003580] transition-colors">
                      {veicolo.marca} {veicolo.modello} {veicolo.anno}
                    </h3>
                    {veicolo.versione && (
                      <p className="text-sm text-gray-500 mt-0.5">{veicolo.versione}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-1 gap-y-1 mt-2 text-sm text-gray-600">
                      <span>{veicolo.anno}</span>
                      <span className="text-gray-300 mx-1">|</span>
                      <span>{veicolo.km.toLocaleString('it-IT')} km</span>
                      {veicolo.carburante && (
                        <>
                          <span className="text-gray-300 mx-1">|</span>
                          <span>{veicolo.carburante}</span>
                        </>
                      )}
                    </div>

                    <p className="mt-3 text-sm text-gray-600">
                      <span className="font-bold text-[#003580]">{veicolo.ricambi.length} ricambi</span>
                      {' — '}
                      {veicolo.ricambi.slice(0, 6).map((r) => r.nome).join(', ')}
                      {veicolo.ricambi.length > 6 && `, +${veicolo.ricambi.length - 6} altri`}
                    </p>

                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
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
                        Vedi dettagli →
                      </span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </section>

        {/* Testo SEO */}
        <section className="mt-16 prose prose-gray max-w-none">
          <h2>Ricambi {marcaDisplay} {modelloDisplay} usati in Italia</h2>
          <p>
            Stai cercando ricambi usati per la tua {marcaDisplay} {modelloDisplay}? Su autodemo24 trovi
            {' '}{tuttiRicambiNomi.length} pezzi di ricambio disponibili da {totDemolitori}{' '}
            {totDemolitori === 1 ? 'demolitore autorizzato' : 'demolitori autorizzati'} in tutta Italia.
            Dai un&apos;occhiata ai ricambi disponibili — carrozzeria, meccanica, interni, illuminazione e
            molto altro — e contatta direttamente il demolitore per richiedere il pezzo che ti serve.
          </p>
        </section>
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
