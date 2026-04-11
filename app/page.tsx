export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-red-600">auto</span>
            <span className="text-2xl font-bold text-gray-800">demo24</span>
          </div>
          <div className="flex gap-3">
            <a href="/login" className="px-4 py-2 text-gray-600 hover:text-red-600 font-medium">
              Accedi
            </a>
            <a href="/registrati" className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">
              Sei un demolitore? Registrati
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-red-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">
            Trova ricambi auto dai demolitori vicino a te
          </h1>
          <p className="text-xl mb-8 text-red-100">
            Cerca tra migliaia di veicoli nei piazzali dei demolitori italiani
          </p>

          {/* Barra di ricerca */}
          <div className="bg-white rounded-xl p-4 flex flex-col md:flex-row gap-3">
            <select className="flex-1 px-4 py-3 rounded-lg border border-gray-200 text-gray-700 text-base">
              <option value="">Marca</option>
              <option>Fiat</option>
              <option>Ford</option>
              <option>Volkswagen</option>
              <option>BMW</option>
              <option>Mercedes</option>
              <option>Audi</option>
              <option>Renault</option>
              <option>Peugeot</option>
              <option>Opel</option>
              <option>Toyota</option>
            </select>
            <input
              type="text"
              placeholder="Modello (es. Panda, Golf...)"
              className="flex-1 px-4 py-3 rounded-lg border border-gray-200 text-gray-700 text-base"
            />
            <input
              type="text"
              placeholder="Anno (es. 2015)"
              className="w-32 px-4 py-3 rounded-lg border border-gray-200 text-gray-700 text-base"
            />
            <select className="flex-1 px-4 py-3 rounded-lg border border-gray-200 text-gray-700 text-base">
              <option value="">Provincia</option>
              <option>Milano</option>
              <option>Roma</option>
              <option>Napoli</option>
              <option>Torino</option>
              <option>Bologna</option>
              <option>Firenze</option>
              <option>Palermo</option>
              <option>Genova</option>
            </select>
            <button className="px-8 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 text-base">
              Cerca
            </button>
          </div>
        </div>
      </section>

      {/* Come funziona */}
      <section className="py-16 max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Come funziona</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🔍</span>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Cerca il ricambio</h3>
            <p className="text-gray-600">Inserisci marca, modello e anno del tuo veicolo per trovare i demolitori che ce l'hanno</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📋</span>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Sfoglia le auto</h3>
            <p className="text-gray-600">Vedi le foto e i ricambi disponibili direttamente dal piazzale del demolitore</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📞</span>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Contatta il demolitore</h3>
            <p className="text-gray-600">Scrivi direttamente al demolitore per richiedere il pezzo che ti serve</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 py-8 text-center">
        <p className="text-lg font-bold text-white mb-2">autodemo24.it</p>
        <p>Il portale italiano dei demolitori auto</p>
      </footer>
    </main>
  );
}