'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

const OPZIONI = [
  { value: 'rilevanti', label: 'Più rilevanti' },
  { value: 'recenti', label: 'Appena messi in vendita' },
] as const;

export default function SortDropdown() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get('ordina') || 'rilevanti';
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentLabel = OPZIONI.find((o) => o.value === current)?.label ?? OPZIONI[0].label;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function select(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'rilevanti') {
      params.delete('ordina');
    } else {
      params.set('ordina', value);
    }
    setOpen(false);
    router.push(`/ricerca?${params.toString()}`);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:border-gray-300 transition-colors"
      >
        <span className="text-gray-400">Ordina:</span>
        <span className="font-medium">{currentLabel}</span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-20 py-1">
          {OPZIONI.map((o) => (
            <button
              key={o.value}
              onClick={() => select(o.value)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                current === o.value
                  ? 'text-[#003580] font-semibold bg-[#003580]/5'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
