'use client';

import { useState } from 'react';

const PLACEHOLDERS = [
  { key: '{nome}', desc: 'Nome ricambio' },
  { key: '{marca}', desc: 'Marca veicolo' },
  { key: '{modello}', desc: 'Modello veicolo' },
  { key: '{anno}', desc: 'Anno veicolo' },
  { key: '{anniProduzione}', desc: 'Range anni serie (es. 2009 → 2015)' },
  { key: '{cilindrata}', desc: 'Cilindrata' },
  { key: '{alimentazione}', desc: 'Alimentazione (benzina/diesel/…)' },
  { key: '{kw}', desc: 'Potenza Kw' },
  { key: '{km}', desc: 'Chilometraggio' },
  { key: '{codiceMotore}', desc: 'Codice motore (P5)' },
  { key: '{codiceOe}', desc: 'Codice OE/OEM' },
  { key: '{mpn}', desc: 'Codice ricambio (MPN)' },
  { key: '{ean}', desc: 'Codice EAN' },
  { key: '{telaio}', desc: 'Numero di telaio' },
  { key: '{targa}', desc: 'Targa veicolo' },
  { key: '{condizione}', desc: 'Condizione ricambio' },
  { key: '{ragioneSociale}', desc: 'Nome della tua azienda' },
];

const DEFAULT_TEMPLATE = `{nome}

DESCRIZIONE PRODOTTO

- Codice OE: {codiceOe}
- Anni di produzione: {anniProduzione}
- Anno: {anno}
- Cilindrata: {cilindrata}
- Alimentazione: {alimentazione}
- Codice Motore: {codiceMotore}
- Condizione: Come da nostra foto
- Tipo ricambio: {condizione}
- Numero codice di riferimento: {mpn}

LA NOSTRA AZIENDA

Lavoriamo per i nostri clienti.

Per noi venditori professionali ricevere un feedback positivo è importante.
Lasciare un feedback negativo o neutro è inutile e non risolve eventuali problemi.
Se hai riscontrato problemi contattaci subito, risolveremo il tuo problema.

Siamo specializzati nella vendita di ricambi usati per auto, moto, scooter, pneumatici e gomme usate.

GUIDA ALL'ACQUISTO

Per aiutarti ad acquistare il prodotto giusto ti forniamo una breve guida.

Provenienza prodotto: tutti gli articoli sono provenienti da auto usate.

Codice prodotto: in presenza del codice ricambio nella nostra scheda prodotto, bisogna controllare sul suo prodotto se il codice corrisponde.

Codice motore: riportato sulla sua carta di circolazione alla voce P.5. Il riferimento al codice motore è vitale nei ricambi di meccanica ma non influisce nella carrozzeria e nell'interno veicolo.

Differenza Benzina o Diesel: la maggior parte dei ricambi di carrozzeria sono uguali a prescindere dalla motorizzazione di base.

Centraline: tutti i ricambi che fanno parte dell'elettronica dell'auto potrebbero aver bisogno di codifica (anche a pagamento) presso elettrauti.

Specchietti retrovisori: se hai individuato lo specchietto uguale al suo, di là dell'elettrica, sono controllabili sempre il Pin e poi che la sua componente, dall'interno dell'auto, sia uno specchio a sfera, orientabile o meno.

Pneumatici e gomme usate: direttamente sul suo pneumatico controllate questi parametri in sequenza. Es. 165/65 R15 dove 165 sta per larghezza battistrada, 65 l'altezza RFS, diametro e controlla sulla sua scelta di circolazione.

Se hai dubbi: attraverso eBay, può porci qualsiasi domanda sull'oggetto, ti risponderemo tempestivamente.

Forniga la sua domanda su questo oggetto.

{ragioneSociale}`;

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
          rows={20}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#003580]"
        />
        <div className="flex justify-between items-center mt-1">
          <span className="text-[11px] text-gray-500">{template.length} / 8000 caratteri</span>
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
