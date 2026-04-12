'use client';

import { useState } from 'react';

interface NavbarProps {
  variant?: 'white' | 'blue';
  backTo?: { href: string; label: string };
}

export default function Navbar({ variant = 'blue', backTo }: NavbarProps) {
  const [open, setOpen] = useState(false);

  const isWhite = variant === 'white';

  const bg = isWhite ? 'bg-white shadow-sm' : 'bg-[#003580]';
  const logoColor = isWhite ? 'text-[#003580]' : 'text-white';
  const linkColor = isWhite
    ? 'text-gray-600 hover:text-[#003580]'
    : 'text-white/80 hover:text-white';
  const ctaBg = isWhite
    ? 'border-2 border-[#FF6600] text-[#FF6600] hover:bg-[#FF6600] hover:text-white'
    : 'bg-[#FF6600] hover:bg-orange-600 text-white';

  return (
    <header className={`${bg} sticky top-0 z-30`}>
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center gap-4">
          {backTo && (
            <a
              href={backTo.href}
              className={`${linkColor} flex items-center gap-1 text-sm transition-colors`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">{backTo.label}</span>
            </a>
          )}
          <a href="/" className="flex items-center gap-1">
            <span className={`text-2xl font-extrabold ${logoColor}`}>auto</span>
            <span className="text-2xl font-extrabold text-[#FF6600]">demo24</span>
          </a>
        </div>

        {/* Desktop links */}
        <nav className="hidden md:flex items-center gap-4">
          <a href="/ricerca" className={`text-sm font-medium ${linkColor}`}>Cerca</a>
          <a href="/login" className={`text-sm font-medium ${linkColor}`}>Accedi</a>
          <a
            href="/registrati"
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${ctaBg}`}
          >
            Registrati gratis
          </a>
        </nav>

        {/* Hamburger button (mobile) */}
        <button
          onClick={() => setOpen(!open)}
          className={`md:hidden p-2 rounded-lg ${isWhite ? 'text-gray-600 hover:bg-gray-100' : 'text-white hover:bg-white/10'}`}
          aria-label="Menu"
        >
          {open ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className={`md:hidden border-t ${isWhite ? 'border-gray-200 bg-white' : 'border-white/10 bg-[#003580]'}`}>
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-3">
            <a href="/ricerca" className={`text-sm font-medium py-2 ${linkColor}`}>Cerca veicoli</a>
            <a href="/ricambi" className={`text-sm font-medium py-2 ${linkColor}`}>Ricambi</a>
            <a href="/login" className={`text-sm font-medium py-2 ${linkColor}`}>Accedi</a>
            <a href="/registrati" className={`text-sm font-medium py-2 ${linkColor}`}>Per i demolitori</a>
            <a
              href="/registrati"
              className={`mt-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-center transition-colors ${ctaBg}`}
            >
              Registrati gratis
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
