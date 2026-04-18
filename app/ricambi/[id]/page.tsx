import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '../../../lib/prisma';
import Navbar from '../../../components/Navbar';
import RicambioGallery from './RicambioGallery';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const idNum = Number(id);
  if (isNaN(idNum)) return {};
  const r = await prisma.ricambio.findUnique({
    where: { id: idNum },
    select: { nome: true, marca: true, modello: true, anno: true, pubblicato: true, stato: true },
  });
  if (!r || !r.pubblicato || r.stato !== 'DISPONIBILE') return {};
  const title = `${r.nome} per ${r.marca} ${r.modello}${r.anno ? ` ${r.anno}` : ''} — autodemo24`;
  return {
    title,
    description: `Ricambio usato: ${r.nome} compatibile con ${r.marca} ${r.modello}${r.anno ? ` del ${r.anno}` : ''}. Acquista direttamente dal demolitore.`,
  };
}

function fmtPrezzo(v: unknown): string {
  const n = Number(v);
  return isNaN(n) ? '—' : `EUR ${n.toFixed(2).replace('.', ',')}`;
}

export default async function RicambioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idNum = Number(id);
  if (isNaN(idNum)) notFound();

  const r = await prisma.ricambio.findUnique({
    where: { id: idNum },
    include: {
      foto: { orderBy: { copertina: 'desc' } },
      demolitore: {
        select: {
          id: true, ragioneSociale: true, provincia: true,
          indirizzo: true, telefono: true, email: true, descrizione: true,
        },
      },
    },
  });

  if (!r || !r.pubblicato) notFound();

  const disponibile = r.stato === 'DISPONIBILE';
  const titolo = `${r.nome.toUpperCase()} ${r.marca.toUpperCase()} ${r.modello}${r.anno ? ` (${r.anno})` : ''}`;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6 flex-1 w-full">
        {/* Breadcrumb leggero */}
        <nav className="text-sm text-gray-400 mb-4 flex items-center gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-[#003580]">Home</Link>
          <span>/</span>
          <Link href="/ricambi" className="hover:text-[#003580]">Ricambi</Link>
          <span>/</span>
          <span className="text-gray-600 truncate">{r.categoria}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
          {/* ── Colonna SX: gallery ── */}
          <div>
            <RicambioGallery foto={r.foto.map((f) => ({ id: f.id, url: f.url }))} alt={r.nome} />
          </div>

          {/* ── Colonna DX: dettagli ── */}
          <div className="space-y-5">
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-tight">
              {titolo} {r.codice && <span className="font-normal">{r.codice}</span>}
            </h1>

            {/* Box venditore */}
            <div className="border border-gray-200 rounded-lg p-3 flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#003580]/10 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-[#003580]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span className="font-semibold text-[#003580] hover:underline cursor-pointer">
                    {r.demolitore.ragioneSociale}
                  </span>
                  <span className="text-gray-500"> · Venditore professionale</span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  99.8% di feedback positivi · {r.demolitore.provincia}
                </p>
                <a href={`mailto:${r.demolitore.email}?subject=Richiesta ricambio ${r.codice}`}
                  className="inline-block mt-1.5 text-xs font-semibold text-[#003580] hover:underline">
                  Invia un messaggio al venditore
                </a>
              </div>
            </div>

            {/* Prezzo */}
            <div>
              <p className="text-3xl font-extrabold text-gray-900">{fmtPrezzo(r.prezzo)}</p>
              {!disponibile && (
                <span className="inline-block mt-2 px-2.5 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">
                  {r.stato === 'RISERVATO' ? 'Riservato' : r.stato === 'VENDUTO' ? 'Venduto' : 'Non disponibile'}
                </span>
              )}
            </div>

            {/* Condizione */}
            <div className="text-sm text-gray-700">
              <span className="text-gray-500">Condizione:</span>{' '}
              <span className="font-semibold">Usato</span>
              <svg className="inline-block w-3.5 h-3.5 ml-1 text-gray-400 align-text-bottom" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            {/* CTA */}
            <div className="space-y-2.5">
              <a href={`tel:${r.demolitore.telefono}`}
                className="block w-full text-center px-5 py-3 bg-[#003580] hover:bg-[#002a66] text-white rounded-full font-bold text-[15px] transition-colors">
                Contatta il venditore
              </a>
              <a href={`mailto:${r.demolitore.email}?subject=Richiesta ricambio ${r.codice}`}
                className="block w-full text-center px-5 py-3 border border-[#003580] text-[#003580] hover:bg-[#003580]/5 rounded-full font-bold text-[15px] transition-colors">
                Invia email
              </a>
              <button type="button"
                className="w-full flex items-center justify-center gap-2 px-5 py-3 border border-gray-300 text-gray-800 hover:bg-gray-50 rounded-full font-semibold text-[14px] transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Aggiungi agli oggetti che osservi
              </button>
            </div>

            {/* Info aggiuntive */}
            <div className="pt-4 border-t border-gray-200 space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM3 5h2l2 7h10l2-7H3z" />
                </svg>
                <p className="text-gray-700">
                  <span className="font-semibold">Ritiro dal demolitore</span>
                  <span className="text-gray-500"> — {r.demolitore.indirizzo}, {r.demolitore.provincia}</span>
                </p>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <p className="text-gray-700">
                  <span className="font-semibold">Venditore verificato</span>
                  <span className="text-gray-500"> — pagamento diretto al demolitore</span>
                </p>
              </div>
              <p className="text-[11px] text-gray-400 font-mono pt-2">Codice articolo: {r.codice}</p>
            </div>
          </div>
        </div>

        {/* ── Descrizione full-width sotto ── */}
        {r.descrizione && (
          <div className="mt-12 max-w-3xl">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Descrizione</h2>
            <p className="text-gray-700 whitespace-pre-line leading-relaxed">{r.descrizione}</p>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 py-8 mt-10">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <Link href="/" className="inline-flex items-center mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo-black.svg" alt="Autigo" className="h-6" />
          </Link>
          <p className="text-sm text-gray-400">Il portale italiano dei ricambi auto usati</p>
        </div>
      </footer>
    </div>
  );
}
