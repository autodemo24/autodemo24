'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const CARRIERS = [
  { code: 'OTHER', label: 'Altro' },
  { code: 'POSTE_ITALIANE', label: 'Poste Italiane' },
  { code: 'SDA', label: 'SDA' },
  { code: 'BRT', label: 'BRT' },
  { code: 'GLS', label: 'GLS' },
  { code: 'DHL', label: 'DHL' },
  { code: 'UPS', label: 'UPS' },
  { code: 'FEDEX', label: 'FedEx' },
  { code: 'TNT', label: 'TNT' },
];

export default function ShipOrderForm({ ordineId }: { ordineId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState('');
  const [carrier, setCarrier] = useState('SDA');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!tracking.trim()) {
      setError('Inserisci il numero di tracking');
      return;
    }
    setLoading(true);
    try {
      const r = await fetch(`/api/ordini/${ordineId}/ship`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingNumber: tracking.trim(), shippingCarrier: carrier }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error ?? 'Errore durante l\'invio');
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      setError('Errore di rete');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Corriere</label>
          <select
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-[#003580]"
          >
            {CARRIERS.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Numero di tracking *</label>
          <input
            type="text"
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="Es. AB123456789IT"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#003580] font-mono"
            required
          />
        </div>
      </div>
      {error && <p className="text-xs text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2.5 bg-[#FF6600] hover:bg-[#d4580a] disabled:bg-gray-300 text-white rounded-lg text-sm font-semibold"
      >
        {loading ? 'Invio a eBay…' : 'Segna come spedito'}
      </button>
    </form>
  );
}
