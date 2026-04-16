'use client';

import { useState, useEffect } from 'react';
import { MARCHE } from '../lib/veicoli-db';
import { PROVINCE } from '../lib/province';

const CATEGORIE_RICAMBI = [
  'Meccanica',
  'Carrozzeria',
  'Illuminazione',
  'Vetri',
  'Interni',
  'Ruote e freni',
];

export default function HomeSearchForm() {
  const [marca, setMarca] = useState('');
  const [modello, setModello] = useState('');
  const [modelli, setModelli] = useState<string[]>([]);
  const [aperto, setAperto] = useState(false);

  useEffect(() => {
    if (!marca) { setModelli([]); return; }
    fetch(`/api/modelli?marca=${encodeURIComponent(marca)}`)
      .then((r) => r.json())
      .then((data: string[]) => setModelli(data))
      .catch(() => setModelli([]));
  }, [marca]);

  const inputClass = 'w-full px-3 py-3 rounded-lg border border-gray-200 text-gray-700 text-sm focus:border-[#003580] focus:ring-2 focus:ring-[#003580]/20 outline-none bg-white';

  return (
    <form action="/ricerca" method="GET"
      className="bg-white rounded-2xl shadow-2xl p-5 sm:p-6">

      {/* Riga principale: Marca, Modello, Provincia, Trova Auto */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 text-left">Marca</label>
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
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 text-left">Modello</label>
          <select
            name="modello"
            value={modello}
            onChange={(e) => setModello(e.target.value)}
            disabled={!marca}
            className={`${inputClass} ${!marca ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
          >
            <option value="">Tutti i modelli</option>
            {modelli.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 text-left">Provincia</label>
          <select name="provincia" defaultValue="" className={inputClass}>
            <option value="">Tutta Italia</option>
            {PROVINCE.map((p) => <option key={p.code} value={p.code}>{p.code} — {p.name}</option>)}
          </select>
        </div>
        <div className="flex items-end">
          <button type="submit"
            className="w-full sm:w-auto px-8 py-3 bg-[#FF6600] hover:bg-orange-600 text-white rounded-lg font-bold text-sm transition-colors whitespace-nowrap cursor-pointer">
            Trova Auto
          </button>
        </div>
      </div>

      {/* Toggle ricerca avanzata */}
      <button
        type="button"
        onClick={() => setAperto((v) => !v)}
        className="mt-4 flex items-center gap-1.5 text-sm font-medium text-[#003580] hover:text-[#003580]/70 transition-colors cursor-pointer"
      >
        <svg
          className={`w-4 h-4 transition-transform ${aperto ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        Ricerca avanzata
      </button>

      {/* Filtri avanzati */}
      {aperto && (
        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 text-left">Tipo ricambio</label>
            <select name="categoria" defaultValue="" className={inputClass}>
              <option value="">Qualsiasi</option>
              {CATEGORIE_RICAMBI.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 text-left">Sigla motore</label>
            <input type="text" name="siglaMotore" placeholder="es. 188A4000"
              className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 text-left">Cilindrata (cc)</label>
            <input type="text" name="cilindrata" placeholder="es. 1300"
              className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 text-left">Anno da</label>
              <input type="number" name="annoDa" placeholder="2005" min={1990} max={new Date().getFullYear()}
                className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 text-left">Anno a</label>
              <input type="number" name="annoA" placeholder="2024" min={1990} max={new Date().getFullYear() + 1}
                className={inputClass} />
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
