'use client';

import { useState } from 'react';

type Row = {
  id: number;
  ragioneSociale: string;
  email: string;
  provincia: string;
  piano: string;
  pianoLabel: string;
  attivo: boolean;
  createdAt: string;
};

export default function DemolitoriTable({ rows: initial }: { rows: Row[] }) {
  const [rows, setRows] = useState(initial);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const toggleAttivo = async (id: number, attivo: boolean) => {
    setLoadingId(id);
    const res = await fetch(`/api/admin/demolitori/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attivo }),
    });
    if (res.ok) {
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, attivo } : r)));
    }
    setLoadingId(null);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-6 py-3 font-semibold text-gray-600">Nome</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-600">Email</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-600">Provincia</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-600">Piano</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-600">Registrazione</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-600">Stato</th>
              <th className="text-right px-6 py-3 font-semibold text-gray-600">Azione</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-6 py-4 font-medium text-gray-900">{d.ragioneSociale}</td>
                <td className="px-6 py-4 text-gray-500">{d.email}</td>
                <td className="px-6 py-4 text-gray-500">{d.provincia}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    d.piano === 'FREE'
                      ? 'bg-gray-100 text-gray-600'
                      : d.piano === 'START'
                        ? 'bg-blue-50 text-blue-700'
                        : d.piano === 'PRO'
                          ? 'bg-orange-50 text-[#FF6600]'
                          : 'bg-purple-50 text-purple-700'
                  }`}>
                    {d.pianoLabel}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500">
                  {new Date(d.createdAt).toLocaleDateString('it-IT')}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    d.attivo ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                  }`}>
                    {d.attivo ? 'Attivo' : 'Disattivato'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => toggleAttivo(d.id, !d.attivo)}
                    disabled={loadingId === d.id}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
                      d.attivo
                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    {loadingId === d.id ? '...' : d.attivo ? 'Disattiva' : 'Riattiva'}
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                  Nessun demolitore registrato
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
