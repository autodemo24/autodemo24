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
  const [open, setOpen] = useState(false);
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
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-4 h-[72px] flex items-center justify-between">

        {/* Left: logo + nav links */}
        <div className="flex items-center gap-6">
          <a href="/" className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.svg" alt="autodemo24.it" className="h-8" />
          </a>

        </div>

        {/* Right: auth area */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2">
            {session ? (
              <div className="relative">
                <button
                  onClick={() => setUserOpen((v) => !v)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-[#1a5f96] flex items-center justify-center">
                    <span className="text-sm font-medium text-white">{session.ragioneSociale.charAt(0)}</span>
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-[14px] font-normal text-gray-800 leading-tight max-w-[160px] truncate">{session.ragioneSociale}</p>
                    <p className="text-[11px] text-gray-400 leading-tight font-light">Sei loggato</p>
                  </div>
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
                        <p className="text-sm font-semibold text-[#333] truncate">{session.ragioneSociale}</p>
                        <p className="text-xs text-[#676767] truncate">{session.email}</p>
                      </div>
                      <a href="/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#333] hover:bg-[#f4f4f4]">
                        <svg className="w-4 h-4 text-[#676767]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Dashboard
                      </a>
                      <a href="/dashboard/veicoli" className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#333] hover:bg-[#f4f4f4]">
                        <svg className="w-4 h-4 text-[#676767]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM3 5h2l2 7h10l2-7H3z" />
                        </svg>
                        I miei veicoli
                      </a>
                      <a href="/dashboard/profilo" className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#333] hover:bg-[#f4f4f4]">
                        <svg className="w-4 h-4 text-[#676767]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                        </svg>
                        Profilo aziendale
                      </a>
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Esci
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <a href="/login" className="px-3 py-1.5 text-[15px] font-normal text-gray-600 hover:text-gray-900 transition-colors">Accedi</a>
                <a href="/registrati" className="px-5 py-2 bg-[#e8620a] text-white text-[15px] font-medium rounded-full hover:bg-[#d4580a] transition-colors">Vendi</a>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded text-gray-600 hover:bg-gray-100" aria-label="Menu">
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
      </div>

      {/* Back link bar */}
      {backTo && (
        <div className="border-t border-gray-100">
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
      {open && (
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
            <a href="/ricerca" className="px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">Cerca veicoli</a>
            {session ? (
              <>
                <a href="/dashboard" className="px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">Dashboard</a>
                <a href="/dashboard/veicoli" className="px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">I miei veicoli</a>
                <a href="/dashboard/profilo" className="px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">Profilo aziendale</a>
                <button onClick={handleLogout}
                  className="px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg text-left mt-1 border-t border-gray-100 pt-3">
                  Esci
                </button>
              </>
            ) : (
              <>
                <a href="/login" className="px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">Accedi</a>
                <a href="/registrati" className="mt-2 px-4 py-2.5 bg-[#e8620a] text-white rounded-lg text-sm font-semibold text-center hover:bg-[#d4580a] transition-colors">Vendi</a>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
