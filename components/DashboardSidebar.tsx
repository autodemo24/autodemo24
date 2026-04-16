'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const NAV = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/dashboard/ricambi',
    label: 'Ricambi',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    href: '/dashboard/scansiona',
    label: 'Scansiona QR',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M4 4h4v4H4zM16 4h4v4h-4zM4 16h4v4H4zM16 16h4v4h-4zM10 4v4M14 4v4M4 10h4M4 14h4M10 10h10M14 14h6" />
      </svg>
    ),
  },
  {
    href: '/dashboard/veicoli',
    label: 'Veicoli sorgente',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM3 5h2l2 7h10l2-7H3z" />
      </svg>
    ),
  },
  {
    href: '/dashboard/profilo',
    label: 'Profilo aziendale',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
];

const CANALI_VENDITA = [
  {
    href: '/dashboard/ordini',
    label: 'Ordini eBay',
    badgeKey: 'ordiniDaSpedire',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    href: '/dashboard/ebay',
    label: 'Configurazione eBay',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 3h18v18H3zM3 9h18M9 21V9" />
      </svg>
    ),
  },
  {
    href: '/dashboard/spediamopro',
    label: 'SpediamoPro',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M16 3h5v5M21 3l-7 7M8 21H3v-5M3 21l7-7" />
      </svg>
    ),
  },
];

interface Props {
  ragioneSociale: string;
  email: string;
  ordiniDaSpedire?: number;
}

export default function DashboardSidebar({ ragioneSociale, email, ordiniDaSpedire: ordiniDaSpedireInitial = 0 }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [ordiniDaSpedire, setOrdiniDaSpedire] = useState(ordiniDaSpedireInitial);

  useEffect(() => {
    fetch('/api/ordini/count-pending')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data && typeof data.count === 'number') setOrdiniDaSpedire(data.count);
      })
      .catch(() => {});
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-60 bg-[#003580] flex flex-col z-50 transition-transform duration-200 ${
        open ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <a href="/" className="flex items-center gap-1">
            <span className="text-xl font-bold text-white">auto</span>
            <span className="text-xl font-bold text-[#FF6600]">demo24</span>
          </a>
        </div>

        {/* User info */}
        <div className="px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <span className="text-white text-sm font-bold">
                {ragioneSociale.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">{ragioneSociale}</p>
              <p className="text-white/50 text-xs truncate">{email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map(({ href, label, icon }) => {
            const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <a
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                {icon}
                {label}
              </a>
            );
          })}

          <div className="pt-4 pb-2 px-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Canali di vendita</p>
          </div>
          {CANALI_VENDITA.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href);
            const badge = 'badgeKey' in item && item.badgeKey === 'ordiniDaSpedire' ? ordiniDaSpedire : 0;
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
                {badge > 0 && (
                  <span className="bg-[#FF6600] text-white text-[11px] font-bold px-1.5 py-0.5 rounded">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </a>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Esci
          </button>
        </div>
      </aside>
    </>
  );
}
