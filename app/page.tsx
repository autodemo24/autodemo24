import HomeSearchCard from '../components/HomeSearchCard';
import Navbar from '../components/Navbar';

export default async function Home() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'autodemo24',
    url: 'https://www.autodemo24.it',
    logo: 'https://www.autodemo24.it/images/logo.png',
    description:
      'Il portale italiano dei ricambi auto usati. Trova ricambi da migliaia di autodemolitori in tutta Italia.',
  };

  const searchJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'autodemo24',
    url: 'https://www.autodemo24.it',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://www.autodemo24.it/ricerca?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const categorie = [
    { label: 'Meccanica', href: '/ricerca?q=motore' },
    { label: 'Carrozzeria', href: '/ricerca?q=carrozzeria' },
    { label: 'Fari e fanali', href: '/ricerca?q=faro' },
    { label: 'Interni', href: '/ricerca?q=interni' },
    { label: 'Centraline', href: '/ricerca?q=centralina' },
    { label: 'Specchietti', href: '/ricerca?q=specchietto' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(searchJsonLd) }}
      />

      <Navbar />

      <main className="flex-1 w-full flex items-start justify-center">
        <div className="w-full max-w-3xl px-4 pt-20 sm:pt-28 pb-10">
          {/* Logo grande centrato */}
          <div className="flex justify-center mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo-black.svg" alt="autodemo24.it" className="h-16 sm:h-20" />
          </div>

          {/* Search bar */}
          <HomeSearchCard />

          {/* Categorie quick-pill */}
          <div className="mt-8 flex flex-wrap justify-center gap-2">
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

          {/* Tagline piccolo */}
          <p className="mt-10 text-center text-sm text-gray-500">
            Migliaia di ricambi auto usati dai demolitori di tutta Italia
          </p>
        </div>
      </main>

      {/* Footer minimale */}
      <footer className="border-t border-gray-100 py-6 mt-auto">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
          <span>© {new Date().getFullYear()} autodemo24.it</span>
          <div className="flex gap-6">
            <a href="/ricerca" className="hover:text-gray-900 transition-colors">Cerca</a>
            <a href="/registrati" className="hover:text-gray-900 transition-colors">Registrati</a>
            <a href="/login" className="hover:text-gray-900 transition-colors">Accedi</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
