'use client';

import Link from 'next/link';
import { useState } from 'react';

type TabItem = { key: string; label: string; count: number };

interface Props {
  tabs: TabItem[];
  activeTab: string;
}

export default function RicambiTabs({ tabs, activeTab }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <div className="w-10 border-r border-gray-200 bg-white p-2 shrink-0">
        <button
          onClick={() => setCollapsed(false)}
          title="Mostra filtri"
          className="w-full h-8 flex items-center justify-center text-gray-500 hover:text-gray-900"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <aside className="hidden md:block w-56 border-r border-gray-200 bg-white shrink-0 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">Inserzioni</h2>
        <button
          onClick={() => setCollapsed(true)}
          title="Nascondi"
          className="text-gray-400 hover:text-gray-700 flex items-center gap-1 text-xs font-semibold"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Nascondi
        </button>
      </div>

      <nav className="space-y-1">
        {tabs.map((t) => {
          const isActive = t.key === activeTab;
          return (
            <Link
              key={t.key}
              href={`/dashboard/ricambi?tab=${t.key}`}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#003580] text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>{t.label}</span>
              <span className={`text-xs font-mono ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
                {t.count.toLocaleString('it-IT')}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 pt-6 border-t border-gray-100 space-y-1">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Strumenti</p>
        <Link href="/dashboard/scansiona" className="block px-3 py-1.5 rounded text-xs text-gray-600 hover:bg-gray-50 hover:text-[#003580]">
          Scansiona QR
        </Link>
        <Link href="/dashboard/ebay" className="block px-3 py-1.5 rounded text-xs text-gray-600 hover:bg-gray-50 hover:text-[#003580]">
          Configurazione eBay
        </Link>
        <Link href="/dashboard/spediamopro" className="block px-3 py-1.5 rounded text-xs text-gray-600 hover:bg-gray-50 hover:text-[#003580]">
          Configurazione SpediamoPro
        </Link>
      </div>
    </aside>
  );
}
