import type { Metadata } from 'next';
import { prisma } from '../../lib/prisma';

export const metadata: Metadata = {
  title: 'Ricambi auto usati per marca — Tutti i pezzi disponibili',
  description:
    'Sfoglia i ricambi auto usati disponibili per marca dai demolitori italiani. Trova paraurti, fari, motori, interni e molto altro a prezzi vantaggiosi.',
  alternates: { canonical: '/ricambi' },
  openGraph: {
    title: 'Ricambi auto usati per marca — autodemo24',
    description: 'Sfoglia i ricambi auto usati disponibili per marca dai demolitori italiani.',
    url: '/ricambi',
  },
};

function toSeoSlug(value: string): string {
  return encodeURIComponent(value.toLowerCase().replace(/\s+/g, '-'));
}

export default async function RicambiIndexPage() {
  const marche = await prisma.veicolo.groupBy({
    by: ['marca'],
    where: {
      pubblicato: true,
      ricambi: { some: { disponibile: true } },
    },
    _count: { id: true },
    orderBy: { marca: 'asc' },
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <header className="bg-[#003580] text-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-1">
            <span className="text-xl font-bold text-white">auto</span>
            <span className="text-xl font-bold text-[#FF6600]">demo24</span>
          </a>
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
        <nav className="text-sm text-gray-400 mb-6 flex items-center gap-1.5">
          <a href="/" className="hover:text-[#003580]">Home</a>
          <span>/</span>
          <span className="text-gray-600">Ricambi</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
          Ricambi auto usati per marca
        </h1>
        <p className="text-gray-500 text-lg mb-10">
          Seleziona la marca per vedere tutti i ricambi disponibili dai demolitori italiani
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {marche.map((m) => (
            <a
              key={m.marca}
              href={`/ricambi/${toSeoSlug(m.marca)}`}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-lg hover:border-gray-200 transition-all group"
            >
              <h2 className="text-lg font-bold text-gray-900 group-hover:text-[#003580] transition-colors">
                {m.marca}
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {m._count.id} {m._count.id === 1 ? 'veicolo' : 'veicoli'}
              </p>
            </a>
          ))}
        </div>

        {marche.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-20 text-center">
            <p className="text-gray-400 text-lg">Nessun ricambio disponibile al momento.</p>
          </div>
        )}
      </div>

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
