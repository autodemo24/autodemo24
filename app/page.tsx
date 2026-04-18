import HomeSearchCard from '../components/HomeSearchCard';
import Navbar from '../components/Navbar';

export default async function Home() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Autigo',
    url: 'https://autigo.it',
    logo: 'https://autigo.it/images/logo.png',
    description:
      'Il portale italiano dei ricambi auto usati. Trova ricambi da migliaia di autodemolitori in tutta Italia.',
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
        <div className="w-full max-w-3xl px-4 pt-16 sm:pt-24 pb-10">
          {/* Hero text */}
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 leading-tight">
              Il marketplace dei <span className="text-[#2476b8]">ricambi auto usati</span>
            </h1>
            <p className="mt-4 text-gray-500 text-base sm:text-lg max-w-xl mx-auto">
              Migliaia di ricambi dai demolitori di tutta Italia
            </p>
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
        </div>
      </main>

      {/* Footer minimale */}
      <footer className="border-t border-gray-100 py-6 mt-auto">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
          <span>© {new Date().getFullYear()} autigo.it</span>
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
