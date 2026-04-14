'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

export type ComboOption = {
  id: string;
  label: string;
  hint?: string;
};

interface Props {
  options: ComboOption[];
  value: string;
  onSelect: (opt: ComboOption | null) => void;
  onFreeText?: (text: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  required?: boolean;
  allowFreeText?: boolean;
  emptyMessage?: string;
  filterMode?: 'startsWith' | 'includes';
  uppercase?: boolean;
}

export default function Combobox({
  options,
  value,
  onSelect,
  onFreeText,
  placeholder = 'Seleziona…',
  searchPlaceholder = 'Cerca…',
  disabled = false,
  required = false,
  allowFreeText = false,
  emptyMessage = 'Nessun risultato',
  filterMode = 'startsWith',
  uppercase = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setHighlighted(0);
    const t = setTimeout(() => searchRef.current?.focus(), 10);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onMouse = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onMouse);
    return () => document.removeEventListener('mousedown', onMouse);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) =>
      filterMode === 'startsWith'
        ? o.label.toLowerCase().startsWith(q)
        : o.label.toLowerCase().includes(q),
    );
  }, [options, query, filterMode]);

  const exactMatch = useMemo(
    () => filtered.some((o) => o.label.toLowerCase() === query.trim().toLowerCase()),
    [filtered, query],
  );

  const showFreeTextItem = allowFreeText && query.trim() !== '' && !exactMatch;
  const totalItems = filtered.length + (showFreeTextItem ? 1 : 0);

  useEffect(() => {
    if (highlighted >= totalItems) setHighlighted(Math.max(0, totalItems - 1));
  }, [totalItems, highlighted]);

  function scrollHighlightedIntoView(idx: number) {
    const li = listRef.current?.children[idx] as HTMLElement | undefined;
    li?.scrollIntoView({ block: 'nearest' });
  }

  function pick(opt: ComboOption) {
    onSelect(opt);
    setOpen(false);
  }

  function pickFreeText() {
    const t = query.trim();
    if (!t) return;
    onFreeText?.(t);
    setOpen(false);
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    if (disabled) return;
    onSelect(null);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.min(totalItems - 1, highlighted + 1);
      setHighlighted(next);
      scrollHighlightedIntoView(next);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.max(0, highlighted - 1);
      setHighlighted(next);
      scrollHighlightedIntoView(next);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlighted < filtered.length) pick(filtered[highlighted]);
      else if (showFreeTextItem) pickFreeText();
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm border rounded-lg bg-white transition-colors ${
          disabled
            ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
            : open
              ? 'border-[#003580] ring-1 ring-[#003580]/20'
              : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <span className={`truncate text-left ${value ? 'text-gray-900' : 'text-gray-400'} ${uppercase && value ? 'uppercase' : ''}`}>
          {value || placeholder}
        </span>
        <span className="flex items-center gap-1.5 shrink-0">
          {value && !disabled && (
            <span
              onClick={clear}
              onMouseDown={(e) => e.stopPropagation()}
              role="button"
              aria-label="Cancella selezione"
              className="w-4 h-4 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer text-base leading-none"
            >×</span>
          )}
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {required && (
        <input
          tabIndex={-1}
          aria-hidden
          className="absolute opacity-0 pointer-events-none left-3 bottom-0 w-0 h-0"
          value={value}
          onChange={() => {}}
          required
        />
      )}

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setHighlighted(0); }}
                onKeyDown={onKeyDown}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#003580]"
              />
              <svg
                className="w-4 h-4 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <ul ref={listRef} className="max-h-64 overflow-y-auto py-1">
            {filtered.map((opt, i) => {
              const isHi = i === highlighted;
              const isSel = opt.label === value;
              return (
                <li
                  key={opt.id}
                  onMouseEnter={() => setHighlighted(i)}
                  onClick={() => pick(opt)}
                  className={`px-3 py-1.5 text-sm cursor-pointer ${uppercase ? 'uppercase' : ''} ${
                    isHi
                      ? 'bg-[#003580] text-white'
                      : isSel
                        ? 'bg-blue-50 text-[#003580] font-medium'
                        : 'text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <div className="truncate">{opt.label}</div>
                  {opt.hint && (
                    <div className={`text-xs ${isHi ? 'text-white/80' : 'text-gray-500'}`}>{opt.hint}</div>
                  )}
                </li>
              );
            })}

            {showFreeTextItem && (
              <li
                onMouseEnter={() => setHighlighted(filtered.length)}
                onClick={pickFreeText}
                className={`px-3 py-1.5 text-sm cursor-pointer border-t border-gray-100 ${
                  highlighted === filtered.length ? 'bg-[#003580] text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                + Usa <span className="font-semibold">&quot;{query}&quot;</span>
              </li>
            )}

            {filtered.length === 0 && !showFreeTextItem && (
              <li className="px-3 py-4 text-sm text-gray-400 text-center">{emptyMessage}</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
