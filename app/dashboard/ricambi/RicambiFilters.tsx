'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

interface Props {
  categorie: string[];
  initial: {
    stato?: string;
    categoria?: string;
    ubicazione?: string;
    q?: string;
  };
}

const STATI = ['DISPONIBILE', 'RISERVATO', 'VENDUTO', 'RITIRATO'];

export default function RicambiFilters({ categorie, initial }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const [stato, setStato] = useState(initial.stato ?? '');
  const [categoria, setCategoria] = useState(initial.categoria ?? '');
  const [ubicazione, setUbicazione] = useState(initial.ubicazione ?? '');
  const [q, setQ] = useState(initial.q ?? '');

  useEffect(() => {
    setStato(sp.get('stato') ?? '');
    setCategoria(sp.get('categoria') ?? '');
    setUbicazione(sp.get('ubicazione') ?? '');
    setQ(sp.get('q') ?? '');
  }, [sp]);

  function apply(next: Partial<{ stato: string; categoria: string; ubicazione: string; q: string }>) {
    const params = new URLSearchParams();
    const values = { stato, categoria, ubicazione, q, ...next };
    if (values.stato) params.set('stato', values.stato);
    if (values.categoria) params.set('categoria', values.categoria);
    if (values.ubicazione) params.set('ubicazione', values.ubicazione);
    if (values.q) params.set('q', values.q);
    router.push(`/dashboard/ricambi${params.toString() ? '?' + params.toString() : ''}`);
  }

  function reset() {
    setStato(''); setCategoria(''); setUbicazione(''); setQ('');
    router.push('/dashboard/ricambi');
  }

  return (
    <form
      className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
      onSubmit={(e) => { e.preventDefault(); apply({}); }}
    >
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Cerca (nome, codice, descrizione)"
        className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#003580]"
      />
      <select
        value={stato}
        onChange={(e) => { setStato(e.target.value); apply({ stato: e.target.value }); }}
        className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#003580]"
      >
        <option value="">Tutti gli stati</option>
        {STATI.map((s) => <option key={s} value={s}>{s.toLowerCase()}</option>)}
      </select>
      <select
        value={categoria}
        onChange={(e) => { setCategoria(e.target.value); apply({ categoria: e.target.value }); }}
        className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#003580]"
      >
        <option value="">Tutte le categorie</option>
        {categorie.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <input
        type="text"
        value={ubicazione}
        onChange={(e) => setUbicazione(e.target.value)}
        placeholder="Ubicazione (es. 86A)"
        className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#003580]"
      />
      <div className="flex gap-2">
        <button type="submit" className="flex-1 px-4 py-2 bg-[#003580] hover:bg-[#002560] text-white text-sm font-semibold rounded-lg">
          Applica
        </button>
        <button type="button" onClick={reset} className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50">
          Reset
        </button>
      </div>
    </form>
  );
}
