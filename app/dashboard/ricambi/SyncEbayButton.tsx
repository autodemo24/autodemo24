'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SyncEbayButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    try {
      const r = await fetch('/api/ebay/sync-listings', { method: 'POST' });
      const data = await r.json();
      if (!r.ok) {
        alert(`Errore sync: ${data.error ?? 'sconosciuto'}`);
        return;
      }
      const s = data.summary;
      if (s.total === 0) {
        alert('Nessun annuncio eBay attivo da sincronizzare.');
      } else {
        alert(
          `Sincronizzati ${s.total} annunci.\n` +
            `Aggiornati: ${s.updated}\n` +
            `Marcati VENDUTO: ${s.venduti}\n` +
            (s.errors > 0 ? `Errori: ${s.errors}` : ''),
        );
      }
      router.refresh();
    } catch {
      alert('Errore di rete durante la sincronizzazione');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 hover:border-[#003580] text-gray-700 hover:text-[#003580] rounded-lg text-sm font-semibold transition-colors disabled:opacity-60"
    >
      <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      {loading ? 'Sincronizzo…' : 'Sincronizza eBay'}
    </button>
  );
}
