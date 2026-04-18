'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface NavbarProps {
  backTo?: { href: string; label: string };
}

interface SessionData {
  id: number;
  ragioneSociale: string;
  email: string;
}


export default function Navbar({ backTo }: NavbarProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [session, setSession] = useState<SessionData | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => setSession(data))
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setSession(null);
    setUserOpen(false);
    router.push('/');
    router.refresh();
  };

  return (
    <header className="bg-white sticky top-0 z-30">
      {/* ── Barra principale ── */}
      <div>
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/" className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo-black.svg" alt="Autigo" className="h-8" />
          </a>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-5">
            {session ? (
              <div className="relative">
                <button onClick={() => setUserOpen((v) => !v)}
                  className="flex items-center gap-2 text-sm font-bold text-gray-900 hover:text-gray-700">
                  <span className="truncate max-w-[160px]">{session.ragioneSociale}</span>
                  <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${userOpen ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {userOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-1.5">
                      <div className="px-4 py-2.5 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-800 truncate">{session.ragioneSociale}</p>
                        <p className="text-xs text-gray-400 truncate">{session.email}</p>
                      </div>
                      <a href="/dashboard" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">Dashboard</a>
                      <a href="/dashboard/ricambi" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">I miei ricambi</a>
                      <a href="/dashboard/scansiona" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">Scansiona QR</a>
                      <a href="/dashboard/profilo" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">Profilo aziendale</a>
                      <button onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100 mt-1">
                        Esci
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <a href="/login" className="text-sm font-bold text-gray-900 hover:text-gray-700">Accedi</a>
                <a href="/registrati" className="text-sm text-gray-500 hover:text-gray-700">Registrati</a>
              </>
            )}

            <a href={session ? '/dashboard/ricambi/nuovo' : '/registrati'}
              className="flex items-center gap-1.5 pl-3 pr-4 py-1.5 bg-[#FFF3E8] text-[#FF6600] border border-[#FFD2AD] rounded-full text-sm font-bold hover:bg-[#FFE7D1] transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" opacity="0.15"/>
                <path fillRule="evenodd" clipRule="evenodd"
                  d="M12 7a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H8a1 1 0 110-2h3V8a1 1 0 011-1z"/>
              </svg>
              Inserisci ricambio
            </a>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded text-gray-600 hover:bg-gray-100" aria-label="Menu">
            {menuOpen ? (
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
      </div>

      {/* Back link (optional) */}
      {backTo && (
        <div className="border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-4 py-2">
            <a href={backTo.href} className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {backTo.label}
            </a>
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col gap-1">
            {session && (
              <div className="flex items-center gap-3 px-3 py-3 mb-2 bg-gray-50 rounded-lg">
                <div className="w-9 h-9 rounded-full bg-[#1a5f96] flex items-center justify-center shrink-0">
                  <span className="text-white text-sm font-bold">{session.ragioneSociale.charAt(0)}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{session.ragioneSociale}</p>
                  <p className="text-xs text-gray-400 truncate">{session.email}</p>
                </div>
              </div>
            )}
            <a href="/ricambi" className="px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">Cerca ricambi</a>
            {session ? (
              <>
                <a href="/dashboard" className="px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">Dashboard</a>
                <a href="/dashboard/ricambi" className="px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">I miei ricambi</a>
                <a href="/dashboard/scansiona" className="px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">Scansiona QR</a>
                <a href="/dashboard/ricambi/nuovo" className="mt-2 px-4 py-2.5 bg-[#FFF3E8] text-[#FF6600] border border-[#FFD2AD] rounded-full text-sm font-bold text-center">
                  + Inserisci ricambio
                </a>
                <button onClick={handleLogout}
                  className="px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg text-left mt-1 border-t border-gray-100 pt-3">
                  Esci
                </button>
              </>
            ) : (
              <>
                <a href="/login" className="px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">Accedi</a>
                <a href="/registrati" className="px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">Registrati</a>
                <a href="/registrati" className="mt-2 px-4 py-2.5 bg-[#FFF3E8] text-[#FF6600] border border-[#FFD2AD] rounded-full text-sm font-bold text-center">
                  + Inserisci ricambio
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
