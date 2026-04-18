'use client';

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useState } from 'react';

type ListingItem = {
  itemID: string;
  title: string;
  price: number;
  currency: string;
  quantity: number;
  quantitySold: number;
  status: 'Active' | 'Ended' | 'Sold';
  thumbnailUrl: string | null;
  endTime: string | null;
  listingType: string | null;
  alreadyImported: boolean;
  ricambioId: number | null;
  ricambioCodice: string | null;
};

type ImportResult = {
  itemID: string;
  imported?: true;
  skipped?: true;
  failed?: true;
  ricambioId?: number;
  codice?: string;
  reason?: string;
};

type ListFilter = 'active' | 'sold' | 'all';
type Step = 'select' | 'running' | 'done';

const BATCH_SIZE = 10;

export default function ImportWizard({ ebayUserId, environment }: { ebayUserId: string; environment: string }) {
  const [filter, setFilter] = useState<ListFilter>('all');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<ListingItem[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<Step>('select');
  const [results, setResults] = useState<ImportResult[]>([]);
  const [progressMsg, setProgressMsg] = useState<string>('');

  const loadListings = useCallback(async (nextFilter: ListFilter, nextPage: number) => {
    setLoading(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams({ listType: nextFilter, page: String(nextPage), perPage: '50' });
      const res = await fetch(`/api/ebay/import/listings?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        setLoadError(data?.error ?? 'Errore nel caricamento');
        setItems([]);
      } else {
        setItems(data.items ?? []);
        setTotalPages(data.totalPages ?? 0);
        setTotalItems(data.totalItems ?? 0);
      }
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Errore di rete');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadListings(filter, page);
  }, [filter, page, loadListings]);

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllVisible() {
    const next = new Set(selected);
    for (const it of items) {
      if (!it.alreadyImported) next.add(it.itemID);
    }
    setSelected(next);
  }

  function deselectAll() {
    setSelected(new Set());
  }

  function selectOnlyActive() {
    const next = new Set<string>();
    for (const it of items) {
      if (!it.alreadyImported && it.status === 'Active') next.add(it.itemID);
    }
    setSelected(next);
  }

  async function startImport() {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    setStep('running');
    setResults([]);

    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += BATCH_SIZE) chunks.push(ids.slice(i, i + BATCH_SIZE));

    let processed = 0;
    const accumulated: ImportResult[] = [];

    for (let chunkIdx = 0; chunkIdx < chunks.length; chunkIdx++) {
      const chunk = chunks[chunkIdx];
      setProgressMsg(`Elaborando batch ${chunkIdx + 1}/${chunks.length} — ${processed}/${ids.length} completati`);
      try {
        const res = await fetch('/api/ebay/import/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemIDs: chunk }),
        });
        const data = await res.json();
        const chunkResults: ImportResult[] = Array.isArray(data?.results) ? data.results : [];
        for (const r of chunkResults) {
          accumulated.push(r);
          processed += 1;
        }
        setResults([...accumulated]);
      } catch (e) {
        for (const id of chunk) {
          accumulated.push({ itemID: id, failed: true, reason: e instanceof Error ? e.message : 'Errore di rete' });
          processed += 1;
        }
        setResults([...accumulated]);
      }
    }

    setProgressMsg('Import completato');
    setStep('done');
  }

  function restart() {
    setStep('select');
    setSelected(new Set());
    setResults([]);
    void loadListings(filter, page);
  }

  if (step === 'running') {
    const total = selected.size;
    const done = results.length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Import in corso…</h2>
        <p className="text-sm text-gray-600 mt-1">{progressMsg}</p>

        <div className="mt-6 h-3 w-full rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full bg-[#0073E6] transition-all" style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-2 text-xs text-gray-500">{done} / {total} ({percent}%)</p>

        <div className="mt-6 max-h-96 overflow-y-auto space-y-1 text-sm">
          {results.map((r) => (
            <ResultRow key={r.itemID} result={r} />
          ))}
        </div>
      </div>
    );
  }

  if (step === 'done') {
    const imported = results.filter((r) => r.imported).length;
    const skipped = results.filter((r) => r.skipped).length;
    const failed = results.filter((r) => r.failed).length;

    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Import completato</h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SummaryCard label="Importati" value={imported} color="green" />
            <SummaryCard label="Saltati" value={skipped} color="amber" />
            <SummaryCard label="Falliti" value={failed} color="red" />
          </div>

          <div className="mt-6 flex gap-3">
            <a
              href="/dashboard/ricambi"
              className="px-4 h-10 inline-flex items-center rounded-lg bg-[#0073E6] hover:bg-[#005bb8] text-white text-sm font-semibold"
            >
              Vai ai ricambi importati
            </a>
            <button
              type="button"
              onClick={restart}
              className="px-4 h-10 inline-flex items-center rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-800 hover:bg-gray-50"
            >
              Importa altri
            </button>
          </div>
        </div>

        {failed > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <h3 className="text-sm font-bold text-red-900 mb-3">Dettaglio falliti</h3>
            <ul className="space-y-1 text-sm text-red-800">
              {results.filter((r) => r.failed).map((r) => (
                <li key={r.itemID} className="flex gap-2">
                  <span className="font-mono text-xs text-red-600 shrink-0">{r.itemID}</span>
                  <span className="truncate">{r.reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {skipped > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
            <h3 className="text-sm font-bold text-amber-900 mb-3">Saltati (già importati)</h3>
            <ul className="space-y-1 text-sm text-amber-800">
              {results.filter((r) => r.skipped).map((r) => (
                <li key={r.itemID} className="flex gap-2">
                  <span className="font-mono text-xs text-amber-600 shrink-0">{r.itemID}</span>
                  <span className="truncate">{r.reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // step === 'select'
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 flex flex-wrap items-center gap-4">
        <div className="text-sm text-gray-700">
          Account eBay: <span className="font-semibold">{ebayUserId}</span>
          <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{environment}</span>
        </div>
        <div className="flex gap-2 ml-auto">
          <FilterPill active={filter === 'all'} onClick={() => { setFilter('all'); setPage(1); }}>Tutte</FilterPill>
          <FilterPill active={filter === 'active'} onClick={() => { setFilter('active'); setPage(1); }}>Attive</FilterPill>
          <FilterPill active={filter === 'sold'} onClick={() => { setFilter('sold'); setPage(1); }}>Vendute/Concluse</FilterPill>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-200 bg-gray-50 text-sm">
          <span className="font-semibold text-gray-900">{selected.size} selezionati</span>
          <span className="text-gray-400">•</span>
          <span className="text-gray-600">{totalItems} trovati</span>
          <div className="ml-auto flex gap-2">
            <button type="button" onClick={selectAllVisible} className="text-xs text-[#0073E6] hover:underline">Seleziona tutti visibili</button>
            <button type="button" onClick={selectOnlyActive} className="text-xs text-[#0073E6] hover:underline">Solo attive</button>
            <button type="button" onClick={deselectAll} className="text-xs text-gray-500 hover:underline">Deseleziona tutti</button>
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-gray-500">Caricamento…</div>
        ) : loadError ? (
          <div className="p-6 text-sm text-red-700 bg-red-50">{loadError}</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">Nessuna inserzione trovata.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-2 w-10"></th>
                <th className="px-4 py-2 w-16">Foto</th>
                <th className="px-4 py-2">Titolo</th>
                <th className="px-4 py-2 w-24">Prezzo</th>
                <th className="px-4 py-2 w-16">Qty</th>
                <th className="px-4 py-2 w-24">Stato</th>
                <th className="px-4 py-2 w-36">Item ID</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => {
                const disabled = it.alreadyImported;
                const checked = selected.has(it.itemID);
                return (
                  <tr key={it.itemID} className={`border-t border-gray-100 ${disabled ? 'bg-gray-50 opacity-70' : 'hover:bg-gray-50'}`}>
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => !disabled && toggleOne(it.itemID)}
                        className="w-4 h-4 accent-[#0073E6]"
                      />
                    </td>
                    <td className="px-4 py-2">
                      {it.thumbnailUrl ? (
                        <img src={it.thumbnailUrl} alt="" className="w-12 h-12 object-cover rounded-md border border-gray-200" />
                      ) : (
                        <div className="w-12 h-12 rounded-md bg-gray-100" />
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <span className="text-gray-900 line-clamp-2">{it.title}</span>
                      {disabled && (
                        <div className="text-[11px] text-green-700 mt-0.5">
                          Già importato come {it.ricambioCodice}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 text-gray-900 font-semibold">
                      {it.price.toFixed(2)} {it.currency}
                    </td>
                    <td className="px-4 py-2 text-gray-700">{it.quantity || 1}</td>
                    <td className="px-4 py-2">
                      <StatusBadge status={it.status} />
                    </td>
                    <td className="px-4 py-2 font-mono text-[11px] text-gray-500">{it.itemID}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 text-sm">
            <span className="text-gray-600">Pagina {page} di {totalPages}</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 h-8 rounded border border-gray-300 bg-white text-gray-700 disabled:opacity-50 hover:bg-gray-50"
              >
                ← Prec
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 h-8 rounded border border-gray-300 bg-white text-gray-700 disabled:opacity-50 hover:bg-gray-50"
              >
                Succ →
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="sticky bottom-4 flex justify-end">
        <button
          type="button"
          onClick={startImport}
          disabled={selected.size === 0}
          className="px-6 h-12 rounded-xl bg-[#0073E6] hover:bg-[#005bb8] disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-bold shadow-lg"
        >
          Importa {selected.size > 0 ? `${selected.size} ricambi` : 'selezionati'}
        </button>
      </div>
    </div>
  );
}

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 h-8 rounded-full text-xs font-semibold transition-colors ${
        active ? 'bg-[#0073E6] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: ListingItem['status'] }) {
  const config = {
    Active: { label: 'Attiva', cls: 'bg-green-100 text-green-800' },
    Sold: { label: 'Venduta', cls: 'bg-blue-100 text-blue-800' },
    Ended: { label: 'Conclusa', cls: 'bg-gray-100 text-gray-700' },
  }[status];
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${config.cls}`}>{config.label}</span>;
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: 'green' | 'amber' | 'red' }) {
  const ring = color === 'green' ? 'border-green-200 bg-green-50' : color === 'amber' ? 'border-amber-200 bg-amber-50' : 'border-red-200 bg-red-50';
  const text = color === 'green' ? 'text-green-900' : color === 'amber' ? 'text-amber-900' : 'text-red-900';
  return (
    <div className={`rounded-lg border p-4 ${ring}`}>
      <p className={`text-xs font-semibold uppercase tracking-wide ${text}`}>{label}</p>
      <p className={`text-2xl font-bold mt-1 ${text}`}>{value}</p>
    </div>
  );
}

function ResultRow({ result }: { result: ImportResult }) {
  if (result.imported) {
    return (
      <div className="flex items-center gap-2 text-green-700">
        <span>✅</span>
        <span className="font-mono text-xs text-gray-500">{result.itemID}</span>
        <span>→ {result.codice}</span>
      </div>
    );
  }
  if (result.skipped) {
    return (
      <div className="flex items-center gap-2 text-amber-700">
        <span>⚠️</span>
        <span className="font-mono text-xs text-gray-500">{result.itemID}</span>
        <span className="truncate">{result.reason}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 text-red-700">
      <span>❌</span>
      <span className="font-mono text-xs text-gray-500">{result.itemID}</span>
      <span className="truncate">{result.reason}</span>
    </div>
  );
}
