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
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: 'Italian',
    },
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

  // Macro-categorie ricambi — palette unificata: navy su sfondo chiaro
  const categorie = [
    {
      label: 'Meccanica',
      sub: 'Motori, cambi, radiatori',
      href: '/ricerca?q=motore',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      label: 'Carrozzeria',
      sub: 'Cofani, paraurti, porte',
      href: '/ricerca?q=carrozzeria',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 13l2-6h14l2 6m-18 0v5a1 1 0 001 1h1a1 1 0 001-1v-1h12v1a1 1 0 001 1h1a1 1 0 001-1v-5m-18 0h18M7 16h.01M17 16h.01" />
        </svg>
      ),
    },
    {
      label: 'Illuminazione',
      sub: 'Fari, fanali, specchietti',
      href: '/ricerca?q=faro',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
    {
      label: 'Interni',
      sub: 'Cruscotti, sedili, airbag',
      href: '/ricerca?q=interni',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      ),
    },
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

      <main className="flex-1 w-full">
        <div className="max-w-5xl mx-auto px-4 pt-16 pb-6 w-full">
          {/* ── Hero heading ── */}
          <div className="text-center mb-10">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
              Il marketplace dei <span className="text-[#FF6600]">ricambi auto usati</span>
            </h1>
            <p className="mt-3 text-gray-500 text-sm sm:text-base max-w-xl mx-auto">
              Migliaia di ricambi dai demolitori di tutta Italia
            </p>
          </div>

          {/* ── Search bar eBay-style ── */}
          <div className="mb-14">
            <HomeSearchCard />
          </div>

          {/* ── Macro-categorie ricambi ── */}
          <div className="mt-5 max-w-4xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-3">
            {categorie.map((c) => (
              <a
                key={c.label}
                href={c.href}
                className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 flex items-center gap-3 hover:border-[#003580] hover:shadow-sm transition-all group"
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#003580]/10 text-[#003580] group-hover:bg-[#003580] group-hover:text-white shrink-0 transition-colors">
                  {c.icon}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-gray-900 leading-tight">{c.label}</p>
                  <p className="text-[11px] text-gray-500 truncate leading-tight mt-0.5">{c.sub}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

      </main>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-1">
              <span className="text-lg font-extrabold text-[#003580]">auto</span>
              <span className="text-lg font-extrabold text-[#FF6600]">demo24</span>
              <span className="ml-2 text-sm text-gray-400">.it</span>
            </div>
            <p className="text-sm text-gray-400">Il portale italiano dei ricambi auto usati</p>
            <div className="flex gap-5 text-sm text-gray-400">
              <a href="/ricerca" className="hover:text-[#003580] transition-colors">Cerca</a>
              <a href="/registrati" className="hover:text-[#003580] transition-colors">Registrati</a>
              <a href="/login" className="hover:text-[#003580] transition-colors">Accedi</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
