'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

const OPZIONI: { value: string; label: string }[] = [
  { value: 'rilevanti', label: 'Più rilevanti' },
  { value: 'recenti', label: 'Appena pubblicati' },
  { value: 'prezzo-asc', label: 'Prezzo più basso' },
  { value: 'prezzo-desc', label: 'Prezzo più alto' },
];

interface Props {
  totale: number;
  query?: string;
}

export default function RicambiSortBar({ totale, query }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get('sort') ?? 'rilevanti';
  const [open, setOpen] = useState(false);

  const currentLabel = OPZIONI.find((o) => o.value === current)?.label ?? OPZIONI[0].label;

  const select = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'rilevanti') params.delete('sort');
    else params.set('sort', value);
    router.push(`/ricambi${params.toString() ? '?' + params.toString() : ''}`);
    setOpen(false);
  };

  return (
    <div className="flex items-center justify-between flex-wrap gap-3 pb-4 mb-4 border-b border-gray-200">
      {/* Sinistra: conteggio + salva ricerca */}
      <div className="flex items-center gap-4 min-w-0">
        <p className="text-sm text-gray-900">
          <span className="font-semibold">{totale.toLocaleString('it-IT')}</span>{' '}
          {totale === 1 ? 'risultato' : 'risultati'}
          {query && <> per <span className="font-semibold">{query}</span></>}
        </p>
        <button type="button"
          className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-[#003580] hover:text-[#002a66] transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          Salva ricerca
        </button>
      </div>

      {/* Destra: sort dropdown */}
      <div className="relative">
        <button type="button" onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 font-medium">
          <span className="text-gray-500">Mostra prima:</span>
          <span className="font-semibold">{currentLabel}</span>
          <svg className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-1.5">
              {OPZIONI.map((opt) => {
                const active = opt.value === current;
                return (
                  <button key={opt.value} type="button" onClick={() => select(opt.value)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors ${
                      active ? 'font-bold text-gray-900' : 'text-gray-700'
                    }`}>
                    <span>{opt.label}</span>
                    {active && (
                      <svg className="w-4 h-4 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
