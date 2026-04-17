import HomeSearchCard from '../../components/HomeSearchCard';

export default function Home2() {
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
      {/* Navbar minimale stile Google */}
      <header className="w-full">
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-end gap-6 text-sm">
          <a href="/login" className="text-gray-700 hover:underline">Accedi</a>
          <a
            href="/registrati"
            className="text-white bg-[#0064D2] hover:bg-[#0052b0] px-4 py-1.5 rounded-md font-medium"
          >
            Registrati
          </a>
        </div>
      </header>

      <main className="flex-1 w-full flex items-start justify-center">
        <div className="w-full max-w-3xl px-4 pt-20 sm:pt-32 pb-10">
          {/* Logo Autigo gigante centrato */}
          <div className="flex justify-center mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/autigo-logo.svg" alt="Autigo" className="h-20 sm:h-28" />
          </div>

          {/* Tagline */}
          <p className="text-center text-gray-500 text-base mb-8">
            Il marketplace dei ricambi auto usati
          </p>

          {/* Search bar */}
          <HomeSearchCard />

          {/* Categorie */}
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

          <p className="mt-12 text-center text-sm text-gray-400">
            Migliaia di ricambi dai demolitori di tutta Italia
          </p>
        </div>
      </main>

      <footer className="border-t border-gray-100 py-6">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
          <span>© {new Date().getFullYear()} Autigo</span>
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
