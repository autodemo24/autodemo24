'use client';

import { useEffect, useState } from 'react';
import Combobox from './Combobox';
import { MARCHE as MARCHE_LEGACY, getModelli as getModelliLegacy } from '../lib/veicoli-db';

export type CompatibilitaItem = {
  id?: number;
  marca: string;
  modello: string;
  annoInizio: number;
  annoFine: number | null;
  versione?: string | null;
};

interface Props {
  value: CompatibilitaItem[];
  onChange: (items: CompatibilitaItem[]) => void;
}

const CURRENT_YEAR = new Date().getFullYear();

export default function CompatibilitaEditor({ value, onChange }: Props) {
  const [marche, setMarche] = useState<string[]>([]);
  const [draft, setDraft] = useState<CompatibilitaItem | null>(null);

  useEffect(() => {
    fetch('/api/marche').then((r) => r.ok ? r.json() : []).then(setMarche).catch(() => {});
  }, []);

  const marcheCombinate = Array.from(new Set([...marche, ...MARCHE_LEGACY])).sort();

  function startAdd() {
    setDraft({ marca: '', modello: '', annoInizio: CURRENT_YEAR - 10, annoFine: null, versione: '' });
  }

  function cancelDraft() {
    setDraft(null);
  }

  function confirmDraft() {
    if (!draft) return;
    if (!draft.marca.trim() || !draft.modello.trim() || !draft.annoInizio) return;
    onChange([...value, { ...draft, marca: draft.marca.trim(), modello: draft.modello.trim() }]);
    setDraft(null);
  }

  function removeAt(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  function labelItem(c: CompatibilitaItem) {
    const anni = c.annoFine ? `${c.annoInizio}-${c.annoFine}` : `${c.annoInizio}→`;
    const base = `${c.marca} ${c.modello}${c.versione ? ` ${c.versione}` : ''}`;
    return `${base} (${anni})`;
  }

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <ul className="space-y-2">
          {value.map((c, idx) => (
            <li key={idx} className="flex items-center justify-between gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <span className="text-sm text-gray-800">{labelItem(c)}</span>
              <button
                type="button"
                onClick={() => removeAt(idx)}
                className="text-red-600 hover:text-red-700 text-xs font-semibold"
                aria-label="Rimuovi"
              >
                Rimuovi
              </button>
            </li>
          ))}
        </ul>
      )}

      {draft ? (
        <div className="p-4 bg-white border border-[#003580] rounded-lg space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Marca *</label>
              <Combobox
                options={marcheCombinate.map((m) => ({ id: m, label: m }))}
                value={draft.marca}
                onSelect={(opt) => setDraft({ ...draft, marca: opt?.label ?? '', modello: '' })}
                onFreeText={(t) => setDraft({ ...draft, marca: t, modello: '' })}
                placeholder="Marca…"
                searchPlaceholder="Cerca marca"
                allowFreeText
                uppercase
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Modello *</label>
              <Combobox
                options={(draft.marca ? getModelliLegacy(draft.marca) : []).map((m) => ({ id: m, label: m }))}
                value={draft.modello}
                onSelect={(opt) => setDraft({ ...draft, modello: opt?.label ?? '' })}
                onFreeText={(t) => setDraft({ ...draft, modello: t })}
                placeholder="Modello…"
                searchPlaceholder="Cerca modello"
                allowFreeText
                disabled={!draft.marca}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Anno inizio *</label>
              <input
                type="number"
                min={1950}
                max={CURRENT_YEAR + 1}
                value={draft.annoInizio || ''}
                onChange={(e) => setDraft({ ...draft, annoInizio: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#003580]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Anno fine</label>
              <input
                type="number"
                min={1950}
                max={CURRENT_YEAR + 1}
                value={draft.annoFine ?? ''}
                onChange={(e) => setDraft({ ...draft, annoFine: e.target.value ? Number(e.target.value) : null })}
                placeholder="(vuoto = ancora in produzione)"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#003580]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Versione/motorizzazione (opzionale)</label>
              <input
                type="text"
                value={draft.versione ?? ''}
                onChange={(e) => setDraft({ ...draft, versione: e.target.value })}
                placeholder="Es. 1.6 JTDm"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#003580]"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={cancelDraft}
              className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={confirmDraft}
              disabled={!draft.marca.trim() || !draft.modello.trim() || !draft.annoInizio}
              className="px-3 py-1.5 text-sm text-white bg-[#003580] rounded hover:bg-[#002b6b] disabled:bg-gray-300"
            >
              Aggiungi
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={startAdd}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#003580] border border-dashed border-[#003580] rounded-lg hover:bg-[#003580]/5"
        >
          <span className="text-lg leading-none">+</span> Aggiungi veicolo compatibile
        </button>
      )}
    </div>
  );
}
