'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { labelModello } from '../../../lib/modelli-auto';

type Row = {
  id: number;
  marca: string;
  modello: string;
  serie: string | null;
  annoInizio: number;
  annoFine: number | null;
  ricambiCount: number;
};

type FormState = {
  marca: string;
  modello: string;
  serie: string;
  annoInizio: string;
  annoFine: string;
};

const ANNO_OGGI = new Date().getFullYear();

const emptyForm: FormState = { marca: '', modello: '', serie: '', annoInizio: '', annoFine: '' };

export default function CatalogoTable({ rows: initial, marche: initialMarche }: { rows: Row[]; marche: string[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [filter, setFilter] = useState('');
  const [adding, setAdding] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const marche = useMemo(
    () => Array.from(new Set([...initialMarche, ...rows.map((r) => r.marca)])).sort(),
    [initialMarche, rows],
  );

  const filtered = useMemo(() => {
    if (!filter.trim()) return rows;
    const q = filter.trim().toLowerCase();
    return rows.filter((r) =>
      r.marca.toLowerCase().includes(q) ||
      r.modello.toLowerCase().includes(q) ||
      (r.serie ?? '').toLowerCase().includes(q),
    );
  }, [rows, filter]);

  function fromRow(r: Row): FormState {
    return {
      marca: r.marca,
      modello: r.modello,
      serie: r.serie ?? '',
      annoInizio: String(r.annoInizio),
      annoFine: r.annoFine ? String(r.annoFine) : '',
    };
  }

  function buildBody(s: FormState) {
    return {
      marca: s.marca.trim(),
      modello: s.modello.trim(),
      serie: s.serie.trim() || null,
      annoInizio: Number(s.annoInizio),
      annoFine: s.annoFine ? Number(s.annoFine) : null,
    };
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSubmitting(true);
    try {
      const r = await fetch('/api/admin/modelli-auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildBody(adding)),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        setError(err.error || 'Errore'); return;
      }
      const created = await r.json();
      setRows((prev) => [...prev, { ...created, ricambiCount: 0 }].sort(sortRows));
      setAdding({ ...emptyForm, marca: adding.marca });
      router.refresh();
    } catch {
      setError('Errore di rete');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditSave(id: number) {
    setError(null); setSubmitting(true);
    try {
      const r = await fetch(`/api/admin/modelli-auto/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildBody(editForm)),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        setError(err.error || 'Errore'); return;
      }
      const body = buildBody(editForm);
      setRows((prev) =>
        prev.map((row) => (row.id === id ? { ...row, ...body } : row)).sort(sortRows),
      );
      setEditingId(null);
      router.refresh();
    } catch {
      setError('Errore di rete');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    setError(null); setSubmitting(true);
    try {
      const r = await fetch(`/api/admin/modelli-auto/${id}`, { method: 'DELETE' });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        setError(err.error || 'Errore'); return;
      }
      setRows((prev) => prev.filter((row) => row.id !== id));
      setConfirmDeleteId(null);
      router.refresh();
    } catch {
      setError('Errore di rete');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Aggiungi modello</h2>
        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-6 gap-3">
          <input
            type="text"
            list="marche-list"
            value={adding.marca}
            onChange={(e) => setAdding({ ...adding, marca: e.target.value })}
            placeholder="Marca *"
            className="sm:col-span-2 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#003580]"
            required
          />
          <input
            type="text"
            value={adding.modello}
            onChange={(e) => setAdding({ ...adding, modello: e.target.value })}
            placeholder="Modello *"
            className="sm:col-span-2 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#003580]"
            required
          />
          <input
            type="text"
            value={adding.serie}
            onChange={(e) => setAdding({ ...adding, serie: e.target.value })}
            placeholder="Serie (es. 1° Serie)"
            className="sm:col-span-2 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#003580]"
          />
          <input
            type="number"
            min={1900}
            max={ANNO_OGGI + 1}
            value={adding.annoInizio}
            onChange={(e) => setAdding({ ...adding, annoInizio: e.target.value })}
            placeholder="Anno inizio *"
            className="sm:col-span-2 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#003580]"
            required
          />
          <input
            type="number"
            min={1900}
            max={ANNO_OGGI + 1}
            value={adding.annoFine}
            onChange={(e) => setAdding({ ...adding, annoFine: e.target.value })}
            placeholder="Anno fine (vuoto = oggi)"
            className="sm:col-span-2 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#003580]"
          />
          <button
            type="submit"
            disabled={submitting}
            className="sm:col-span-2 px-4 py-2 bg-[#FF6600] hover:bg-[#d4580a] disabled:bg-gray-300 text-white text-sm font-semibold rounded-lg"
          >
            {submitting ? 'Salvataggio…' : '+ Aggiungi'}
          </button>
        </form>
        <datalist id="marche-list">
          {marche.map((m) => <option key={m} value={m} />)}
        </datalist>
      </section>

      <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtra per marca, modello o serie…"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#003580]"
          />
          <span className="text-xs text-gray-500 shrink-0">
            {filtered.length} di {rows.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-600">
                <th className="text-left px-4 py-3 font-semibold">Marca</th>
                <th className="text-left px-4 py-3 font-semibold">Modello</th>
                <th className="text-left px-4 py-3 font-semibold">Serie</th>
                <th className="text-left px-4 py-3 font-semibold">Anno inizio</th>
                <th className="text-left px-4 py-3 font-semibold">Anno fine</th>
                <th className="text-left px-4 py-3 font-semibold">Etichetta</th>
                <th className="text-left px-4 py-3 font-semibold">Ricambi</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((r) => {
                const isEditing = editingId === r.id;
                const isConfirming = confirmDeleteId === r.id;
                if (isEditing) {
                  return (
                    <tr key={r.id} className="bg-yellow-50">
                      <td className="px-4 py-3"><input value={editForm.marca} onChange={(e) => setEditForm({ ...editForm, marca: e.target.value })} className="w-full px-2 py-1 text-sm border border-gray-300 rounded" /></td>
                      <td className="px-4 py-3"><input value={editForm.modello} onChange={(e) => setEditForm({ ...editForm, modello: e.target.value })} className="w-full px-2 py-1 text-sm border border-gray-300 rounded" /></td>
                      <td className="px-4 py-3"><input value={editForm.serie} onChange={(e) => setEditForm({ ...editForm, serie: e.target.value })} className="w-full px-2 py-1 text-sm border border-gray-300 rounded" /></td>
                      <td className="px-4 py-3"><input type="number" value={editForm.annoInizio} onChange={(e) => setEditForm({ ...editForm, annoInizio: e.target.value })} className="w-24 px-2 py-1 text-sm border border-gray-300 rounded" /></td>
                      <td className="px-4 py-3"><input type="number" value={editForm.annoFine} onChange={(e) => setEditForm({ ...editForm, annoFine: e.target.value })} placeholder="oggi" className="w-24 px-2 py-1 text-sm border border-gray-300 rounded" /></td>
                      <td className="px-4 py-3 text-xs text-gray-500">—</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{r.ricambiCount}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button onClick={() => handleEditSave(r.id)} disabled={submitting}
                          className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded mr-2 disabled:opacity-60">
                          Salva
                        </button>
                        <button onClick={() => setEditingId(null)} disabled={submitting}
                          className="px-2.5 py-1 border border-gray-200 text-gray-700 text-xs font-semibold rounded">
                          Annulla
                        </button>
                      </td>
                    </tr>
                  );
                }
                return (
                  <tr key={r.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900">{r.marca}</td>
                    <td className="px-4 py-3 text-gray-700">{r.modello}</td>
                    <td className="px-4 py-3 text-gray-700">{r.serie ?? <span className="text-gray-400">—</span>}</td>
                    <td className="px-4 py-3 text-gray-700">{r.annoInizio}</td>
                    <td className="px-4 py-3 text-gray-700">{r.annoFine ?? <span className="text-gray-400">in produzione</span>}</td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-600">{labelModello(r)}</td>
                    <td className="px-4 py-3 text-xs">
                      {r.ricambiCount > 0 ? (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-semibold">{r.ricambiCount}</span>
                      ) : <span className="text-gray-400">0</span>}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {isConfirming ? (
                        <>
                          <button onClick={() => handleDelete(r.id)} disabled={submitting}
                            className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded mr-2 disabled:opacity-60">
                            Conferma
                          </button>
                          <button onClick={() => setConfirmDeleteId(null)} disabled={submitting}
                            className="px-2.5 py-1 border border-gray-200 text-gray-700 text-xs font-semibold rounded">
                            Annulla
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditingId(r.id); setEditForm(fromRow(r)); }}
                            className="text-[#003580] hover:underline text-xs font-semibold mr-3">
                            Modifica
                          </button>
                          <button onClick={() => setConfirmDeleteId(r.id)}
                            className="text-red-600 hover:underline text-xs font-semibold">
                            Elimina
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                  {rows.length === 0 ? 'Nessun modello in catalogo. Inseriscine uno sopra.' : 'Nessun risultato per il filtro corrente.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function sortRows(a: Row, b: Row): number {
  if (a.marca !== b.marca) return a.marca.localeCompare(b.marca);
  if (a.modello !== b.modello) return a.modello.localeCompare(b.modello);
  return a.annoInizio - b.annoInizio;
}
