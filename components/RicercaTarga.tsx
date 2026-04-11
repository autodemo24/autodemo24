'use client';

import { useEffect, useRef, useState } from 'react';

export interface TargaResult {
  marca: string;
  modello: string;
  anno: number;
  cilindrata: string;
  siglaMotore: string;
}

interface Props {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResult: (result: TargaResult) => void;
  onClear: () => void;
  error?: string;
}

export default function RicercaTarga({ value, onChange, onResult, onClear, error }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'found' | 'notfound' | 'apierror'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastQueried = useRef('');

  useEffect(() => {
    const targa = value.trim().toUpperCase();

    if (!/^[A-Z]{2}\d{3}[A-Z]{2}$/.test(targa)) {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (status !== 'idle') {
        setStatus('idle');
        onClear();
      }
      return;
    }

    if (targa === lastQueried.current) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    setStatus('loading');

    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/targa?targa=${encodeURIComponent(targa)}`);
        const data = await res.json();

        if (!res.ok) {
          lastQueried.current = targa;
          setStatus(res.status === 404 ? 'notfound' : 'apierror');
          setErrorMsg(data.error ?? 'Errore sconosciuto');
          onClear();
          return;
        }

        lastQueried.current = targa;
        setStatus('found');
        onResult(data as TargaResult);
      } catch {
        setStatus('apierror');
        setErrorMsg('Impossibile contattare il server');
        onClear();
      }
    }, 600);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Targa *
        <span className="ml-1.5 text-xs font-normal text-gray-400">ricerca automatica</span>
      </label>
      <div className="relative">
        <input
          type="text"
          name="targa"
          value={value}
          onChange={onChange}
          maxLength={7}
          autoComplete="off"
          placeholder="AB123CD"
          className={`w-full px-4 py-3 rounded-lg border ${
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
              : 'border-gray-200 focus:border-red-500 focus:ring-red-200'
          } focus:ring-2 text-gray-700 uppercase tracking-widest pr-10`}
          style={{ textTransform: 'uppercase' }}
        />

        {/* Spinner */}
        {status === 'loading' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="animate-spin w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        )}

        {/* Found check */}
        {status === 'found' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <span className="inline-flex items-center justify-center w-5 h-5 bg-green-500 rounded-full">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </span>
          </div>
        )}

        {/* Not found / error */}
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

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {status === 'found' && !error && (
        <p className="mt-1 text-xs text-green-600">Veicolo trovato — campi compilati automaticamente</p>
      )}
      {(status === 'notfound' || status === 'apierror') && (
        <p className="mt-1 text-xs text-amber-600">{errorMsg} — compila i campi manualmente</p>
      )}
    </div>
  );
}
