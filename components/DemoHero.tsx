'use client';

import { useState, useEffect } from 'react';
import { MARCHE } from '../lib/veicoli-db';
import { PROVINCE } from '../lib/province';

const CATEGORIE_RICAMBI = [
  'Meccanica', 'Carrozzeria', 'Illuminazione', 'Vetri', 'Interni', 'Ruote e freni',
];

export default function DemoHero() {
  const [marca, setMarca] = useState('');
  const [modello, setModello] = useState('');
  const [modelli, setModelli] = useState<string[]>([]);
  const [avanzata, setAvanzata] = useState(false);

  useEffect(() => {
    if (!marca) { setModelli([]); return; }
    fetch(`/api/modelli?marca=${encodeURIComponent(marca)}`)
      .then((r) => r.json())
      .then((data: string[]) => setModelli(data))
      .catch(() => setModelli([]));
  }, [marca]);

  const inputClass = 'w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-700 text-sm focus:border-[#003580] focus:ring-2 focus:ring-[#003580]/20 outline-none bg-white transition-shadow';

  return (
    <form action="/ricerca" method="GET">
      {/* Riga principale */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Marca */}
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Marca</label>
          <select
            name="marca"
            value={marca}
            onChange={(e) => { setMarca(e.target.value); setModello(''); }}
            className={inputClass}
          >
            <option value="">Tutte le marche</option>
            {MARCHE.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {/* Modello */}
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Modello</label>
          <select
            name="modello"
            value={modello}
            onChange={(e) => setModello(e.target.value)}
            disabled={!marca}
            className={`${inputClass} ${!marca ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
          >
            <option value="">{marca ? 'Tutti i modelli' : 'Prima seleziona la marca'}</option>
            {modelli.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {/* Provincia */}
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Provincia</label>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <select name="provincia" defaultValue=""
              className={`${inputClass} pl-9`}>
              <option value="">Tutta Italia</option>
              {PROVINCE.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {/* Bottone cerca */}
        <div className="flex items-end">
          <button type="submit"
            className="w-full sm:w-auto px-6 py-3 bg-[#FF6600] hover:bg-orange-600 text-white rounded-xl font-bold text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-orange-200 hover:shadow-orange-300">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="sm:hidden lg:inline">Trova Auto</span>
          </button>
        </div>
      </div>

      {/* Link ricerca avanzata */}
      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setAvanzata((v) => !v)}
          className="text-sm font-semibold text-[#003580] hover:text-[#003580]/70 flex items-center gap-1 transition-colors cursor-pointer"
        >
          Ricerca avanzata
          <svg className={`w-4 h-4 transition-transform ${avanzata ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Filtri avanzati */}
      {avanzata && (
        <div className="mt-4 pt-5 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tipo ricambio</label>
            <select name="categoria" defaultValue="" className={inputClass}>
              <option value="">Qualsiasi</option>
              {CATEGORIE_RICAMBI.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Sigla motore</label>
            <input type="text" name="siglaMotore" placeholder="es. 188A4000" className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Cilindrata (cc)</label>
            <input type="text" name="cilindrata" placeholder="es. 1300" className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Anno da</label>
              <input type="number" name="annoDa" placeholder="2005" min={1990} max={new Date().getFullYear()} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Anno a</label>
              <input type="number" name="annoA" placeholder="2024" min={1990} max={new Date().getFullYear() + 1} className={inputClass} />
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
