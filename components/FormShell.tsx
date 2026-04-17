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
      if (v !== null) setCollapsed(v === '1');
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

  const isCollapsed = !hydrated || collapsed;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="lg:hidden"><Navbar /></div>
      <div className="flex">
        <DashboardSidebar ragioneSociale={ragioneSociale} email={email} collapsed={isCollapsed} />
        <main className={`flex-1 min-w-0 ml-0 ${isCollapsed ? 'lg:ml-14' : 'lg:ml-60'} transition-[margin] duration-200`}>
          <div className="flex items-center justify-between gap-3 px-4 py-3 bg-white border-b border-gray-200">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={toggle}
                aria-label={isCollapsed ? 'Apri menu' : 'Chiudi menu'}
                title={isCollapsed ? 'Apri menu' : 'Chiudi menu'}
                className="hidden lg:inline-flex items-center justify-center w-9 h-9 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 shrink-0"
              >
                {isCollapsed ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                )}
              </button>
              <div className="min-w-0">
                {headerLeft}
                {headerTitle}
              </div>
            </div>
            {headerRight && (
              <div className="flex items-center gap-2 shrink-0">
                {headerRight}
              </div>
            )}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
