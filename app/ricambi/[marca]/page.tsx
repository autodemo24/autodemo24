import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '../../../lib/prisma';
import Navbar from '../../../components/Navbar';

interface PageProps {
  params: Promise<{ marca: string }>;
}

function decodeSeoSlug(slug: string): string {
  return decodeURIComponent(slug).replace(/-/g, ' ');
}

function toSeoSlug(value: string): string {
  return encodeURIComponent(value.toLowerCase().replace(/\s+/g, '-'));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { marca } = await params;
  const marcaDecoded = decodeSeoSlug(marca);

  const count = await prisma.veicolo.count({
    where: {
      marca: { equals: marcaDecoded, mode: 'insensitive' },
      pubblicato: true,
      ricambi: { some: { disponibile: true } },
    },
  });

  if (count === 0) return {};

  const titolo = `Ricambi usati ${marcaDecoded} — Tutti i modelli disponibili`;
  const descrizione = `Trova ricambi usati per ${marcaDecoded} da ${count} veicoli disponibili presso i demolitori italiani. Scegli il modello per vedere i pezzi disponibili.`;

  return {
    title: titolo,
    description: descrizione,
    alternates: { canonical: `/ricambi/${toSeoSlug(marcaDecoded)}` },
    openGraph: {
      title: titolo,
      description: descrizione,
      url: `/ricambi/${toSeoSlug(marcaDecoded)}`,
    },
  };
}

export default async function RicambiMarcaPage({ params }: PageProps) {
  const { marca } = await params;
  const marcaDecoded = decodeSeoSlug(marca);

  const modelli = await prisma.veicolo.groupBy({
    by: ['modello'],
    where: {
      marca: { equals: marcaDecoded, mode: 'insensitive' },
      pubblicato: true,
      ricambi: { some: { disponibile: true } },
    },
    _count: { id: true },
    orderBy: { modello: 'asc' },
  });

  if (modelli.length === 0) notFound();

  // Prendiamo il case corretto della marca dal primo veicolo
  const primoVeicolo = await prisma.veicolo.findFirst({
    where: { marca: { equals: marcaDecoded, mode: 'insensitive' } },
    select: { marca: true },
  });
  const marcaDisplay = primoVeicolo?.marca ?? marcaDecoded;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-10 flex-1 w-full">
        <nav className="text-sm text-gray-400 mb-6 flex items-center gap-1.5">
          <a href="/" className="hover:text-[#003580]">Home</a>
          <span>/</span>
          <a href="/ricambi" className="hover:text-[#003580]">Ricambi</a>
          <span>/</span>
          <span className="text-gray-600">{marcaDisplay}</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
          Ricambi usati {marcaDisplay}
        </h1>
        <p className="text-gray-500 text-lg mb-10">
          Seleziona il modello per vedere i ricambi disponibili
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {modelli.map((m) => (
            <a
              key={m.modello}
              href={`/ricambi/${toSeoSlug(marcaDisplay)}/${toSeoSlug(m.modello)}`}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-lg hover:border-gray-200 transition-all group"
            >
              <h2 className="text-lg font-bold text-gray-900 group-hover:text-[#003580] transition-colors">
                {m.modello}
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {m._count.id} {m._count.id === 1 ? 'veicolo' : 'veicoli'}
              </p>
            </a>
          ))}
        </div>
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
