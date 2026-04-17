'use client';

import { useState } from 'react';

type Row = {
  id: number;
  marca: string;
  modello: string;
  demolitore: string;
  foto: string | null;
  createdAt: string;
};

export default function VeicoliTable({ rows: initial }: { rows: Row[] }) {
  const [rows, setRows] = useState(initial);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questo veicolo?')) return;
    setLoadingId(id);
    const res = await fetch(`/api/admin/veicoli/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setRows((prev) => prev.filter((r) => r.id !== id));
    }
    setLoadingId(null);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-6 py-3 font-semibold text-gray-600">Foto</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-600">Marca</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-600">Modello</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-600">Demolitore</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-600">Pubblicazione</th>
              <th className="text-right px-6 py-3 font-semibold text-gray-600">Azione</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((v) => (
              <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-6 py-3">
                  {v.foto ? (
                    <img
                      src={v.foto}
                      alt={`${v.marca} ${v.modello}`}
                      loading="lazy"
                      decoding="async"
                      className="w-16 h-12 object-cover rounded-lg border border-gray-200"
                    />
                  ) : (
                    <div className="w-16 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">{v.marca}</td>
                <td className="px-6 py-4 text-gray-500">{v.modello}</td>
                <td className="px-6 py-4 text-gray-500">{v.demolitore}</td>
                <td className="px-6 py-4 text-gray-500">
                  {new Date(v.createdAt).toLocaleDateString('it-IT')}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleDelete(v.id)}
                    disabled={loadingId === v.id}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    {loadingId === v.id ? '...' : 'Elimina'}
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                  Nessun veicolo pubblicato
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
