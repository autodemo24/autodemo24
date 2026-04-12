export default function AbbonamentoSuccessPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Abbonamento attivato!</h1>
        <p className="text-gray-500 mb-8">
          Il tuo piano è stato aggiornato con successo. Puoi subito iniziare a pubblicare più veicoli.
        </p>
        <div className="flex flex-col gap-3">
          <a
            href="/dashboard/veicoli"
            className="w-full py-3 px-4 bg-[#FF6600] text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors"
          >
            Vai ai miei veicoli
          </a>
          <a
            href="/abbonamento"
            className="w-full py-3 px-4 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Dettagli piano
          </a>
        </div>
      </div>
    </main>
  );
}
