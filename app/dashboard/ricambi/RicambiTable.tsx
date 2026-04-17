'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export type RicambioRow = {
  id: number;
  codice: string;
  titolo: string | null;
  nome: string;
  marca: string;
  modello: string;
  anno: number | null;
  ubicazione: string;
  prezzo: string;
  stato: string;
  quantita: number;
  createdAt: string;
  coverUrl: string | null;
  ebayStatus: string | null;
  ebayListingId: string | null;
};

interface Props {
  ricambi: RicambioRow[];
}

function fmtPrice(v: string): string {
  const n = Number(v);
  return isNaN(n) ? '—' : `${n.toFixed(2).replace('.', ',')} €`;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StatoBadge({ stato }: { stato: string }) {
  const map: Record<string, string> = {
    DISPONIBILE: 'bg-green-100 text-green-800',
    RISERVATO: 'bg-yellow-100 text-yellow-800',
    VENDUTO: 'bg-gray-200 text-gray-700',
    RITIRATO: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${map[stato] ?? 'bg-gray-100 text-gray-600'}`}>
      {stato.toLowerCase()}
    </span>
  );
}

function EbayBadge({ status, listingId }: { status: string | null; listingId: string | null }) {
  if (!status) return <span className="text-[11px] text-gray-400">—</span>;
  if (status === 'PUBLISHED' && listingId) {
    return (
      <a
        href={`https://www.ebay.it/itm/${listingId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-green-100 text-green-800 hover:bg-green-200"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
        Live
      </a>
    );
  }
  if (status === 'FAILED') {
    return (
      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-red-100 text-red-800">Errore</span>
    );
  }
  return <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-600">{status.toLowerCase()}</span>;
}

