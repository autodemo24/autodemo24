import { prisma } from '../lib/prisma';
import DemoHero from '../components/DemoHero';
import Navbar from '../components/Navbar';

export default async function Home() {
  const [totVeicoli, totDemolitori] = await Promise.all([
    prisma.veicolo.count(),
    prisma.demolitore.count(),
  ]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'autodemo24',
    url: 'https://www.autodemo24.it',
    logo: 'https://www.autodemo24.it/images/logo.png',
    description:
      'Il portale italiano dei demolitori auto. Trova ricambi usati da migliaia di autodemolitori in tutta Italia.',
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
        urlTemplate: 'https://www.autodemo24.it/ricerca?ricambio={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f4f4]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(searchJsonLd) }}
      />

      <Navbar />

      {/* ── Hero con immagine di sfondo ── */}
      <section className="relative overflow-hidden min-h-[420px] sm:min-h-[480px] flex items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/hero-junkyard.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#001f4d]/90 via-[#003580]/80 to-[#003580]/60" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 py-16 sm:py-20 w-full">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight max-w-2xl drop-shadow-lg">
            Trova ricambi auto dai<br />
            <span className="text-[#FF6600]">demolitori italiani</span>
          </h1>
          <p className="mt-4 text-white/70 text-lg max-w-xl drop-shadow">
            Cerca tra migliaia di veicoli disponibili nei piazzali dei demolitori in tutta Italia
          </p>
        </div>
      </section>

      {/* ── Search card (sovrapposta all'hero) ── */}
      <div className="max-w-5xl mx-auto px-4 -mt-20 sm:-mt-24 relative z-20 w-full">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <DemoHero />

          {/* ── Categorie carrozzeria ── */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-sm font-bold text-gray-700 mb-4">Cerca per tipo di veicolo</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
              {[
                'Berlina', 'SUV', 'Station Wagon', 'City car',
                'Monovolume', 'Coupé', 'Cabrio', 'Furgone',
              ].map((label) => (
                <a
                  key={label}
                  href={`/ricerca?modello=${encodeURIComponent(label)}`}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 hover:border-[#003580]/30 hover:shadow-md transition-all group cursor-pointer"
                >
                  <div className="w-12 h-12 bg-gray-50 group-hover:bg-[#003580]/5 rounded-lg flex items-center justify-center transition-colors">
                    <svg className="w-7 h-7 text-gray-400 group-hover:text-[#003580] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M3 11l2-6h14l2 6M3 11v5h18v-5" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-gray-600 group-hover:text-[#003580] text-center leading-tight">{label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="max-w-5xl mx-auto px-4 mt-10 w-full">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { value: totVeicoli.toLocaleString('it-IT'), label: 'Veicoli disponibili', color: 'text-[#003580]' },
            { value: totDemolitori.toLocaleString('it-IT'), label: 'Demolitori registrati', color: 'text-[#FF6600]' },
            { value: '110', label: 'Province coperte', color: 'text-[#003580]' },
            { value: '100%', label: 'Gratuito per chi cerca', color: 'text-[#FF6600]' },
          ].map(({ value, label, color }) => (
            <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center">
              <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Come funziona ── */}
      <section id="come-funziona" className="max-w-5xl mx-auto px-4 mt-16 mb-16 w-full">
        <h2 className="text-2xl font-extrabold text-gray-900 mb-3 text-center">Come funziona</h2>
        <p className="text-center text-gray-500 mb-10">Tre semplici passi per trovare il ricambio che cerchi</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {[
            {
              title: 'Cerca il ricambio',
              desc: 'Inserisci marca, modello e anno del tuo veicolo per trovare i demolitori che ce l\'hanno',
              icon: (
                <svg className="w-8 h-8 text-[#003580]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              ),
            },
            {
              title: 'Sfoglia le auto',
              desc: 'Vedi le foto e i ricambi disponibili direttamente dal piazzale del demolitore',
              icon: (
                <svg className="w-8 h-8 text-[#003580]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM3 5h2l2 7h10l2-7H3z" />
                </svg>
              ),
            },
            {
              title: 'Contatta il demolitore',
              desc: 'Scrivi direttamente al demolitore per richiedere il pezzo che ti serve',
              icon: (
                <svg className="w-8 h-8 text-[#003580]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              ),
            },
          ].map(({ title, desc, icon }) => (
            <div key={title} className="relative bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
              <div className="w-16 h-16 bg-[#003580]/10 rounded-full flex items-center justify-center mx-auto mb-5">
                {icon}
              </div>
              <h3 className="text-lg font-bold text-[#003580] mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA demolitori con immagine di sfondo ── */}
      <section className="relative overflow-hidden py-20">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/hero-pex2.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#003580]/85" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-3">Sei un demolitore?</h2>
          <p className="text-white/60 mb-8 text-lg">
            Registrati gratis e pubblica i tuoi veicoli. Raggiungi migliaia di acquirenti ogni giorno.
          </p>
          <a href="/registrati"
            className="inline-block px-8 py-4 bg-[#FF6600] hover:bg-orange-600 text-white rounded-full font-bold text-lg transition-colors">
            Inizia gratis
          </a>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-gray-200 py-10 mt-auto">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-1">
              <span className="text-lg font-extrabold text-[#003580]">auto</span>
              <span className="text-lg font-extrabold text-[#FF6600]">demo24</span>
              <span className="ml-2 text-sm text-gray-400">.it</span>
            </div>
            <p className="text-sm text-gray-400">Il portale italiano dei demolitori auto</p>
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
