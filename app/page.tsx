import HomeSearchCard from '../components/HomeSearchCard';

export default function Home() {
  const categorie = [
    { label: 'Meccanica', href: '/ricerca?q=motore' },
    { label: 'Carrozzeria', href: '/ricerca?q=carrozzeria' },
    { label: 'Fari e fanali', href: '/ricerca?q=faro' },
    { label: 'Interni', href: '/ricerca?q=interni' },
    { label: 'Centraline', href: '/ricerca?q=centralina' },
    { label: 'Specchietti', href: '/ricerca?q=specchietto' },
  ];

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
        {/* Utility strip */}
        <div className="border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-6 h-9 flex items-center justify-end">
            <nav className="flex items-center text-[13px] text-gray-500">
              {[
                { label: 'Magazine', href: '/magazine' },
                { label: 'Consigli per la vendita', href: '/consigli' },
                { label: 'Negozi e Aziende', href: '/aziende' },
                { label: 'Autigo per le Aziende', href: '/business' },
                { label: 'Assistenza', href: '/assistenza' },
                { label: 'Ricerche salvate', href: '/ricerche-salvate' },
                { label: 'Preferiti', href: '/preferiti' },
              ].map((l, i, arr) => (
                <span key={l.label} className="flex items-center">
                  <a href={l.href} className="px-3 hover:text-gray-900 transition-colors whitespace-nowrap">
                    {l.label}
                  </a>
                  {i < arr.length - 1 && <span className="text-gray-300">|</span>}
                </span>
              ))}
            </nav>
          </div>
        </div>

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
        <div className="w-full max-w-5xl px-4 pt-4 sm:pt-8 pb-10">
          {/* Logo Autigo grande centrato — path SVG inline */}
          <div className="flex justify-center mb-2">
            <svg viewBox="0 0 326 170" xmlns="http://www.w3.org/2000/svg" className="h-36 sm:h-44" aria-label="Autigo">
              <path fill="#4E92F5" transform="translate(10.00,86)" d="M 45.906 -11.000 L 21.797 -11.000 L 17.938 0.000 L 1.469 0.000 L 24.844 -64.500 L 43.062 -64.500 L 66.422 0.000 L 49.766 0.000 Z M 41.859 -23.000 L 33.859 -46.906 L 25.938 -23.000 Z"/>
              <path fill="#E8620A" transform="translate(73.00,90)" d="M 56.016 -51.000 L 56.016 0.000 L 40.000 0.000 L 40.000 -7.266 Q 37.641 -3.750 33.594 -1.625 Q 29.547 0.500 24.625 0.500 Q 18.828 0.500 14.367 -2.102 Q 9.906 -4.703 7.453 -9.633 Q 5.000 -14.562 5.000 -21.234 L 5.000 -51.000 L 21.016 -51.000 L 21.016 -23.719 Q 21.016 -18.688 23.578 -15.891 Q 26.141 -13.094 30.469 -13.094 Q 34.875 -13.094 37.438 -15.891 Q 40.000 -18.688 40.000 -23.719 L 40.000 -51.000 Z"/>
              <path fill="#F4B400" transform="translate(130.00,84)" d="M 34.000 -13.594 L 34.000 0.000 L 26.031 0.000 Q 17.516 0.000 12.758 -4.094 Q 8.000 -8.188 8.000 -17.453 L 8.000 -37.406 L 2.000 -37.406 L 2.000 -51.000 L 8.000 -51.000 L 8.000 -64.000 L 24.016 -64.000 L 24.016 -51.000 L 34.000 -51.000 L 34.000 -37.406 L 24.016 -37.406 L 24.016 -17.734 Q 24.016 -15.531 25.070 -14.562 Q 26.125 -13.594 28.609 -13.594 Z"/>
              <path fill="#92c522" transform="translate(162.00,90)" d="M 4.000 -65.438 Q 4.000 -69.141 6.664 -71.570 Q 9.328 -74.000 13.547 -74.000 Q 17.656 -74.000 20.328 -71.570 Q 23.000 -69.141 23.000 -65.438 Q 23.000 -61.859 20.328 -59.430 Q 17.656 -57.000 13.547 -57.000 Q 9.328 -57.000 6.664 -59.430 Q 4.000 -61.859 4.000 -65.438 Z M 21.016 -51.000 L 21.016 0.000 L 5.000 0.000 L 5.000 -51.000 Z"/>
              <path fill="#4E92F5" transform="translate(184.00,90)" d="M 41.000 -43.656 L 41.000 -51.000 L 57.016 -51.000 L 57.016 -0.188 Q 57.016 6.844 54.219 12.547 Q 51.422 18.250 45.695 21.625 Q 39.969 25.000 31.422 25.000 Q 20.062 25.000 13.000 19.633 Q 5.938 14.266 4.938 5.078 L 20.453 5.078 Q 21.172 8.016 23.875 9.711 Q 26.578 11.406 30.547 11.406 Q 35.312 11.406 38.156 8.609 Q 41.000 5.812 41.000 -0.312 L 41.000 -7.531 Q 38.734 -3.969 34.734 -1.734 Q 30.734 0.500 25.359 0.500 Q 19.094 0.500 14.000 -2.711 Q 8.906 -5.922 5.953 -11.859 Q 3.000 -17.797 3.000 -25.578 Q 3.000 -33.375 5.953 -39.266 Q 8.906 -45.156 14.000 -48.328 Q 19.094 -51.500 25.359 -51.500 Q 30.734 -51.500 34.781 -49.336 Q 38.828 -47.172 41.000 -43.656 Z M 30.016 -37.906 Q 25.406 -37.906 22.211 -34.617 Q 19.016 -31.328 19.016 -25.578 Q 19.016 -19.828 22.211 -16.461 Q 25.406 -13.094 30.016 -13.094 Q 34.609 -13.094 37.805 -16.422 Q 41.000 -19.750 41.000 -25.500 Q 41.000 -31.250 37.805 -34.578 Q 34.609 -37.906 30.016 -37.906 Z"/>
              <path fill="#E8620A" transform="translate(242.00,86)" d="M 3.000 -25.484 Q 3.000 -33.281 6.469 -39.219 Q 9.938 -45.156 15.977 -48.328 Q 22.016 -51.500 29.500 -51.500 Q 37.000 -51.500 43.031 -48.328 Q 49.062 -45.156 52.539 -39.219 Q 56.016 -33.281 56.016 -25.484 Q 56.016 -17.719 52.500 -11.781 Q 48.984 -5.844 42.898 -2.672 Q 36.812 0.500 29.328 0.500 Q 21.828 0.500 15.836 -2.672 Q 9.844 -5.844 6.422 -11.734 Q 3.000 -17.625 3.000 -25.484 Z M 40.000 -25.500 Q 40.000 -31.484 36.977 -34.695 Q 33.953 -37.906 29.516 -37.906 Q 24.984 -37.906 22.000 -34.742 Q 19.016 -31.578 19.016 -25.500 Q 19.016 -19.516 21.961 -16.305 Q 24.906 -13.094 29.344 -13.094 Q 33.766 -13.094 36.883 -16.305 Q 40.000 -19.516 40.000 -25.500 Z"/>
            </svg>
          </div>

          {/* Tagline sopra la search */}
          <p className="text-center text-xl text-gray-700 mb-6">
            Il marketplace dei ricambi auto usati
          </p>

          {/* Search bar 3 campi */}
          <HomeSearchCard />

          {/* Categorie quick-pill */}
          <div className="mt-10 flex flex-wrap justify-center gap-2">
            {categorie.map((c) => (
              <a
                key={c.label}
                href={c.href}
                className="px-4 py-1.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                {c.label}
              </a>
            ))}
          </div>

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