export default function RicambiTable({ ricambi }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [actionsLoading, setActionsLoading] = useState(false);

  const allSelected = ricambi.length > 0 && ricambi.every((r) => selected.has(r.id));
  const someSelected = selected.size > 0;

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(ricambi.map((r) => r.id)));
  }

  function toggleRow(id: number) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  async function bulkAction(azione: 'ritira' | 'elimina') {
    if (selected.size === 0) return;
    const nomeAzione = azione === 'ritira' ? 'ritirare (stato RITIRATO)' : 'eliminare definitivamente';
    if (!confirm(`Confermi di voler ${nomeAzione} ${selected.size} ricambi selezionati?`)) return;
    setActionsLoading(true);
    const ids = Array.from(selected);
    try {
      if (azione === 'elimina') {
        for (const id of ids) {
          await fetch(`/api/ricambi/${id}`, { method: 'DELETE' });
        }
      } else {
        for (const id of ids) {
          await fetch(`/api/ricambi/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stato: 'RITIRATO' }),
          });
        }
      }
      setSelected(new Set());
      router.refresh();
    } catch {
      alert('Errore nell\'esecuzione dell\'azione');
    } finally {
      setActionsLoading(false);
    }
  }

  if (ricambi.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center">
        <p className="text-gray-500">Nessun ricambio trovato con i filtri correnti.</p>
        <Link href="/dashboard/ricambi/nuovo"
          className="inline-block mt-4 px-5 py-2.5 bg-[#003580] hover:bg-[#002560] text-white rounded-lg text-sm font-semibold">
          Inserisci il primo ricambio
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <button
          type="button"
          disabled={!someSelected || actionsLoading}
          onClick={() => { if (selected.size === 1) router.push(`/dashboard/ricambi/${Array.from(selected)[0]}`); }}
          className="px-4 py-2 border border-gray-300 rounded-full text-sm font-semibold text-gray-700 hover:border-[#003580] hover:text-[#003580] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Modifica
        </button>
        <button
          type="button"
          disabled={selected.size !== 1 || actionsLoading}
          onClick={() => { router.push('/dashboard/ricambi/nuovo'); }}
          className="px-4 py-2 border border-gray-300 rounded-full text-sm font-semibold text-gray-700 hover:border-[#003580] hover:text-[#003580] disabled:opacity-40 disabled:cursor-not-allowed"
          title="Crea un ricambio simile (form pre-compilato)"
        >
          Vendi un oggetto simile
        </button>
        <div className="relative">
          <details className="group">
            <summary className={`list-none px-4 py-2 border border-gray-300 rounded-full text-sm font-semibold cursor-pointer select-none flex items-center gap-1 ${someSelected ? 'text-gray-700 hover:border-[#003580] hover:text-[#003580]' : 'text-gray-400 cursor-not-allowed pointer-events-none opacity-40'}`}>
              Azioni
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[180px]">
              <button
                type="button"
                onClick={() => bulkAction('ritira')}
                className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 text-gray-700"
              >
                Ritira dal magazzino
              </button>
              <button
                type="button"
                onClick={() => bulkAction('elimina')}
                className="w-full px-4 py-2 text-sm text-left hover:bg-red-50 text-red-700"
              >
                Elimina definitivamente
              </button>
            </div>
          </details>
        </div>
        {someSelected && (
          <span className="ml-auto text-xs text-gray-600">
            {selected.size} selezionat{selected.size === 1 ? 'o' : 'i'}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-3 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="w-4 h-4 accent-[#003580]"
                  />
                </th>
                <th className="text-left px-3 py-3 font-semibold w-28">Azioni</th>
                <th className="text-left px-3 py-3 font-semibold">Oggetto</th>
                <th className="text-left px-3 py-3 font-semibold">Ubicazione</th>
                <th className="text-right px-3 py-3 font-semibold">Prezzo attuale</th>
                <th className="text-left px-3 py-3 font-semibold">Data di inizio</th>
                <th className="text-left px-3 py-3 font-semibold">eBay</th>
                <th className="text-left px-3 py-3 font-semibold">Stato</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ricambi.map((r) => {
                const isChecked = selected.has(r.id);
                return (
                  <tr key={r.id} className={`hover:bg-blue-50/30 ${isChecked ? 'bg-blue-50/50' : ''}`}>
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleRow(r.id)}
                        className="w-4 h-4 accent-[#003580]"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/dashboard/ricambi/${r.id}`}
                          className="px-3 py-1.5 border border-gray-300 rounded-full text-xs font-semibold text-gray-700 hover:border-[#003580] hover:text-[#003580]"
                        >
                          Modifica
                        </Link>
                        <details className="relative">
                          <summary className="list-none w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer text-gray-500">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <circle cx="5" cy="12" r="2" />
                              <circle cx="12" cy="12" r="2" />
                              <circle cx="19" cy="12" r="2" />
                            </svg>
                          </summary>
                          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[160px]">
                            <Link href={`/dashboard/ricambi/${r.id}/qr`} className="block px-3 py-2 text-xs text-gray-700 hover:bg-gray-50">Stampa QR</Link>
                            <Link href={`/dashboard/ricambi/${r.id}`} className="block px-3 py-2 text-xs text-gray-700 hover:bg-gray-50">Dettagli</Link>
                            {r.ebayListingId && (
                              <a
                                href={`https://www.ebay.it/itm/${r.ebayListingId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                              >
                                Vedi su eBay →
                              </a>
                            )}
                          </div>
                        </details>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <Link href={`/dashboard/ricambi/${r.id}`} className="flex items-center gap-3 group">
                        {r.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.coverUrl} alt="" className="w-12 h-12 object-cover rounded shrink-0" />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs shrink-0">—</div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-[#003580] group-hover:underline text-sm truncate max-w-md">
                            {r.titolo || r.nome}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-gray-700">{r.ubicazione}</td>
                    <td className="px-3 py-3 text-right">
                      <p className="font-bold text-gray-900">{fmtPrice(r.prezzo)}</p>
                      <p className="text-[10px] text-gray-500">Compralo Subito</p>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-700">{fmtDate(r.createdAt)}</td>
                    <td className="px-3 py-3"><EbayBadge status={r.ebayStatus} listingId={r.ebayListingId} /></td>
                    <td className="px-3 py-3"><StatoBadge stato={r.stato} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
