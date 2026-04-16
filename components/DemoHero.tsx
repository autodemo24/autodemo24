'use client';

import { useEffect, useState } from 'react';
import { MARCHE } from '../lib/veicoli-db';
import { PROVINCE } from '../lib/province';

export default function DemoHero() {
  const [avanzata, setAvanzata] = useState(false);
  const [marca, setMarca] = useState('');
  const [modello, setModello] = useState('');
  const [modelli, setModelli] = useState<string[]>([]);

  useEffect(() => {
    if (!marca) { setModelli([]); return; }
    fetch(`/api/modelli?marca=${encodeURIComponent(marca)}`)
      .then((r) => r.json())
      .then((data: string[]) => setModelli(data))
      .catch(() => setModelli([]));
  }, [marca]);

  const inputClass = 'w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-700 text-sm focus:border-[#003580] focus:ring-2 focus:ring-[#003580]/20 outline-none bg-white transition-shadow';

  return (
    <div>
      {/* ── Ricerca libera (barra principale tipo Subito) ── */}
      <form action="/ricerca" method="GET" className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            name="q"
            placeholder="Cerca ricambio es. faro Lancia Ypsilon, cambio Golf, paraurti Panda..."
            className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 text-gray-800 text-base focus:border-[#003580] focus:ring-2 focus:ring-[#003580]/20 outline-none bg-white transition-shadow"
          />
        </div>
        <button type="submit"
          className="px-8 py-4 bg-[#FF6600] hover:bg-orange-600 text-white rounded-xl font-bold text-sm transition-colors cursor-pointer shadow-lg shadow-orange-200 hover:shadow-orange-300 flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Cerca
        </button>
      </form>

      {/* ── Toggle ricerca avanzata ── */}
      <div className="mt-4">
        <button
          type="button"
          onClick={() => setAvanzata((v) => !v)}
          aria-expanded={avanzata}
          className="text-sm font-semibold text-[#003580] hover:text-[#003580]/70 flex items-center gap-1 transition-colors cursor-pointer"
        >
          Ricerca avanzata
          <svg className={`w-4 h-4 transition-transform ${avanzata ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* ── Form avanzato: filtra per veicolo ── */}
      {avanzata && (
        <form action="/ricerca" method="GET" className="mt-4 pt-5 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-4">
            Filtra per veicolo. La ricerca avanzata è indipendente dalla ricerca libera.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Marca</label>
              <select name="marca" value={marca}
                onChange={(e) => { setMarca(e.target.value); setModello(''); }}
                className={inputClass}>
                <option value="">Tutte</option>
                {MARCHE.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Modello</label>
              <select name="modello" value={modello}
                onChange={(e) => setModello(e.target.value)}
                disabled={!marca}
                className={`${inputClass} ${!marca ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}>
                <option value="">{marca ? 'Tutti i modelli' : 'Seleziona marca'}</option>
                {modelli.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Anno</label>
              <input type="number" name="anno" placeholder="es. 2015"
                min={1990} max={new Date().getFullYear() + 1}
                className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Provincia</label>
              <select name="provincia" defaultValue="" className={inputClass}>
                <option value="">Tutta Italia</option>
                {PROVINCE.map((p) => <option key={p.code} value={p.code}>{p.code} — {p.name}</option>)}
              </select>
            </div>
          </div>
          <button type="submit"
            className="mt-4 w-full sm:w-auto px-8 py-3 bg-[#003580] hover:bg-[#002860] text-white rounded-xl font-bold text-sm transition-colors cursor-pointer">
            Filtra veicoli
          </button>
        </form>
      )}
    </div>
  );
}
