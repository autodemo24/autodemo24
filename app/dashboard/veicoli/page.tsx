import { redirect } from 'next/navigation';
import { getSession } from '../../../lib/session';
import { prisma } from '../../../lib/prisma';
import VeicoloForm from './VeicoloForm';
import VeicoliCards from './VeicoliCards';

export default async function VeicoliPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const veicoli = await prisma.veicolo.findMany({
    where: { demolitoreid: session.id },
    include: { foto: true, ricambi: true },
    orderBy: { id: 'desc' },
  });

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/dashboard" className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </a>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-red-600">auto</span>
              <span className="text-2xl font-bold text-gray-800">demo24</span>
            </div>
          </div>
          <span className="text-sm text-gray-500 hidden sm:block">{session.ragioneSociale}</span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Titolo pagina */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">I miei veicoli</h1>
          <p className="text-gray-500 mt-1">
            {veicoli.length === 0
              ? 'Nessun veicolo pubblicato ancora.'
              : `${veicoli.length} veicol${veicoli.length === 1 ? 'o pubblicato' : 'i pubblicati'}`}
          </p>
        </div>

        {/* Form per nuovo veicolo */}
        <VeicoloForm />

        {/* Lista veicoli */}
        <VeicoliCards veicoli={veicoli} />
      </div>
    </main>
  );
}
