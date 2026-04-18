'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { EBAY_CATEGORIES_IT } from '../lib/ebay/categories';

const ALL_CATEGORIES = 'Tutte le categorie';
const ALL_LOCATIONS = 'Tutta Italia';

export default function HomeSearchCard() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [categoria, setCategoria] = useState(ALL_CATEGORIES);
  const [dove, setDove] = useState('');
  const [catOpen, setCatOpen] = useState(false);
  const catRef = useRef<HTMLDivElement>(null);

  const grouped = useMemo(() => {
    const groups = new Map<string, typeof EBAY_CATEGORIES_IT>();
    for (const c of EBAY_CATEGORIES_IT) {
      const parent = c.parentPath.split(' > ')[1] ?? c.parentPath;
      if (!groups.has(parent)) groups.set(parent, []);
      groups.get(parent)!.push(c);
    }
    return Array.from(groups.entries());
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (catRef.current && !catRef.current.contains(e.target as Node)) setCatOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  function submit() {
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (categoria !== ALL_CATEGORIES) params.set('categoria', categoria);
    if (dove.trim()) params.set('provincia', dove.trim());
    router.push(`/ricerca${params.toString() ? `?${params.toString()}` : ''}`);
  }

  function onEnter(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="w-full max-w-5xl mx-auto"
    >
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-0 lg:items-end">
        {/* Cosa cerchi? */}
        <div className="flex-1 lg:pr-4">
          <label className="block text-sm font-semibold text-gray-800 mb-2">Cosa cerchi?</label>
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={onEnter}
              placeholder="centralina, motore, faro…"
              className="w-full h-12 pl-12 pr-4 text-base text-gray-800 placeholder:text-gray-400 bg-white border border-gray-200 rounded-xl outline-none focus:border-gray-400"
              autoComplete="off"
            />
          </div>
        </div>

        {/* In quale categoria? */}
        <div ref={catRef} className="flex-1 lg:px-4 relative">
          <label className="block text-sm font-semibold text-gray-800 mb-2">In quale categoria?</label>
          <button
            type="button"
            onClick={() => setCatOpen((v) => !v)}
            className="w-full h-12 pl-12 pr-10 text-left text-base text-gray-800 bg-white border border-gray-200 rounded-xl outline-none focus:border-gray-400 relative"
          >
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            <span className="truncate block">{categoria}</span>
            <svg className={`absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 transition-transform ${catOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {catOpen && (
            <div className="absolute left-0 right-0 top-full mt-1 max-h-[60vh] overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-2">
              <button
                type="button"
                onClick={() => { setCategoria(ALL_CATEGORIES); setCatOpen(false); }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${categoria === ALL_CATEGORIES ? 'font-semibold text-[#E8620A]' : 'text-gray-800'}`}
              >
                {ALL_CATEGORIES}
              </button>
              {grouped.map(([parent, items]) => (
                <div key={parent} className="mt-2">
                  <p className="px-4 py-1 text-[11px] uppercase tracking-wide text-gray-400 font-semibold">{parent}</p>
                  {items.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { setCategoria(c.label); setCatOpen(false); }}
                      className={`w-full text-left px-4 py-1.5 text-sm hover:bg-gray-50 ${categoria === c.label ? 'font-semibold text-[#E8620A]' : 'text-gray-800'}`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dove? + bottone cerca */}
        <div className="flex-1 lg:pl-4 flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-800 mb-2">Dove?</label>
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <input
                type="text"
                value={dove}
                onChange={(e) => setDove(e.target.value)}
                onKeyDown={onEnter}
                placeholder={ALL_LOCATIONS}
                className="w-full h-12 pl-12 pr-10 text-base text-gray-800 placeholder:text-gray-500 bg-white border border-gray-200 rounded-xl outline-none focus:border-gray-400"
                autoComplete="off"
              />
              {dove && (
                <button
                  type="button"
                  onClick={() => setDove('')}
                  aria-label="Cancella"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Bottone cerca tondo arancione */}
          <button
            type="submit"
            aria-label="Cerca"
            className="shrink-0 w-12 h-12 rounded-full bg-[#E8620A] hover:bg-[#cc540a] text-white flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </div>
    </form>
  );
}
