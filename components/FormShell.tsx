'use client';

import { useState, type ReactNode } from 'react';
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

export default function FormShell({ ragioneSociale, email, headerLeft, headerTitle, headerRight, children }: Props) {
  const [collapsed, setCollapsed] = useState<boolean>(true);

  function toggle() {
    setCollapsed((c) => !c);
  }

  const isCollapsed = collapsed;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="lg:hidden"><Navbar /></div>
      <div className="flex">
        <DashboardSidebar ragioneSociale={ragioneSociale} email={email} collapsed={isCollapsed} onToggle={toggle} />
        <main className={`flex-1 min-w-0 ml-0 ${isCollapsed ? 'lg:ml-14' : 'lg:ml-60'} transition-[margin] duration-200`}>
          <div className="flex items-center justify-between gap-3 px-4 py-3 bg-white border-b border-gray-200">
            <div className="min-w-0">
              {headerLeft}
              {headerTitle}
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
