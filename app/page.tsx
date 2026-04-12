import { prisma } from '../lib/prisma';
import { PROVINCE } from '../lib/province';

const MARCHE = [
  'Alfa Romeo','Audi','BMW','Chevrolet','Citroën','Dacia','Fiat','Ford',
  'Honda','Hyundai','Jeep','Kia','Lancia','Land Rover','Mazda','Mercedes',
  'Mini','Mitsubishi','Nissan','Opel','Peugeot','Renault','Seat','Skoda',
  'Smart','Suzuki','Toyota','Volkswagen','Volvo',
];

export default async function Home() {
  const [totVeicoli, totDemolitori] = await Promise.all([
    prisma.veicolo.count(),
    prisma.demolitore.count(),
  ]);

  return (
    <main className="min-h-screen flex flex-col">
      {/* ── Navbar ── */}
      <header className="bg-[#003580] text-white">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-1">
            <span className="text-2xl font-bold text-white">auto</span>
            <span className="text-2xl font-bold text-[#FF6600]">demo24</span>
          </a>
          <nav className="flex items-center gap-6">
            <a href="/ricerca" className="text-sm text-white/80 hover:text-white transition-colors hidden sm:block">
              Cerca veicoli
            </a>
            <a href="/abbonamento" className="text-sm text-white/80 hover:text-white transition-colors hidden sm:block">
              Abbonamenti
            </a>
            <a href="/login" className="text-sm text-white/80 hover:text-white transition-colors">
              Accedi
            </a>
            <a href="/registrati"
              className="px-4 py-2 bg-[#FF6600] hover:bg-orange-600 text-white rounded-lg text-sm font-semibold transition-colors">
              Registrati gratis
            </a>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section
        className="relative flex-1 flex items-center justify-center py-24"
        style={{
          background: 'linear-gradient(135deg, #001f4d 0%, #003580 50%, #004aad 100%)',
        }}
      >
        {/* Decorative circles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/5" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-white/5" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-4">
            Trova ricambi auto dai<br />
            <span className="text-[#FF6600]">demolitori italiani</span>
          </h1>
          <p className="text-lg text-white/70 mb-10">
            Cerca tra migliaia di veicoli disponibili nei piazzali dei demolitori in tutta Italia
          </p>

          {/* Search card */}
          <form action="/ricerca" method="GET"
            className="bg-white rounded-2xl shadow-2xl p-5 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 text-left">Marca</label>
                <select name="marca" defaultValue=""
                  className="w-full px-3 py-3 rounded-lg border border-gray-200 text-gray-700 text-sm focus:border-[#003580] focus:ring-2 focus:ring-[#003580]/20 outline-none">
                  <option value="">Tutte le marche</option>
                  {MARCHE.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 text-left">Modello</label>
                <input type="text" name="modello" placeholder="es. Panda, Golf…"
                  className="w-full px-3 py-3 rounded-lg border border-gray-200 text-gray-700 text-sm focus:border-[#003580] focus:ring-2 focus:ring-[#003580]/20 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 text-left">Anno</label>
                <input type="number" name="anno" placeholder="es. 2015"
                  min={1990} max={new Date().getFullYear() + 1}
                  className="w-full px-3 py-3 rounded-lg border border-gray-200 text-gray-700 text-sm focus:border-[#003580] focus:ring-2 focus:ring-[#003580]/20 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 text-left">Provincia</label>
                <select name="provincia" defaultValue=""
                  className="w-full px-3 py-3 rounded-lg border border-gray-200 text-gray-700 text-sm focus:border-[#003580] focus:ring-2 focus:ring-[#003580]/20 outline-none">
                  <option value="">Tutta Italia</option>
                  {PROVINCE.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <button type="submit"
              className="w-full py-3.5 bg-[#FF6600] hover:bg-orange-600 text-white rounded-xl font-bold text-base transition-colors">
              Cerca ricambi
            </button>
          </form>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="bg-[#002060] text-white py-6">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { value: totVeicoli.toLocaleString('it-IT'), label: 'Veicoli disponibili' },
            { value: totDemolitori.toLocaleString('it-IT'), label: 'Demolitori registrati' },
            { value: '110', label: 'Province coperte' },
            { value: '100%', label: 'Gratuito per i clienti' },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-3xl font-extrabold text-[#FF6600]">{value}</p>
              <p className="text-xs text-white/60 mt-1 uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Come funziona ── */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-extrabold text-center text-[#003580] mb-3">Come funziona</h2>
          <p className="text-center text-gray-500 mb-14">Tre semplici passi per trovare il ricambio che cerchi</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                step: '01',
                title: 'Cerca il veicolo',
                desc: 'Inserisci marca, modello, anno e la tua provincia per filtrare i veicoli disponibili.',
                icon: (
                  <svg className="w-8 h-8 text-[#003580]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                ),
              },
              {
                step: '02',
                title: 'Sfoglia i ricambi',
                desc: 'Vedi foto, dati tecnici e l\'elenco dei ricambi disponibili direttamente dal piazzale.',
                icon: (
                  <svg className="w-8 h-8 text-[#003580]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM3 5h2l2 7h10l2-7H3z" />
                  </svg>
                ),
              },
              {
                step: '03',
                title: 'Contatta il demolitore',
                desc: 'Chiama o scrivi direttamente al demolitore per richiedere il pezzo e concordare il ritiro.',
                icon: (
                  <svg className="w-8 h-8 text-[#003580]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                ),
              },
            ].map(({ step, title, desc, icon }) => (
              <div key={step} className="relative bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <span className="absolute top-6 right-6 text-5xl font-extrabold text-gray-100 select-none leading-none">{step}</span>
                <div className="w-14 h-14 bg-[#003580]/10 rounded-xl flex items-center justify-center mb-5">
                  {icon}
                </div>
                <h3 className="text-lg font-bold text-[#003580] mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Demolitori ── */}
      <section className="bg-[#003580] py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-3">Sei un demolitore?</h2>
          <p className="text-white/70 mb-8 text-lg">
            Registrati gratis e pubblica i tuoi veicoli. Raggiungi migliaia di acquirenti ogni giorno.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/registrati"
              className="px-8 py-4 bg-[#FF6600] hover:bg-orange-600 text-white rounded-xl font-bold text-lg transition-colors">
              Inizia gratis
            </a>
            <a href="/abbonamento"
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold text-lg transition-colors border border-white/20">
              Vedi i piani
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#001f4d] text-white/50 py-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1">
            <span className="text-lg font-bold text-white">auto</span>
            <span className="text-lg font-bold text-[#FF6600]">demo24</span>
            <span className="ml-2 text-sm">.it</span>
          </div>
          <p className="text-sm">Il portale italiano dei demolitori auto</p>
          <div className="flex gap-5 text-sm">
            <a href="/ricerca" className="hover:text-white transition-colors">Cerca</a>
            <a href="/abbonamento" className="hover:text-white transition-colors">Abbonamenti</a>
            <a href="/registrati" className="hover:text-white transition-colors">Registrati</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
