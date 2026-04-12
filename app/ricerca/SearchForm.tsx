'use client';

import { useEffect, useState } from 'react';
import { MARCHE } from '../../lib/veicoli-db';
import { PROVINCE } from '../../lib/province';

const CARBURANTI = ['Benzina','Diesel','Ibrido','Ibrido Plug-in','Elettrico','GPL','Metano'];
const CATEGORIE_RICAMBI = ['Meccanica','Carrozzeria','Illuminazione','Vetri','Interni','Ruote e freni'];

interface Props {
  ricambio?: string;
  marca?: string;
  modello?: string;
  anno?: string;
  annoDa?: string;
  annoA?: string;
  provincia?: string;
  carburante?: string;
  categoria?: string;
  siglaMotore?: string;
  cilindrata?: string;
}

export default function SearchForm({
  ricambio = '', marca: initialMarca = '', modello: initialModello = '',
  anno = '', annoDa = '', annoA = '',
  provincia = '', carburante = '',
  categoria = '', siglaMotore = '', cilindrata = '',
}: Props) {
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
    <form action="/ricerca" method="GET" className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Cosa cerchi?</label>
        <input type="text" name="ricambio" defaultValue={ricambio} placeholder="es. Motore, Cambio…"
          className={inputClass} />
      </div>

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
          <option value="">Tutti i modelli</option>
          {modelli.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Anno immatricolazione</label>
        <input type="number" name="anno" defaultValue={anno} placeholder="es. 2015"
          min={1990} max={new Date().getFullYear() + 1}
          className={inputClass} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Anno da</label>
          <input type="number" name="annoDa" defaultValue={annoDa} placeholder="2005"
            min={1990} max={new Date().getFullYear()} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Anno a</label>
          <input type="number" name="annoA" defaultValue={annoA} placeholder="2024"
            min={1990} max={new Date().getFullYear() + 1} className={inputClass} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Provincia</label>
        <select name="provincia" defaultValue={provincia} className={inputClass}>
          <option value="">Tutta Italia</option>
          {PROVINCE.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Alimentazione</label>
        <select name="carburante" defaultValue={carburante} className={inputClass}>
          <option value="">Qualsiasi</option>
          {CARBURANTI.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tipo ricambio</label>
        <select name="categoria" defaultValue={categoria} className={inputClass}>
          <option value="">Qualsiasi</option>
          {CATEGORIE_RICAMBI.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Sigla motore</label>
        <input type="text" name="siglaMotore" defaultValue={siglaMotore} placeholder="es. 188A4000"
          className={inputClass} />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Cilindrata (cc)</label>
        <input type="text" name="cilindrata" defaultValue={cilindrata} placeholder="es. 1300"
          className={inputClass} />
      </div>

      <button type="submit"
        className="w-full py-3 bg-[#FF6600] hover:bg-orange-600 text-white rounded-xl font-bold text-sm transition-colors cursor-pointer">
        Cerca
      </button>

      <a href="/ricerca"
        className="block text-center text-xs text-gray-400 hover:text-gray-600 transition-colors">
        Rimuovi tutti i filtri
      </a>
    </form>
  );
}
