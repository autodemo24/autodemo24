'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DownloadLabelButton({ ordineId }: { ordineId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    try {
      const r = await fetch(`/api/ordini/${ordineId}/download-label`, { method: 'POST' });
      const data = await r.json();
      if (!r.ok) {
        alert('Errore download etichetta: ' + (data.error ?? 'sconosciuto'));
        return;
      }
      if (data.labelUrl) {
        window.open(data.labelUrl, '_blank');
      }
      router.refresh();
    } catch {
      alert('Errore di rete');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="inline-block mt-3 px-4 py-2 bg-white border border-yellow-400 text-yellow-800 hover:bg-yellow-50 rounded-lg text-sm font-semibold disabled:opacity-50"
    >
      {loading ? 'Scarico…' : '⬇ Scarica etichetta ora'}
    </button>
  );
}
