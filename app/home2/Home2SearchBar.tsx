'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { EBAY_CATEGORIES_IT } from '../../lib/ebay/categories';

const ALL_CATEGORIES = 'Tutte le categorie';
const ALL_LOCATIONS = 'Tutta Italia';

export default function Home2SearchBar() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [categoria, setCategoria] = useState(ALL_CATEGORIES);
  const [dove, setDove] = useState('');
  const [catOpen, setCatOpen] = useState(false);
  const catRef = useRef<HTMLDivElement>(null);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [sugOpen, setSugOpen] = useState(false);
  const [sugIndex, setSugIndex] = useState(-1);
  const qRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reqIdRef = useRef(0);

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
      if (qRef.current && !qRef.current.contains(e.target as Node)) setSugOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const term = q.trim();
    if (term.length < 2) {
      setSuggestions([]);
      setSugIndex(-1);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const reqId = ++reqIdRef.current;
      try {
        const res = await fetch(`/api/ricerca/suggerimenti?q=${encodeURIComponent(term)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (reqId !== reqIdRef.current) return;
        const list: string[] = Array.isArray(data.suggestions) ? data.suggestions : [];
        setSuggestions(list);
        setSugIndex(-1);
      } catch {
        // swallow network errors
      }
    }, 180);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q]);

  function submit(overrideQ?: string) {
    const finalQ = (overrideQ ?? q).trim();
    const params = new URLSearchParams();
    if (finalQ) params.set('q', finalQ);
    if (categoria !== ALL_CATEGORIES) params.set('categoria', categoria);
    if (dove.trim()) params.set('provincia', dove.trim());
    router.push(`/ricerca${params.toString() ? `?${params.toString()}` : ''}`);
  }

  function onSearchKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!sugOpen || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        submit();
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSugIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSugIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (sugIndex >= 0) {
        const chosen = suggestions[sugIndex];
        setQ(chosen);
        setSugOpen(false);
        submit(chosen);
      } else {
        submit();
      }
    } else if (e.key === 'Escape') {
      setSugOpen(false);
    }
  }

  function onLocationKey(e: React.KeyboardEvent<HTMLInputElement>) {
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
      className="w-full"
    >
      <div className="flex items-center bg-white rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-gray-100 p-1.5 gap-1">
        {/* Cerca ricambi */}
        <div ref={qRef} className="relative flex-1">
          <div className="flex items-center gap-3 pl-4 pr-2 h-12">
            <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={q}
              onChange={(e) => { setQ(e.target.value); setSugOpen(true); }}
              onFocus={() => { if (suggestions.length > 0) setSugOpen(true); }}
              onKeyDown={onSearchKey}
              placeholder="Cerca ricambi (es. centralina motore Citroen C3)"
              className="w-full text-sm text-gray-800 placeholder:text-gray-400 bg-transparent outline-none"
              autoComplete="off"
              role="combobox"
              aria-expanded={sugOpen && suggestions.length > 0}
              aria-controls="home2-suggestions"
            />
          </div>

          {sugOpen && suggestions.length > 0 && (
            <ul
              id="home2-suggestions"
              role="listbox"
              className="absolute left-0 right-0 top-full mt-2 max-h-80 overflow-y-auto bg-white border border-gray-200 rounded-2xl shadow-lg z-50 py-2"
            >
              {suggestions.map((s, i) => (
                <li
                  key={s}
                  role="option"
                  aria-selected={i === sugIndex}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setQ(s);
                    setSugOpen(false);
                    submit(s);
                  }}
                  onMouseEnter={() => setSugIndex(i)}
                  className={`flex items-center gap-3 px-4 py-2 text-sm cursor-pointer ${i === sugIndex ? 'bg-gray-100' : 'hover:bg-gray-50'} text-gray-800`}
                >
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span className="truncate">{s}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="h-8 w-px bg-gray-200" />

        {/* Categoria */}
        <div ref={catRef} className="relative w-56 shrink-0">
          <button
            type="button"
            onClick={() => setCatOpen((v) => !v)}
            className="w-full h-12 pl-4 pr-3 flex items-center gap-3 text-left text-sm text-gray-800 hover:bg-gray-50 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            <span className="truncate flex-1">{categoria}</span>
          </button>

          {catOpen && (
            <div className="absolute left-0 right-0 top-full mt-2 max-h-[60vh] overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-2">
              <button
                type="button"
                onClick={() => { setCategoria(ALL_CATEGORIES); setCatOpen(false); }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${categoria === ALL_CATEGORIES ? 'font-semibold text-[#0064D2]' : 'text-gray-800'}`}
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
                      className={`w-full text-left px-4 py-1.5 text-sm hover:bg-gray-50 ${categoria === c.label ? 'font-semibold text-[#0064D2]' : 'text-gray-800'}`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-gray-200" />

        {/* Dove */}
        <div className="flex items-center gap-3 w-56 shrink-0 px-4 h-12">
          <svg className="w-5 h-5 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <input
            type="text"
            value={dove}
            onChange={(e) => setDove(e.target.value)}
            onKeyDown={onLocationKey}
            placeholder={ALL_LOCATIONS}
            className="w-full text-sm text-gray-800 placeholder:text-gray-500 bg-transparent outline-none"
            autoComplete="off"
          />
        </div>

        {/* Cerca */}
        <button
          type="submit"
          className="shrink-0 h-12 px-8 rounded-full bg-[#4E92F5] hover:bg-[#3f7dd4] text-white text-sm font-semibold transition-colors"
        >
          Cerca
        </button>
      </div>
    </form>
  );
}
