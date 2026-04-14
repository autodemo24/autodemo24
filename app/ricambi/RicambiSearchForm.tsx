'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Props {
  marche: string[];
  categorie: string[];
  initial: {
    marca?: string;
    modello?: string;
    anno?: string;
    categoria?: string;
    provincia?: string;
    q?: string;
  };
}

export default function RicambiSearchForm({ marche, categorie, initial }: Props) {
  const router = useRouter();
  const [marca, setMarca] = useState(initial.marca ?? '');
  const [modello, setModello] = useState(initial.modello ?? '');
  const [anno, setAnno] = useState(initial.anno ?? '');
  const [categoria, setCategoria] = useState(initial.categoria ?? '');
  const [provincia, setProvincia] = useState(initial.provincia ?? '');
  const [q, setQ] = useState(initial.q ?? '');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (marca) params.set('marca', marca);
    if (modello) params.set('modello', modello);
    if (anno) params.set('anno', anno);
    if (categoria) params.set('categoria', categoria);
    if (provincia) params.set('provincia', provincia);
    router.push(`/ricambi${params.toString() ? '?' + params.toString() : ''}`);
  }

  function reset() {
    setMarca(''); setModello(''); setAnno(''); setCategoria(''); setProvincia(''); setQ('');
    router.push('/ricambi');
  }

  const fieldCls = "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#003580] focus:ring-2 focus:ring-[#003580]/10 bg-white";
  const labelCls = "block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5";

  return (
    <form onSubmit={submit}
      className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <div>
        <h2 className="text-sm font-bold text-gray-900 mb-3">Filtra risultati</h2>
      </div>

      <div>
        <label className={labelCls}>Cerca</label>
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="faro, cambio, paraurti…"
          className={fieldCls}
        />
      </div>

      <div>
        <label className={labelCls}>Categoria</label>
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className={fieldCls}
        >
          <option value="">Tutte le categorie</option>
          {categorie.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div>
        <label className={labelCls}>Marca</label>
        <select
          value={marca}
          onChange={(e) => setMarca(e.target.value)}
          className={fieldCls}
        >
          <option value="">Tutte le marche</option>
          {marche.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div>
        <label className={labelCls}>Modello</label>
        <input
          type="text"
          value={modello}
          onChange={(e) => setModello(e.target.value)}
          placeholder="es. Punto, Panda…"
          className={fieldCls}
        />
      </div>

      <div>
        <label className={labelCls}>Anno</label>
        <input
          type="number"
          value={anno}
          onChange={(e) => setAnno(e.target.value)}
          placeholder="es. 2015"
          min={1900}
          max={new Date().getFullYear() + 1}
          className={fieldCls}
        />
      </div>

      <div>
        <label className={labelCls}>Provincia</label>
        <input
          type="text"
          value={provincia}
          onChange={(e) => setProvincia(e.target.value)}
          placeholder="es. MI, Roma"
          className={fieldCls}
        />
      </div>

      <div className="pt-2 space-y-2 border-t border-gray-100">
        <button type="submit"
          className="w-full px-4 py-2.5 bg-[#FF6600] hover:bg-[#d4580a] text-white text-sm font-bold rounded-lg transition-colors">
          Applica filtri
        </button>
        <button type="button" onClick={reset}
          className="w-full px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors">
          Reset
        </button>
      </div>
    </form>
  );
}
