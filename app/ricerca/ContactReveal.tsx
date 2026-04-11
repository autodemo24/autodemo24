'use client';

import { useState } from 'react';

interface Props {
  ragioneSociale: string;
  telefono: string;
  email: string;
}

export default function ContactReveal({ ragioneSociale, telefono, email }: Props) {
  const [aperto, setAperto] = useState(false);

  if (!aperto) {
    return (
      <button
        onClick={() => setAperto(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 text-sm transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
        Contatta il demolitore
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 space-y-2">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{ragioneSociale}</p>
      <a
        href={`tel:${telefono}`}
        className="flex items-center gap-2 text-sm font-medium text-gray-800 hover:text-red-600"
      >
        <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
        {telefono}
      </a>
      <a
        href={`mailto:${email}`}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 break-all"
      >
        <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        {email}
      </a>
      <button
        onClick={() => setAperto(false)}
        className="text-xs text-gray-400 hover:text-gray-600 pt-1"
      >
        Nascondi
      </button>
    </div>
  );
}
