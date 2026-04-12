import { getSession } from '../../lib/session';
import { prisma } from '../../lib/prisma';
import { PIANI, getMaxTarga, type PianoKey } from '../../lib/piani';
import CheckoutButton from './CheckoutButton';

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

const FEATURES: Record<PianoKey, string[]> = {
  FREE: [
    '20 ricerche targa al mese',
    'Veicoli illimitati senza targa',
    'Ricambi illimitati per veicolo',
    'Foto fino a 10 per veicolo',
    'Pagina profilo pubblica',
  ],
  START: [
    '100 ricerche targa al mese',
    'Veicoli illimitati senza targa',
    'Ricambi illimitati per veicolo',
    'Foto fino a 10 per veicolo',
    'Pagina profilo pubblica',
    'Supporto via email',
  ],
  PRO: [
    '500 ricerche targa al mese',
    'Veicoli illimitati senza targa',
    'Ricambi illimitati per veicolo',
    'Foto fino a 10 per veicolo',
    'Pagina profilo pubblica',
    'Supporto prioritario',
  ],
  ULTRA: [
    'Ricerche targa illimitate',
    'Veicoli illimitati senza targa',
    'Ricambi illimitati per veicolo',
    'Foto fino a 10 per veicolo',
    'Pagina profilo pubblica',
    'Supporto dedicato',
  ],
};

export default async function AbbonamentoPage() {
  const session = await getSession();

  let pianoCorrente: string | null = null;
  if (session) {
    const dem = await prisma.demolitore.findUnique({
      where: { id: session.id },
      select: { piano: true },
    });
    pianoCorrente = dem?.piano ?? 'FREE';
  }

  const piani: { key: PianoKey; featured: boolean }[] = [
    { key: 'FREE', featured: false },
    { key: 'START', featured: false },
    { key: 'PRO', featured: true },
    { key: 'ULTRA', featured: false },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#003580] text-white">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-1">
            <span className="text-2xl font-bold text-white">auto</span>
            <span className="text-2xl font-bold text-[#FF6600]">demo24</span>
          </a>
          <div className="flex items-center gap-4">
            {session ? (
              <a href="/dashboard" className="text-sm text-white/80 hover:text-white">
                Dashboard
              </a>
            ) : (
              <>
                <a href="/login" className="text-sm text-white/80 hover:text-white">
                  Accedi
                </a>
                <a href="/registrati" className="px-4 py-2 bg-[#FF6600] hover:bg-orange-600 text-white rounded-lg text-sm font-semibold transition-colors">
                  Registrati
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Titolo */}
        <div className="text-center mb-14">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Scegli il tuo piano</h1>
          <p className="text-lg text-gray-500">
            Pubblica i tuoi veicoli demoliti e raggiungi migliaia di acquirenti di ricambi
          </p>
        </div>

        {/* Griglia piani */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
          {piani.map(({ key, featured }) => {
            const piano = PIANI[key];
            const isAttivo = pianoCorrente === key;
            const features = FEATURES[key];

            return (
              <div
                key={key}
                className={`relative bg-white rounded-2xl flex flex-col ${
                  featured
                    ? 'ring-2 ring-[#FF6600] shadow-xl'
                    : 'border border-gray-200 shadow-sm'
                }`}
              >
                {featured && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-[#FF6600] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                      Più scelto
                    </span>
                  </div>
                )}

                <div className="p-6 flex flex-col flex-1">
                  {/* Piano + prezzo */}
                  <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-3">{piano.label}</h2>
                    <div className="flex items-end gap-1">
                      {piano.prezzo === 0 ? (
                        <span className="text-4xl font-extrabold text-gray-900">Gratis</span>
                      ) : (
                        <>
                          <span className="text-4xl font-extrabold text-gray-900">
                            {piano.prezzo.toLocaleString('it-IT', { minimumFractionDigits: 2 })}€
                          </span>
                          <span className="text-sm text-gray-400 pb-1">/mese</span>
                        </>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      {getMaxTarga(key) === Infinity
                        ? 'Ricerche targa illimitate'
                        : `${getMaxTarga(key)} ricerche targa/mese`}
                    </p>
                  </div>

                  {/* Feature list */}
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <CheckIcon />
                        <span className="text-sm text-gray-600">{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  {isAttivo ? (
                    <div className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-green-50 text-green-700 border border-green-200 text-center">
                      Piano attuale
                    </div>
                  ) : piano.prezzo === 0 ? (
                    session ? (
                      <div className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-gray-100 text-gray-400 text-center">
                        Piano base
                      </div>
                    ) : (
                      <a
                        href="/registrati"
                        className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-gray-800 text-white hover:bg-gray-900 text-center block transition-colors"
                      >
                        Inizia gratis
                      </a>
                    )
                  ) : session ? (
                    <CheckoutButton piano={key} label={`Passa a ${piano.label}`} />
                  ) : (
                    <a
                      href="/login"
                      className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-[#FF6600] text-white hover:bg-orange-600 text-center block transition-colors"
                    >
                      Accedi per abbonarti
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Note */}
        <p className="text-center text-sm text-gray-400 mt-10">
          Pagamenti sicuri tramite Stripe · Annulla in qualsiasi momento · IVA inclusa
        </p>
      </div>
    </main>
  );
}
