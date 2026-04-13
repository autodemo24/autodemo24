'use client';

import { useRef, useState } from 'react';

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
  onLookupSuccess: () => void;
  /** Se fornito, usa questa targa invece dell'input interno */
  targaValue?: string;
}

export default function RicercaTarga({ onResult, onClear, usate, max, onLookupSuccess, targaValue }: Props) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'found' | 'notfound' | 'apierror' | 'limit'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const lastQueried = useRef('');

  const limitReached = usate >= max && max !== Infinity;
  const hasExternalTarga = targaValue !== undefined;
  const activeTarga = hasExternalTarga ? targaValue : query;

  const doSearch = async () => {
    const targa = activeTarga.trim().toUpperCase();
    if (!/^[A-Z]{2}\d{3}[A-Z]{2}$/.test(targa)) {
      setErrorMsg('Inserisci una targa valida (es. AB123CD)');
      setStatus('apierror');
      return;
    }
    if (targa === lastQueried.current && status === 'found') return;

    setStatus('loading');
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
      if (data.counted) onLookupSuccess();
      onResult({ ...(data as Omit<TargaResult, 'targa'>), targa });
    } catch {
      setStatus('apierror');
      setErrorMsg('Impossibile contattare il server');
      onClear();
    }
  };

  const pct = max === Infinity ? 0 : Math.min(100, Math.round((usate / max) * 100));
  const barColor = pct >= 90 ? 'bg-red-500' : pct >= 60 ? 'bg-amber-400' : 'bg-green-500';

  // Modalita' bottone (targa esterna dal parent)
  if (hasExternalTarga) {
    return (
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={doSearch}
          disabled={limitReached || status === 'loading' || !activeTarga.trim()}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1a5f96] text-white rounded-lg text-sm font-medium hover:bg-[#164d7a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          {status === 'loading' ? (
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
          {status === 'loading' ? 'Ricerca...' : 'Cerca dati'}
        </button>
        <div className="text-xs text-gray-400 shrink-0">
          <span className={`font-semibold ${pct >= 90 ? 'text-red-600' : 'text-gray-600'}`}>
            {usate}/{max === Infinity ? '∞' : max}
          </span>
          {' '}ricerche
          {max !== Infinity && (
            <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden mt-0.5">
              <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
            </div>
          )}
        </div>
        {status === 'notfound' && (
          <span className="text-xs text-amber-600">Non trovato</span>
        )}
        {status === 'apierror' && (
          <span className="text-xs text-amber-600">{errorMsg}</span>
        )}
        {status === 'limit' && (
          <span className="text-xs text-red-600">Limite raggiunto</span>
        )}
      </div>
    );
  }

  // Modalita' completa (con input interno) — per backward compatibility
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-600">Ricerche targa questo mese</span>
            <span className={`text-xs font-bold ${pct >= 90 ? 'text-red-600' : 'text-gray-700'}`}>
              {usate} / {max === Infinity ? '∞' : max}
            </span>
          </div>
          {max !== Infinity && (
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
            </div>
          )}
        </div>
        {limitReached && (
          <span className="shrink-0 text-xs font-semibold text-gray-500">Limite raggiunto</span>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setStatus('idle'); }}
          maxLength={7}
          autoComplete="off"
          placeholder="AB123CD"
          disabled={limitReached}
          className={`flex-1 px-4 py-3 rounded-lg border ${
            limitReached
              ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
              : 'border-gray-200 focus:border-[#003580] focus:ring-[#003580]/20 focus:ring-2 text-gray-700'
          } uppercase tracking-widest`}
          style={{ textTransform: 'uppercase' }}
        />
        <button
          type="button"
          onClick={doSearch}
          disabled={limitReached || status === 'loading' || !query.trim()}
          className="px-4 py-3 bg-[#1a5f96] text-white rounded-lg text-sm font-medium hover:bg-[#164d7a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {status === 'loading' ? 'Ricerca...' : 'Cerca'}
        </button>
      </div>

      {status === 'found' && (
        <p className="text-xs text-green-600 font-medium">Veicolo trovato — campi compilati automaticamente</p>
      )}
      {status === 'notfound' && (
        <p className="text-xs text-amber-600">{errorMsg} — compila i campi manualmente</p>
      )}
      {status === 'apierror' && <p className="text-xs text-amber-600">{errorMsg}</p>}
      {status === 'limit' && <p className="text-xs text-red-600">{errorMsg}</p>}
      {limitReached && status === 'idle' && (
        <p className="text-xs text-red-600">Hai esaurito le ricerche targa del mese.</p>
      )}
    </div>
  );
}
