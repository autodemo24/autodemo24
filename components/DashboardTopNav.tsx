'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Logo from './Logo';

interface Props {
  ragioneSociale: string;
  email: string;
  ordiniDaSpedireInitial?: number;
}

export default function DashboardTopNav({ ragioneSociale, email, ordiniDaSpedireInitial = 0 }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [ordiniDaSpedire, setOrdiniDaSpedire] = useState(ordiniDaSpedireInitial);
  const [userOpen, setUserOpen] = useState(false);

  useEffect(() => {
    fetch('/api/ordini/count-pending')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && typeof data.count === 'number') setOrdiniDaSpedire(data.count);
      })
      .catch(() => {});
  }, [pathname]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/');
  const canaliActive = isActive('/dashboard/ebay') || isActive('/dashboard/spediamopro');

  return (
    <header className="bg-white">
      {/* Riga superiore — logo, profilo, esci */}
      <div className="flex items-center justify-between px-6 sm:px-10 h-16">
        <Link href="/dashboard" className="flex items-center">
          <Logo className="h-7" />
        </Link>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-500 leading-tight">Console venditori</p>
            <p className="text-sm font-semibold text-gray-900 leading-tight">{ragioneSociale}</p>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setUserOpen((v) => !v)}
              className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-700"
              aria-label="Menu utente"
            >
              {ragioneSociale.charAt(0).toUpperCase()}
            </button>
            {userOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs text-gray-500">{email}</p>
                  </div>
                  <Link
                    href="/dashboard/profilo"
                    onClick={() => setUserOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Profilo aziendale
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Esci
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Riga inferiore — tabs navigazione */}
      <nav className="px-6 sm:px-10 flex gap-10 flex-wrap">
        <TabLink href="/dashboard" active={isActive('/dashboard', true)}>
          Panoramica
        </TabLink>
        <TabLink href="/dashboard/ricambi" active={isActive('/dashboard/ricambi')}>
          Ricambi
        </TabLink>
        <TabLink href="/dashboard/ordini" active={isActive('/dashboard/ordini')} badge={ordiniDaSpedire}>
          Ordini
        </TabLink>
        <TabLink href="/dashboard/veicoli" active={isActive('/dashboard/veicoli')}>
          Veicoli
        </TabLink>
        <TabLink href="/dashboard/scansiona" active={isActive('/dashboard/scansiona')}>
          Scansiona QR
        </TabLink>

        {/* Canali di vendita con hover dropdown */}
        <div className="relative group">
          <div
            className={`h-14 px-0 text-lg flex items-center gap-1.5 border-b-[3px] cursor-pointer whitespace-nowrap transition-colors font-medium ${
              canaliActive
                ? 'text-gray-900 border-gray-900 font-semibold'
                : 'text-gray-800 border-transparent hover:text-gray-900 group-hover:border-gray-300'
            }`}
          >
            Canali di vendita
            <svg
              className="w-3.5 h-3.5 transition-transform group-hover:rotate-180"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <div className="absolute top-full left-0 pt-1 hidden group-hover:block z-50">
            <div className="w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
              <Link
                href="/dashboard/ebay"
                className="block px-4 py-2 text-base text-gray-700 hover:bg-gray-50"
              >
                Configurazione eBay
              </Link>
              <Link
                href="/dashboard/spediamopro"
                className="block px-4 py-2 text-base text-gray-700 hover:bg-gray-50"
              >
                SpediamoPro
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}

function TabLink({
  href,
  active,
  badge,
  children,
}: {
  href: string;
  active: boolean;
  badge?: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`h-14 px-0 text-lg flex items-center gap-2 border-b-[3px] transition-colors whitespace-nowrap font-medium ${
        active
          ? 'text-gray-900 border-gray-900 font-semibold'
          : 'text-gray-800 border-transparent hover:text-gray-900 hover:border-gray-300'
      }`}
    >
      {children}
      {badge && badge > 0 ? (
        <span className="bg-[#FF6600] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
          {badge > 99 ? '99+' : badge}
        </span>
      ) : null}
    </Link>
  );
}
