'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
  _count: { ricambi: number };
}

export default function VeicoliCards({ veicoli }: { veicoli: VeicoloItem[] }) {
  const router = useRouter();
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteErrors, setDeleteErrors] = useState<Record<number, string>>({});

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    setDeleteErrors((prev) => ({ ...prev, [id]: '' }));
    try {
      const res = await fetch(`/api/veicoli/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
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
      <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
        <p className="text-gray-400">Nessun veicolo sorgente registrato.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Targa</th>
              <th className="text-left px-4 py-3 font-semibold">Auto</th>
              <th className="text-left px-4 py-3 font-semibold">Anno</th>
              <th className="text-left px-4 py-3 font-semibold">Km</th>
              <th className="text-left px-4 py-3 font-semibold">Ricambi</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {veicoli.map((v) => {
              const isConfirming = confirmDeleteId === v.id;
              const isDeleting = deletingId === v.id;
              const deleteError = deleteErrors[v.id];
              return (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs font-bold tracking-wider">{v.targa}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{v.marca} {v.modello}</p>
                    {v.versione && <p className="text-xs text-gray-500">{v.versione}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{v.anno}</td>
                  <td className="px-4 py-3 text-gray-700">{v.km.toLocaleString('it-IT')}</td>
                  <td className="px-4 py-3">
                    {v._count.ricambi > 0 ? (
                      <Link href={`/dashboard/ricambi?veicoloid=${v.id}`} className="text-[#003580] hover:underline text-xs font-semibold">
                        {v._count.ricambi} ricambi
                      </Link>
                    ) : (
                      <span className="text-gray-400 text-xs">0 ricambi</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {isConfirming ? (
                      <div className="flex gap-1.5 items-center justify-end">
                        {deleteError && <span className="text-xs text-red-600 mr-2">{deleteError}</span>}
                        <button onClick={() => handleDelete(v.id)} disabled={isDeleting}
                          className="px-2.5 py-1 bg-red-600 text-white text-xs font-semibold rounded disabled:opacity-60">
                          {isDeleting ? '…' : 'Conferma'}
                        </button>
                        <button onClick={() => setConfirmDeleteId(null)} disabled={isDeleting}
                          className="px-2.5 py-1 border border-gray-200 text-gray-700 text-xs font-semibold rounded">
                          Annulla
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-3 justify-end">
                        <Link href={`/dashboard/veicoli/${v.id}`} className="text-[#003580] hover:underline text-xs font-semibold">
                          Modifica
                        </Link>
                        <button onClick={() => setConfirmDeleteId(v.id)}
                          className="text-red-600 hover:underline text-xs font-semibold">
                          Elimina
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
