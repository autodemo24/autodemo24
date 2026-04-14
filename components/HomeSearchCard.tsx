'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export const CATEGORIE_RICAMBI = [
  'Tutte le categorie',
  'Aspirazione e iniezione',
  'Auto elettriche, ibride e PHEV: ricambi',
  'Cambio e trasmissione',
  'Carrozzeria: ricambi e accessori',
  'Cinghie servizi',
  'Climatizzazione e riscaldamento',
  'Componenti raffreddamento motore',
  'Freni e ricambi',
  'Illuminazione e lampadine',
  'Interni auto: ricambi e accessori',
  'Motori e ricambi',
  'Motorini avviamento, alternatori, ECU',
  'Portapacchi e box da tetto',
  'Ruote, pneumatici e ricambi',
  'Sistemi avanzati assistenza alla guida',
  'Sistemi di accensione e componenti',
  'Sistemi di scarico ed emissioni',
  'Sterzo e ammortizzatori',
  'Traino: ricambi e accessori',
  'Altro auto: ricambi e accessori',
];

export default function HomeSearchCard() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [categoria, setCategoria] = useState('Tutte le categorie');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    const queryText = [q.trim(), categoria !== 'Tutte le categorie' ? categoria : '']
      .filter(Boolean)
      .join(' ');
    if (queryText) params.set('q', queryText);
    router.push(`/ricerca${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <form onSubmit={submit} className="flex items-center gap-3">
      {/* Pill: search + categoria */}
      <div className="flex-1 flex items-center bg-white border border-gray-200 hover:border-gray-300 focus-within:border-[#003580] focus-within:ring-2 focus-within:ring-[#003580]/10 rounded-full h-12 min-w-0 overflow-hidden transition-colors">
        {/* Search icon + input */}
        <div className="flex items-center flex-1 min-w-0 pl-5">
          <svg className="w-5 h-5 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cerca su autodemo24"
            className="w-full h-full px-3 text-[15px] text-gray-800 placeholder:text-gray-400 outline-none bg-transparent"
          />
        </div>

        {/* Divider */}
        <div className="h-7 w-px bg-gray-300 shrink-0" />

        {/* Categoria dropdown */}
        <div className="relative shrink-0">
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="h-12 pl-4 pr-8 text-[14px] text-gray-700 bg-transparent outline-none appearance-none cursor-pointer max-w-[200px] truncate"
          >
            {CATEGORIE_RICAMBI.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Cerca button (tondo) */}
      <button
        type="submit"
        aria-label="Cerca"
        className="shrink-0 w-12 h-12 bg-[#003580] hover:bg-[#002a66] text-white rounded-full flex items-center justify-center transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
    </form>
  );
}
