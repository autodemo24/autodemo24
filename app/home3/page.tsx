import HomeSearchCard from '../../components/HomeSearchCard';

export default function Home3() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Top utility bar tipo Google */}
      <header className="w-full">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-end gap-6 text-sm text-gray-700">
          <a href="/ricerca" className="hover:underline">Cerca</a>
          <a href="/login" className="hover:underline">Accedi</a>
          <a
            href="/registrati"
            className="bg-[#4285F4] text-white px-4 py-1.5 rounded-md font-medium hover:bg-[#3367d6] transition-colors"
          >
            Registrati
          </a>
        </div>
      </header>

      <main className="flex-1 w-full flex items-start justify-center">
        <div className="w-full max-w-2xl px-4 pt-24 sm:pt-32 pb-10">
          {/* Logo Autigo gigante centrato */}
          <div className="flex justify-center mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/autigo-logo-google.svg" alt="Autigo" className="h-20 sm:h-24" />
          </div>

          {/* Search bar */}
          <HomeSearchCard />

          {/* Bottoni sotto (stile Google: 'Cerca con Google' + 'Mi sento fortunato') */}
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

          {/* Small footer text */}
          <p className="mt-14 text-center text-sm text-gray-500">
            Il marketplace dei ricambi auto usati · Migliaia di annunci dai demolitori di tutta Italia
          </p>
        </div>
      </main>

      {/* Footer stile Google */}
      <footer className="bg-[#f2f2f2] border-t border-gray-200 text-sm text-gray-600">
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
