'use client';

import { useEffect, useState } from 'react';
import { MARCHE } from '../../lib/veicoli-db';
import { PROVINCE } from '../../lib/province';

interface Props {
  mode: 'libera' | 'avanzata';
  q?: string;
  marca?: string;
  modello?: string;
  anno?: string;
  provincia?: string;
}

export default function SearchForm({
  mode: initialMode,
  q = '',
  marca: initialMarca = '',
  modello: initialModello = '',
  anno = '',
  provincia = '',
}: Props) {
  const [mode, setMode] = useState<'libera' | 'avanzata'>(initialMode);
  const [marca, setMarca] = useState(initialMarca);
  const [modello, setModello] = useState(initialModello);
  const [modelli, setModelli] = useState<string[]>([]);

  useEffect(() => {
    if (!marca) { setModelli([]); return; }
    fetch(`/api/modelli?marca=${encodeURIComponent(marca)}`)
      .then((r) => r.json())
      .then((data: string[]) => setModelli(data))
      .catch(() => setModelli([]));
  }, [marca]);

  const inputClass = 'w-full px-3 py-2.5 rounded-lg border border-gray-200 text-gray-700 text-sm focus:border-[#003580] focus:ring-2 focus:ring-[#003580]/20 outline-none bg-white';

  return (
    <div className="space-y-5">
      {/* ── Mode switcher ── */}
      <div className="flex rounded-lg bg-gray-100 p-1 text-xs font-semibold">
        <button type="button"
          onClick={() => setMode('libera')}
          className={`flex-1 py-2 rounded-md transition-colors cursor-pointer ${mode === 'libera' ? 'bg-white text-[#003580] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          Libera
        </button>
        <button type="button"
          onClick={() => setMode('avanzata')}
          className={`flex-1 py-2 rounded-md transition-colors cursor-pointer ${mode === 'avanzata' ? 'bg-white text-[#003580] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          Avanzata
        </button>
      </div>

      {mode === 'libera' ? (
        <form action="/ricerca" method="GET" className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Cosa cerchi?</label>
            <input type="text" name="q" defaultValue={q}
              placeholder="es. faro Lancia Ypsilon"
              className={inputClass} />
            <p className="mt-2 text-[11px] text-gray-400 leading-relaxed">
              Cerca nei nomi dei ricambi disponibili e in marca/modello.
            </p>
          </div>
          <button type="submit"
            className="w-full py-3 bg-[#FF6600] hover:bg-orange-600 text-white rounded-xl font-bold text-sm transition-colors cursor-pointer">
            Cerca
          </button>
          <a href="/ricerca" className="block text-center text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Rimuovi filtri
          </a>
        </form>
      ) : (
        <form action="/ricerca" method="GET" className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Marca</label>
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
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Modello</label>
            <select
              name="modello"
              value={modello}
              onChange={(e) => setModello(e.target.value)}
              disabled={!marca}
              className={`${inputClass} ${!marca ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
            >
              <option value="">{marca ? 'Tutti i modelli' : 'Seleziona marca'}</option>
              {modelli.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Anno immatricolazione</label>
            <input type="number" name="anno" defaultValue={anno} placeholder="es. 2015"
              min={1990} max={new Date().getFullYear() + 1}
              className={inputClass} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Provincia</label>
            <select name="provincia" defaultValue={provincia} className={inputClass}>
              <option value="">Tutta Italia</option>
              {PROVINCE.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <button type="submit"
            className="w-full py-3 bg-[#003580] hover:bg-[#002860] text-white rounded-xl font-bold text-sm transition-colors cursor-pointer">
            Filtra
          </button>

          <a href="/ricerca" className="block text-center text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Rimuovi filtri
          </a>
        </form>
      )}
    </div>
  );
}
