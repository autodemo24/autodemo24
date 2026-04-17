'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Navbar from './Navbar';
import DashboardSidebar from './DashboardSidebar';

interface Props {
  ragioneSociale: string;
  email: string;
  headerLeft: ReactNode;
  headerTitle: ReactNode;
  headerRight?: ReactNode;
  children: ReactNode;
}

const STORAGE_KEY = 'autodemo24.form.sidebar.collapsed';

export default function FormShell({ ragioneSociale, email, headerLeft, headerTitle, headerRight, children }: Props) {
  const [collapsed, setCollapsed] = useState<boolean>(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      setCollapsed(v === '1');
    } catch {}
    setHydrated(true);
  }, []);

  function toggle() {
    setCollapsed((c) => {
      const next = !c;
      try { localStorage.setItem(STORAGE_KEY, next ? '1' : '0'); } catch {}
      return next;
    });
  }

  const sidebarOn = hydrated && !collapsed;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="lg:hidden"><Navbar /></div>
      <div className="flex">
        {sidebarOn && (
          <DashboardSidebar ragioneSociale={ragioneSociale} email={email} />
        )}
        <main className={`flex-1 min-w-0 ${sidebarOn ? 'ml-0 lg:ml-60' : ''}`}>
          <div className="flex items-center justify-between gap-3 px-4 py-3 bg-white border-b border-gray-200">
            <div className="min-w-0">
              {headerLeft}
              {headerTitle}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={toggle}
                aria-label={sidebarOn ? 'Nascondi menu' : 'Mostra menu'}
                title={sidebarOn ? 'Nascondi menu' : 'Mostra menu'}
                className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50"
              >
                {sidebarOn ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Nascondi menu
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    Mostra menu
                  </>
                )}
              </button>
              {headerRight}
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
