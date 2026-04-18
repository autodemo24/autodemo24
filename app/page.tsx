import HomeSearchCard from '../components/HomeSearchCard';

export default function Home() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Autigo',
    url: 'https://autigo.it',
    logo: 'https://autigo.it/images/logo-black.svg',
    description:
      'Il marketplace italiano dei ricambi auto usati. Trova ricambi da migliaia di demolitori in tutta Italia.',
  };

  const searchJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Autigo',
    url: 'https://autigo.it',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://autigo.it/ricerca?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(searchJsonLd) }} />

      {/* Top nav minimal stile Google */}
      <header className="w-full">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-end gap-6 text-sm text-gray-700">
          <a href="/ricerca" className="hover:underline">Cerca</a>
          <a href="/login" className="hover:underline">Accedi</a>
          <a
            href="/registrati"
            className="bg-[#4E92F5] text-white px-4 py-1.5 rounded-md font-medium hover:bg-[#3f7dd4] transition-colors"
          >
            Registrati
          </a>
        </div>
      </header>

      <main className="flex-1 w-full flex items-start justify-center">
        <div className="w-full max-w-2xl px-4 pt-12 sm:pt-20 pb-10">
          {/* Logo Autigo grande centrato */}
          <div className="flex justify-center mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo-black.svg" alt="Autigo" className="h-24 sm:h-28" />
          </div>

          {/* Search bar */}
          <HomeSearchCard />

          {/* Due bottoni sotto (stile Google 'Cerca con Google' / 'Mi sento fortunato') */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href="/ricerca"
              className="bg-[#f8f9fa] hover:border-gray-300 hover:shadow-sm border border-transparent text-gray-700 text-sm px-5 py-2.5 rounded transition-all"
            >
              Cerca ricambi
            </a>
            <a
              href="/ricambi"
              className="bg-[#f8f9fa] hover:border-gray-300 hover:shadow-sm border border-transparent text-gray-700 text-sm px-5 py-2.5 rounded transition-all"
            >
              Esplora tutti i ricambi
            </a>
          </div>

          {/* Tagline piccolo */}
          <p className="mt-14 text-center text-sm text-gray-500">
            Il marketplace dei ricambi auto usati · Migliaia di annunci dai demolitori di tutta Italia
          </p>
        </div>
      </main>

      {/* Footer stile Google */}
      <footer className="bg-[#f2f2f2] border-t border-gray-200 text-sm text-gray-600 mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-3 border-b border-gray-200">
          <span>Italia</span>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex gap-6">
            <a href="/chi-siamo" className="hover:underline">Chi siamo</a>
            <a href="/registrati" className="hover:underline">Vendi su Autigo</a>
            <a href="/ricambi" className="hover:underline">Esplora</a>
          </div>
          <div className="flex gap-6">
            <a href="/privacy" className="hover:underline">Privacy</a>
            <a href="/termini" className="hover:underline">Termini</a>
            <a href="/assistenza" className="hover:underline">Assistenza</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
