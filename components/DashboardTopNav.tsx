'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Props {
  ragioneSociale: string;
  email: string;
  ordiniDaSpedireInitial?: number;
}

export default function DashboardTopNav({ ragioneSociale, email, ordiniDaSpedireInitial = 0 }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [ordiniDaSpedire, setOrdiniDaSpedire] = useState(ordiniDaSpedireInitial);
  const [canaliOpen, setCanaliOpen] = useState(false);
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
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      {/* Riga superiore — logo, profilo, esci */}
      <div className="flex items-center justify-between px-4 sm:px-8 h-14 border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-1">
          <span className="text-lg font-bold text-gray-900">auto</span>
          <span className="text-lg font-bold text-[#FF6600]">demo24</span>
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
      <nav className="px-4 sm:px-8 flex gap-6 overflow-x-auto">
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
        <div className="relative">
          <button
            type="button"
            onClick={() => setCanaliOpen((v) => !v)}
            className={`h-12 px-1 text-sm font-medium flex items-center gap-1 border-b-2 transition-colors ${
              canaliActive
                ? 'text-[#003580] border-[#003580]'
                : 'text-gray-700 border-transparent hover:text-[#003580]'
            }`}
          >
            Canali di vendita
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {canaliOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setCanaliOpen(false)} />
              <div className="absolute left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                <Link
                  href="/dashboard/ebay"
                  onClick={() => setCanaliOpen(false)}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Configurazione eBay
                </Link>
                <Link
                  href="/dashboard/spediamopro"
                  onClick={() => setCanaliOpen(false)}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  SpediamoPro
                </Link>
              </div>
            </>
          )}
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
      className={`h-12 px-1 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
        active ? 'text-[#003580] border-[#003580]' : 'text-gray-700 border-transparent hover:text-[#003580]'
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
