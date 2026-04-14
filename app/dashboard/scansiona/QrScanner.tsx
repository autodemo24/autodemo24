'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type Html5QrcodeScannerCtor = new (
  elementId: string,
  config: { fps: number; qrbox: { width: number; height: number }; rememberLastUsedCamera?: boolean },
  verbose?: boolean,
) => {
  render: (onSuccess: (decoded: string) => void, onError?: (err: string) => void) => void;
  clear: () => Promise<void>;
};

export default function QrScanner() {
  const router = useRouter();
  const [manuale, setManuale] = useState('');
  const [stato, setStato] = useState<'idle' | 'scanning' | 'lookup' | 'notfound'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const scannerRef = useRef<{ clear: () => Promise<void> } | null>(null);
  const stoppedRef = useRef(false);

  async function lookup(raw: string, source: 'qr' | 'codice') {
    setStato('lookup');
    setMessage(null);
    try {
      const body = source === 'qr' ? { payload: raw } : { codice: raw };
      const r = await fetch('/api/ricambi/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        setStato('notfound');
        setMessage(err.error || 'Ricambio non trovato');
        return;
      }
      const { id } = await r.json();
      if (scannerRef.current) {
        stoppedRef.current = true;
        await scannerRef.current.clear().catch(() => {});
      }
      router.push(`/dashboard/ricambi/${id}`);
    } catch {
      setStato('notfound');
      setMessage('Errore di rete');
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const mod = await import('html5-qrcode');
      if (cancelled) return;
      const Ctor = mod.Html5QrcodeScanner as unknown as Html5QrcodeScannerCtor;
      const scanner = new Ctor(
        'qr-reader',
        { fps: 10, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true },
      );
      scannerRef.current = scanner;
      setStato('scanning');
      scanner.render(
        (decoded) => {
          if (stoppedRef.current) return;
          stoppedRef.current = true;
          lookup(decoded, 'qr');
        },
        () => { /* ignore per-frame errors */ },
      );
    })();

    return () => {
      cancelled = true;
      if (scannerRef.current) scannerRef.current.clear().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmitCodice(e: React.FormEvent) {
    e.preventDefault();
    if (!manuale.trim()) return;
    await lookup(manuale.trim().toUpperCase(), 'codice');
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Fotocamera</h2>
        <div id="qr-reader" className="rounded-lg overflow-hidden" />
        {stato === 'lookup' && (
          <p className="text-sm text-gray-600 mt-3">Lettura QR… apertura del ricambio in corso.</p>
        )}
        {stato === 'notfound' && message && (
          <div className="mt-3 bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded text-sm">
            {message}
            <button
              className="ml-3 underline"
              onClick={() => { stoppedRef.current = false; setStato('scanning'); setMessage(null); }}
            >
              Riprova
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Oppure inserisci il codice manualmente</h2>
        <form onSubmit={onSubmitCodice} className="flex gap-2">
          <input
            type="text"
            value={manuale}
            onChange={(e) => setManuale(e.target.value.toUpperCase())}
            placeholder="Es. RC-000042"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg font-mono focus:outline-none focus:border-[#003580]"
          />
          <button type="submit" className="px-5 py-2 bg-[#003580] hover:bg-[#002560] text-white rounded-lg text-sm font-semibold">
            Cerca
          </button>
        </form>
      </div>
    </div>
  );
}
