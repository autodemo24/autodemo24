'use client';

import { useEffect, useRef, useState } from 'react';

export interface TargaResult {
  targa: string;
  marca: string;
  modello: string;
  versione: string;
  anno: number;
  cilindrata: string;
  siglaMotore: string;
  carburante: string;
  potenzaKw: number;
}

interface Props {
  onResult: (result: TargaResult) => void;
  onClear: () => void;
  usate: number;
  max: number;
  onLookupSuccess: () => void; // incrementa il contatore nel parent
}

export default function RicercaTarga({ onResult, onClear, usate, max, onLookupSuccess }: Props) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'found' | 'notfound' | 'apierror' | 'limit'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastQueried = useRef('');

  const limitReached = usate >= max && max !== Infinity;

  useEffect(() => {
    const targa = query.trim().toUpperCase();

    if (!/^[A-Z]{2}\d{3}[A-Z]{2}$/.test(targa)) {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (status !== 'idle') { setStatus('idle'); onClear(); }
      return;
    }

    if (targa === lastQueried.current) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    setStatus('loading');

    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/targa?targa=${encodeURIComponent(targa)}`);
        const data = await res.json();
        lastQueried.current = targa;

        if (!res.ok) {
          if (res.status === 429 && data.limitReached) {
            setStatus('limit');
            setErrorMsg(data.error ?? 'Limite raggiunto');
          } else {
            setStatus(res.status === 404 ? 'notfound' : 'apierror');
            setErrorMsg(data.error ?? 'Errore sconosciuto');
          }
          onClear();
          return;
        }

        setStatus('found');
        onLookupSuccess();
        onResult({ ...(data as Omit<TargaResult, 'targa'>), targa });
      } catch {
        setStatus('apierror');
        setErrorMsg('Impossibile contattare il server');
        onClear();
      }
    }, 600);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const pct = max === Infinity ? 0 : Math.min(100, Math.round((usate / max) * 100));
  const barColor = pct >= 90 ? 'bg-red-500' : pct >= 60 ? 'bg-amber-400' : 'bg-green-500';

  return (
    <div className="space-y-4">
      {/* Contatore mensile */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-600">
              Ricerche targa questo mese
            </span>
            <span className={`text-xs font-bold ${pct >= 90 ? 'text-red-600' : 'text-gray-700'}`}>
              {usate} / {max === Infinity ? '∞' : max}
            </span>
          </div>
          {max !== Infinity && (
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${barColor}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
        </div>
        {limitReached && (
          <a
            href="/abbonamento"
            className="shrink-0 text-xs font-semibold text-red-600 hover:text-red-700 underline"
          >
            Aggiorna piano →
          </a>
        )}
      </div>

      {/* Campo di ricerca */}
      <div>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            maxLength={7}
            autoComplete="off"
            placeholder="AB123CD"
            disabled={limitReached}
            className={`w-full px-4 py-3 rounded-lg border ${
              limitReached
                ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                : 'border-gray-200 focus:border-red-500 focus:ring-red-200 focus:ring-2 text-gray-700'
            } uppercase tracking-widest pr-10`}
            style={{ textTransform: 'uppercase' }}
          />

          {status === 'loading' && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="animate-spin w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
          )}
          {status === 'found' && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <span className="inline-flex items-center justify-center w-5 h-5 bg-green-500 rounded-full">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </span>
            </div>
          )}
          {(status === 'notfound' || status === 'apierror') && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <span className="inline-flex items-center justify-center w-5 h-5 bg-amber-400 rounded-full">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01" />
                </svg>
              </span>
            </div>
          )}
        </div>

        {status === 'found' && (
          <p className="mt-1.5 text-xs text-green-600 font-medium">
            Veicolo trovato — campi compilati automaticamente
          </p>
        )}
        {status === 'notfound' && (
          <p className="mt-1.5 text-xs text-amber-600">{errorMsg} — compila i campi manualmente</p>
        )}
        {status === 'apierror' && (
          <p className="mt-1.5 text-xs text-amber-600">{errorMsg}</p>
        )}
        {status === 'limit' && (
          <p className="mt-1.5 text-xs text-red-600">{errorMsg}</p>
        )}
        {limitReached && status === 'idle' && (
          <p className="mt-1.5 text-xs text-red-600">
            Hai esaurito le ricerche targa del mese.{' '}
            <a href="/abbonamento" className="underline font-medium">Aggiorna il piano</a> per continuare.
          </p>
        )}
      </div>
    </div>
  );
}
