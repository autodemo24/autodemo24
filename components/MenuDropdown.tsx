'use client';

import { useEffect, useRef, useState } from 'react';

const SECTIONS: { title?: string; items: { label: string; href: string }[] }[] = [
  {
    items: [
      { label: 'Accedi', href: '/login' },
      { label: 'Registrati', href: '/registrati' },
    ],
  },
  {
    title: 'Autigo',
    items: [
      { label: 'Chi siamo', href: '/chi-siamo' },
      { label: 'Vendi su Autigo', href: '/registrati' },
      { label: 'Autigo per le aziende', href: '/business' },
      { label: 'Magazine', href: '/magazine' },
    ],
  },
  {
    title: 'Area personale',
    items: [
      { label: 'Preferiti', href: '/preferiti' },
      { label: 'Ricerche salvate', href: '/ricerche-salvate' },
    ],
  },
  {
    title: 'Supporto',
    items: [
      { label: 'Assistenza', href: '/assistenza' },
      { label: 'Consigli per la vendita', href: '/consigli' },
      { label: 'Privacy', href: '/privacy' },
      { label: 'Termini', href: '/termini' },
    ],
  },
];

export default function MenuDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 px-4 h-11 rounded-2xl border border-gray-200 bg-white text-sm font-bold text-gray-900 hover:bg-gray-50 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
        </svg>
        Menu
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-lg z-50 py-2 max-h-[80vh] overflow-y-auto"
        >
          {SECTIONS.map((section, i) => (
            <div key={i} className={i > 0 ? 'border-t border-gray-100 pt-2 mt-2' : ''}>
              {section.title && (
                <p className="px-4 pb-1 text-[11px] uppercase tracking-wide text-gray-400 font-semibold">
                  {section.title}
                </p>
              )}
              {section.items.map((it) => (
                <a
                  key={it.label}
                  href={it.href}
                  role="menuitem"
                  className="block px-4 py-2 text-sm text-gray-800 hover:bg-gray-50"
                >
                  {it.label}
                </a>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
