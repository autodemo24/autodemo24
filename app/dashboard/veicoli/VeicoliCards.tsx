'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import VeicoloEditModal from './VeicoloEditModal';

interface VeicoloItem {
  id: number;
  marca: string;
  modello: string;
  anno: number;
  targa: string;
  km: number;
  versione?: string | null;
  cilindrata?: string | null;
  siglaMotore?: string | null;
  carburante?: string | null;
  potenzaKw?: number | null;
  pubblicato?: boolean | null;
  foto: { id: number; url: string; copertina: boolean }[];
  ricambi: { id: number; nome: string; disponibile: boolean }[];
}

export default function VeicoliCards({ veicoli }: { veicoli: VeicoloItem[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteErrors, setDeleteErrors] = useState<Record<number, string>>({});

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    setDeleteErrors((prev) => ({ ...prev, [id]: '' }));
    try {
      const res = await fetch(`/api/veicoli/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        setDeleteErrors((prev) => ({ ...prev, [id]: data.error ?? 'Errore durante eliminazione' }));
        return;
      }
      setConfirmDeleteId(null);
      router.refresh();
    } catch {
      setDeleteErrors((prev) => ({ ...prev, [id]: 'Impossibile contattare il server.' }));
    } finally {
      setDeletingId(null);
    }
  };

  if (veicoli.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-xl shadow-sm">
        <svg className="w-16 h-16 text-gray-200 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM3 5h2l2 7h10l2-7H3z" />
        </svg>
        <p className="text-gray-400 text-lg">Nessun veicolo pubblicato</p>
      </div>
    );
  }

  const editingVeicolo = editingId !== null ? veicoli.find((v) => v.id === editingId) ?? null : null;

  return (
    <>
      {editingVeicolo && (
        <VeicoloEditModal
          veicolo={editingVeicolo}
          onClose={() => setEditingId(null)}
          onSaved={() => { setEditingId(null); router.refresh(); }}
        />
      )}

      <div className="space-y-3">
        {veicoli.map((veicolo) => {
          const fotoOrdinata = [...veicolo.foto].sort((a, b) => (b.copertina ? 1 : 0) - (a.copertina ? 1 : 0));
          const primaFoto = fotoOrdinata[0]?.url ?? null;
          const ricambiDisponibili = veicolo.ricambi.filter((r) => r.disponibile);
          const isConfirmingDelete = confirmDeleteId === veicolo.id;
          const isDeleting = deletingId === veicolo.id;
          const deleteError = deleteErrors[veicolo.id];

          return (
            <div key={veicolo.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row overflow-hidden">

              {/* Foto */}
              <div className="shrink-0 w-full sm:w-48 md:w-56 h-40 sm:h-auto relative">
                {primaFoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={primaFoto} alt={`${veicolo.marca} ${veicolo.modello}`}
                    className="w-full h-full object-cover sm:min-h-[140px]" />
                ) : (
                  <div className="w-full h-full sm:min-h-[140px] bg-gray-100 flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M4 16l4-4a2 2 0 012.83 0L14 15m2-2l1.17-1.17a2 2 0 012.83 0L22 14M14 8a2 2 0 11-4 0 2 2 0 014 0zM3 20h18a1 1 0 001-1V5a1 1 0 00-1-1H3a1 1 0 00-1 1v14a1 1 0 001 1z" />
                    </svg>
                  </div>
                )}
                {veicolo.foto.length > 0 && (
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 16l4-4a2 2 0 012.83 0L14 15m2-2l1.17-1.17a2 2 0 012.83 0L22 14M14 8a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {veicolo.foto.length}
                  </div>
                )}
              </div>

              {/* Contenuto */}
              <div className="flex-1 p-4 min-w-0 flex flex-col">
                {/* Riga titolo + badge */}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h2 className="text-base font-bold text-gray-900">
                    {veicolo.marca} {veicolo.modello}
                  </h2>
                  {veicolo.pubblicato !== false ? (
                    <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-100 text-green-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                      Pubblicato
                    </span>
                  ) : (
                    <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-orange-100 text-orange-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
                      Bozza
                    </span>
                  )}
                </div>

                {veicolo.versione && (
                  <p className="text-[13px] text-gray-500 mb-1">{veicolo.versione}</p>
                )}

                {/* Specs */}
                <div className="flex flex-wrap items-center gap-x-1.5 text-[13px] text-gray-500 mb-2">
                  <span className="font-mono font-semibold text-gray-700 tracking-wider">{veicolo.targa}</span>
                  <span className="text-gray-300">&middot;</span>
                  <span>{veicolo.anno}</span>
                  <span className="text-gray-300">&middot;</span>
                  <span>{veicolo.km.toLocaleString('it-IT')} km</span>
                  {veicolo.carburante && (
                    <>
                      <span className="text-gray-300">&middot;</span>
                      <span>{veicolo.carburante}</span>
                    </>
                  )}
                  {veicolo.potenzaKw != null && veicolo.potenzaKw > 0 && (
                    <>
                      <span className="text-gray-300">&middot;</span>
                      <span>{veicolo.potenzaKw} kW</span>
                    </>
                  )}
                </div>

                {/* Ricambi */}
                {ricambiDisponibili.length > 0 && (
                  <p className="text-[13px] text-gray-500 mb-3">
                    <span className="font-semibold text-[#1a5f96]">{ricambiDisponibili.length} ricambi</span>
                    {' — '}
                    {ricambiDisponibili.slice(0, 5).map((r) => r.nome).join(' · ')}
                    {ricambiDisponibili.length > 5 && ` · +${ricambiDisponibili.length - 5}`}
                  </p>
                )}

                {/* Azioni */}
                {deleteError && <p className="text-xs text-red-600 mb-2">{deleteError}</p>}

                {isConfirmingDelete ? (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3 space-y-2">
                    <p className="text-sm font-medium text-red-700">Eliminare questo veicolo?</p>
                    <p className="text-xs text-red-500">Le foto e i ricambi verranno eliminati.</p>
                    <div className="flex gap-2">
                      <button onClick={() => handleDelete(veicolo.id)} disabled={isDeleting}
                        className="flex-1 py-1.5 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-1">
                        {isDeleting ? 'Eliminazione…' : 'Sì, elimina'}
                      </button>
                      <button onClick={() => setConfirmDeleteId(null)} disabled={isDeleting}
                        className="flex-1 py-1.5 border border-gray-200 text-gray-600 rounded text-sm hover:bg-gray-50 disabled:opacity-60">
                        Annulla
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 mt-auto">
                    <button onClick={() => setEditingId(veicolo.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Modifica
                    </button>
                    <button onClick={() => { setConfirmDeleteId(veicolo.id); setDeleteErrors((p) => ({ ...p, [veicolo.id]: '' })); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Elimina
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
