'use client';

import { useState, useMemo } from 'react';
import VeicoliCards from './VeicoliCards';

interface VeicoloItem {
  id: number;
  marca: string;
  modello: string;
  anno: number;
  targa: string;
  km: number;
  versione?: string | null;
  cilindrata?: string | null;
  siglaMotore?: string | null;
  carburante?: string | null;
  potenzaKw?: number | null;
  pubblicato?: boolean | null;
  foto: { id: number; url: string; copertina: boolean }[];
  ricambi: { id: number; nome: string; disponibile: boolean }[];
}

interface Props {
  veicoli: VeicoloItem[];
}

export default function VeicoliView({ veicoli }: Props) {
  const [targa, setTarga] = useState('');
  const [marca, setMarca] = useState('');
  const [modello, setModello] = useState('');
  const [siglaMotore, setSiglaMotore] = useState('');
  const [ordina, setOrdina] = useState('recenti');

  // Estrai marche e modelli unici dai veicoli del demolitore
  const marcheDisponibili = useMemo(() =>
    [...new Set(veicoli.map((v) => v.marca))].sort(),
    [veicoli]
  );

  const modelliDisponibili = useMemo(() =>
    marca
      ? [...new Set(veicoli.filter((v) => v.marca === marca).map((v) => v.modello))].sort()
      : [],
    [veicoli, marca]
  );

  // Filtra
  const filtrati = useMemo(() => {
    let result = veicoli;

    if (targa) {
      const t = targa.toUpperCase();
      result = result.filter((v) => v.targa.includes(t));
    }
    if (marca) {
      result = result.filter((v) => v.marca === marca);
    }
    if (modello) {
      result = result.filter((v) => v.modello === modello);
    }
    if (siglaMotore) {
      const s = siglaMotore.toLowerCase();
      result = result.filter((v) => v.siglaMotore?.toLowerCase().includes(s));
    }

    // Ordina
    if (ordina === 'recenti') {
      result = [...result].sort((a, b) => b.id - a.id);
    } else if (ordina === 'anno-desc') {
      result = [...result].sort((a, b) => b.anno - a.anno);
    } else if (ordina === 'anno-asc') {
      result = [...result].sort((a, b) => a.anno - b.anno);
    } else if (ordina === 'marca') {
      result = [...result].sort((a, b) => a.marca.localeCompare(b.marca));
    } else if (ordina === 'ricambi') {
      result = [...result].sort((a, b) =>
        b.ricambi.filter((r) => r.disponibile).length - a.ricambi.filter((r) => r.disponibile).length
      );
    }

    return result;
  }, [veicoli, targa, marca, modello, siglaMotore, ordina]);

  const hasFilters = targa || marca || modello || siglaMotore;

  const inputClass = 'w-full px-3 py-2.5 rounded-lg border border-gray-200 text-gray-700 text-sm focus:border-[#1a5f96] focus:ring-2 focus:ring-[#1a5f96]/20 outline-none bg-white';

  return (
    <div className="flex gap-6">
      {/* Sidebar filtri — desktop */}
      <aside className="w-56 shrink-0 hidden xl:block">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sticky top-20">
          <h2 className="text-sm font-bold text-[#1a5f96] uppercase tracking-wide mb-5 pb-3 border-b border-gray-100">
            Filtra veicoli
          </h2>

          <div className="space-y-4">
            {/* Targa */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Targa</label>
              <input
                type="text"
                value={targa}
                onChange={(e) => setTarga(e.target.value)}
                placeholder="es. AB123CD"
                className={`${inputClass} font-mono uppercase tracking-wider`}
              />
            </div>

            {/* Marca */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Marca</label>
              <select
                value={marca}
                onChange={(e) => { setMarca(e.target.value); setModello(''); }}
                className={inputClass}
              >
                <option value="">Tutte</option>
                {marcheDisponibili.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Modello */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Modello</label>
              <select
                value={modello}
                onChange={(e) => setModello(e.target.value)}
                disabled={!marca}
                className={`${inputClass} ${!marca ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
              >
                <option value="">Tutti</option>
                {modelliDisponibili.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Sigla motore */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Sigla motore</label>
              <input
                type="text"
                value={siglaMotore}
                onChange={(e) => setSiglaMotore(e.target.value)}
                placeholder="es. M13A"
                className={inputClass}
              />
            </div>

            {/* Reset */}
            {hasFilters && (
              <button
                onClick={() => { setTarga(''); setMarca(''); setModello(''); setSiglaMotore(''); }}
                className="w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors pt-2"
              >
                Rimuovi filtri
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Contenuto principale */}
      <div className="flex-1 min-w-0">
        {/* Header risultati + ordina */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <p className="text-sm text-gray-500">
            {filtrati.length} {filtrati.length === 1 ? 'veicolo' : 'veicoli'}
            {hasFilters && ' (filtrati)'}
          </p>
          <select
            value={ordina}
            onChange={(e) => setOrdina(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 bg-white focus:border-[#1a5f96] outline-none"
          >
            <option value="recenti">Piu recenti</option>
            <option value="anno-desc">Anno: piu recente</option>
            <option value="anno-asc">Anno: meno recente</option>
            <option value="marca">Marca A-Z</option>
            <option value="ricambi">Piu ricambi</option>
          </select>
        </div>

        {/* Filtri mobile */}
        <div className="xl:hidden mb-4">
          <details className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <summary className="text-sm font-semibold text-[#1a5f96] cursor-pointer">Filtra veicoli</summary>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Targa</label>
                <input type="text" value={targa} onChange={(e) => setTarga(e.target.value)}
                  placeholder="AB123CD" className={`${inputClass} font-mono uppercase`} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Marca</label>
                <select value={marca} onChange={(e) => { setMarca(e.target.value); setModello(''); }} className={inputClass}>
                  <option value="">Tutte</option>
                  {marcheDisponibili.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Modello</label>
                <select value={modello} onChange={(e) => setModello(e.target.value)} disabled={!marca}
                  className={`${inputClass} ${!marca ? 'bg-gray-50 text-gray-400' : ''}`}>
                  <option value="">Tutti</option>
                  {modelliDisponibili.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Sigla motore</label>
                <input type="text" value={siglaMotore} onChange={(e) => setSiglaMotore(e.target.value)}
                  placeholder="es. M13A" className={inputClass} />
              </div>
            </div>
          </details>
        </div>

        <VeicoliCards veicoli={filtrati} />
      </div>
    </div>
  );
}
