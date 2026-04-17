'use client';

import { useState } from 'react';

const PLACEHOLDERS = [
  { key: '{nome}', desc: 'Nome ricambio' },
  { key: '{marca}', desc: 'Marca veicolo' },
  { key: '{modello}', desc: 'Modello veicolo' },
  { key: '{anno}', desc: 'Anno' },
  { key: '{codiceOe}', desc: 'Codice OE/OEM' },
  { key: '{mpn}', desc: 'Codice ricambio (MPN)' },
  { key: '{targa}', desc: 'Targa veicolo' },
  { key: '{condizione}', desc: 'Condizione' },
  { key: '{ragioneSociale}', desc: 'Nome della tua azienda' },
];

const DEFAULT_TEMPLATE = `{nome} usato per {marca} {modello} {anno}.

Codice OE: {codiceOe}
Codice ricambio: {mpn}
Condizione: {condizione}

Ricambio originale testato, garantito da {ragioneSociale}.
Spedizione 24/48h tracciata.`;

interface Props {
  initial: string | null;
}

export default function DescrizioneTemplatePanel({ initial }: Props) {
  const [template, setTemplate] = useState(initial ?? '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  async function salva() {
    setSaving(true); setMsg(null);
    try {
      const r = await fetch('/api/profilo/descrizione-template', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: template.trim() || null }),
      });
      if (!r.ok) {
        const { error } = await r.json().catch(() => ({ error: 'Errore' }));
        setMsg({ type: 'err', text: error ?? 'Errore' });
      } else {
        setMsg({ type: 'ok', text: 'Template salvato' });
      }
    } catch {
      setMsg({ type: 'err', text: 'Errore di rete' });
    } finally {
      setSaving(false);
    }
  }

  function inserisci(k: string) {
    setTemplate((t) => t + (t && !t.endsWith(' ') && !t.endsWith('\n') ? ' ' : '') + k);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
      <div>
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Template descrizione annuncio</h2>
        <p className="text-sm text-gray-600 mt-1">
          La descrizione viene generata automaticamente per ogni ricambio pubblicato. Usa i segnaposto qui sotto per
          inserire i dati del ricambio specifico.
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Segnaposto disponibili</p>
        <div className="flex flex-wrap gap-1.5">
          {PLACEHOLDERS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => inserisci(p.key)}
              title={p.desc}
              className="px-2 py-1 border border-gray-300 rounded text-xs font-mono hover:bg-gray-50 hover:border-[#003580]"
            >
              {p.key}
            </button>
          ))}
        </div>
      </div>

      <div>
        <textarea
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          placeholder={DEFAULT_TEMPLATE}
          rows={12}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#003580]"
        />
        <div className="flex justify-between items-center mt-1">
          <span className="text-[11px] text-gray-500">{template.length} / 4000 caratteri</span>
          {!template.trim() && (
            <button
              type="button"
              onClick={() => setTemplate(DEFAULT_TEMPLATE)}
              className="text-[11px] text-[#003580] hover:underline"
            >
              Inserisci template di esempio
            </button>
          )}
        </div>
      </div>

      {msg && (
        <div className={`text-sm px-3 py-2 rounded ${msg.type === 'ok' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {msg.text}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={salva}
          disabled={saving}
          className="px-5 py-2 bg-[#003580] text-white rounded-lg text-sm font-semibold hover:bg-[#002a66] disabled:opacity-50"
        >
          {saving ? 'Salvataggio…' : 'Salva template'}
        </button>
      </div>
    </div>
  );
}
