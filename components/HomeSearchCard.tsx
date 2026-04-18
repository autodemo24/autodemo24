'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { EBAY_CATEGORIES_IT } from '../lib/ebay/categories';

const ALL_CATEGORIES = 'Tutte le categorie';

export default function HomeSearchCard() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [categoria, setCategoria] = useState(ALL_CATEGORIES);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const catRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Raggruppa categorie per parent path
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
    if (q.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(() => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      fetch(`/api/ricerca/suggerimenti?q=${encodeURIComponent(q.trim())}`, { signal: ac.signal })
        .then((r) => (r.ok ? r.json() : { suggestions: [] }))
        .then((data: { suggestions: string[] }) => {
          setSuggestions(data.suggestions ?? []);
          setHighlight(-1);
        })
        .catch(() => {});
    }, 180);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
      if (catRef.current && !catRef.current.contains(e.target as Node)) setCatOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  function submit(text: string) {
    const query = text.trim();
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (categoria !== ALL_CATEGORIES) params.set('categoria', categoria);
    if (!query && categoria === ALL_CATEGORIES) return;
    router.push(`/ricerca${params.toString() ? `?${params.toString()}` : ''}`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      submit(highlight >= 0 ? suggestions[highlight] : q);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setCatOpen(false);
    }
  }

  const showDropdown = open && (suggestions.length > 0 || q.trim().length >= 2);

  return (
    <div ref={wrapRef} className="relative w-full max-w-2xl mx-auto">
      <div
        className={`flex items-center bg-white border border-gray-300 ${
          showDropdown ? 'rounded-t-3xl border-b-gray-200' : 'rounded-full shadow-sm'
        } hover:shadow-md focus-within:shadow-md transition-shadow h-14 overflow-visible`}
      >
        {/* Icona lente */}
        <svg className="w-5 h-5 text-gray-500 ml-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>

        {/* Input testo */}
        <input
          type="text"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Cerca ricambi (es. centralina motore Citroen C3)"
          className="flex-1 min-w-0 h-full px-4 text-base text-gray-800 placeholder:text-gray-500 outline-none bg-transparent"
          autoComplete="off"
        />

        {q && (
          <button
            type="button"
            onClick={() => setQ('')}
            aria-label="Cancella ricerca"
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Divider + Dropdown categorie */}
        <div className="h-8 w-px bg-gray-200 shrink-0" />
        <div ref={catRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setCatOpen((v) => !v)}
            className="h-14 pl-4 pr-5 text-sm text-gray-700 flex items-center gap-2 hover:bg-gray-50 rounded-r-full max-w-[200px]"
          >
            <span className="truncate">{categoria}</span>
            <svg className={`w-4 h-4 text-gray-500 shrink-0 transition-transform ${catOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {catOpen && (
            <div className="absolute right-0 top-full mt-1 w-72 max-h-[60vh] overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-2">
              <button
                type="button"
                onClick={() => { setCategoria(ALL_CATEGORIES); setCatOpen(false); }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${categoria === ALL_CATEGORIES ? 'font-semibold text-[#4E92F5]' : 'text-gray-800'}`}
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
                      className={`w-full text-left px-4 py-1.5 text-sm hover:bg-gray-50 ${categoria === c.label ? 'font-semibold text-[#4E92F5]' : 'text-gray-800'}`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 bg-white border border-t-0 border-gray-300 rounded-b-3xl shadow-md overflow-hidden pt-1 pb-3">
          {suggestions.length > 0 ? (
            <ul>
              {suggestions.map((s, i) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => submit(s)}
                    onMouseEnter={() => setHighlight(i)}
                    className={`w-full text-left px-5 py-2 flex items-center gap-4 text-[15px] text-gray-800 ${
                      highlight === i ? 'bg-gray-100' : 'hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span className="truncate">{s}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-5 py-3 text-sm text-gray-500">Nessun suggerimento — premi Invio per cercare.</div>
          )}
        </div>
      )}
    </div>
  );
}
