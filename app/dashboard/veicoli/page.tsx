import { redirect } from 'next/navigation';
import { getSession } from '../../../lib/session';
import { prisma } from '../../../lib/prisma';
import { PIANI, getMaxTarga, type PianoKey } from '../../../lib/piani';
import VeicoloForm from './VeicoloForm';
import VeicoliCards from './VeicoliCards';

function inizioMese() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function VeicoliPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const [veicoli, demolitore, targaMese] = await Promise.all([
    prisma.veicolo.findMany({
      where: { demolitoreid: session.id },
      include: { foto: { orderBy: { copertina: 'desc' } }, ricambi: true },
      orderBy: { id: 'desc' },
    }),
    prisma.demolitore.findUnique({
      where: { id: session.id },
      select: { piano: true },
    }),
    prisma.targaLookup.count({
      where: { demolitoreid: session.id, createdAt: { gte: inizioMese() } },
    }),
  ]);

  const piano = (demolitore?.piano ?? 'FREE') as PianoKey;
  const maxTarga = getMaxTarga(piano);
  const pianoInfo = PIANI[piano];

  return (
    <main className="min-h-screen bg-gray-50 pt-14 lg:pt-0">
      {/* Header */}
      <header className="bg-[#003580] text-white hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/dashboard" className="text-white/60 hover:text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </a>
            <a href="/" className="flex items-center gap-1">
              <span className="text-2xl font-bold text-white">auto</span>
              <span className="text-2xl font-bold text-[#FF6600]">demo24</span>
            </a>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/70 hidden sm:flex items-center gap-1.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white">
                {pianoInfo.label}
              </span>
              <span>{targaMese}/{maxTarga === Infinity ? '∞' : maxTarga} ricerche targa</span>
            </span>
            <span className="text-sm text-white/70 hidden sm:block">{session.ragioneSociale}</span>
          </div>
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
        <VeicoloForm targaUsate={targaMese} targaMax={maxTarga} />

        {/* Lista veicoli */}
        <VeicoliCards veicoli={veicoli} />
      </div>
    </main>
  );
}
