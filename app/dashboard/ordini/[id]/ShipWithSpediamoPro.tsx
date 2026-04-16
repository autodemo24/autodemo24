'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Quotation = {
  quotationId: string;
  carrier: string;
  carrierService?: string;
  price: { total: number; currency?: string };
  transitDays?: number;
  pickupDate?: string;
};

type Step = 'dimensioni' | 'preventivi' | 'conferma' | 'completato';

export default function ShipWithSpediamoPro({ ordineId }: { ordineId: number }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('dimensioni');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: dimensioni (default sensato per un ricambio auto)
  const [pesoKg, setPesoKg] = useState('2');
  const [pesoG, setPesoG] = useState('0');
  const [lunghezzaCm, setLunghezzaCm] = useState('30');
  const [larghezzaCm, setLarghezzaCm] = useState('20');
  const [altezzaCm, setAltezzaCm] = useState('15');

  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);

  const pesoGrammi = (Number(pesoKg) || 0) * 1000 + (Number(pesoG) || 0);
  const lunghezzaMm = (Number(lunghezzaCm) || 0) * 10;
  const larghezzaMm = (Number(larghezzaCm) || 0) * 10;
  const altezzaMm = (Number(altezzaCm) || 0) * 10;

  async function caricaPreventivi() {
    setError(null);
    if (!pesoGrammi || !lunghezzaMm || !larghezzaMm || !altezzaMm) {
      setError('Compila tutti i campi peso/dimensioni');
      return;
    }
    setLoading(true);
    try {
      const r = await fetch(`/api/ordini/${ordineId}/quotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pesoGrammi, lunghezzaMm, larghezzaMm, altezzaMm }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error ?? 'Errore preventivi');
        return;
      }
      if (!data.quotations || data.quotations.length === 0) {
        setError('Nessun preventivo disponibile per queste dimensioni');
        return;
      }
      setQuotations(data.quotations);
      setStep('preventivi');
    } catch {
      setError('Errore di rete');
    } finally {
      setLoading(false);
    }
  }

  async function confermaSpedizione() {
    if (!selectedQuotation) return;
    setError(null);
    setLoading(true);
    try {
      const r = await fetch(`/api/ordini/${ordineId}/create-shipment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quotationId: selectedQuotation.quotationId,
          pesoGrammi,
          lunghezzaMm,
          larghezzaMm,
          altezzaMm,
          cost: selectedQuotation.price.total,
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error ?? 'Errore creazione spedizione');
        setLoading(false);
        return;
      }
      setStep('completato');
      router.refresh();
    } catch {
      setError('Errore di rete');
      setLoading(false);
    }
  }

  function fmtPrice(total: number, currency?: string): string {
    // L'API SpediamoPro restituisce prezzi in centesimi — convertiamo in euro
    const euro = total / 100;
    return `€ ${euro.toFixed(2)}${currency && currency !== 'EUR' ? ` ${currency}` : ''}`;
  }

  if (step === 'completato') {
    return (
      <div className="text-sm text-green-800">
        ✓ Spedizione creata con successo. La pagina si aggiornerà per mostrare l'etichetta.
      </div>
    );
  }

  if (step === 'dimensioni') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-yellow-900 font-semibold">Inserisci peso e dimensioni del pacco</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Peso</label>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="number"
                  value={pesoKg}
                  onChange={(e) => setPesoKg(e.target.value)}
                  min={0}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#003580]"
                />
                <p className="text-[10px] text-gray-500 mt-0.5">kg</p>
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  value={pesoG}
                  onChange={(e) => setPesoG(e.target.value)}
                  min={0}
                  max={999}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#003580]"
                />
                <p className="text-[10px] text-gray-500 mt-0.5">g</p>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Dimensioni (cm)</label>
            <div className="flex items-center gap-1">
              <input type="number" value={lunghezzaCm} onChange={(e) => setLunghezzaCm(e.target.value)} min={0} placeholder="L" className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#003580]" />
              <span className="text-gray-400">×</span>
              <input type="number" value={larghezzaCm} onChange={(e) => setLarghezzaCm(e.target.value)} min={0} placeholder="W" className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#003580]" />
              <span className="text-gray-400">×</span>
              <input type="number" value={altezzaCm} onChange={(e) => setAltezzaCm(e.target.value)} min={0} placeholder="H" className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#003580]" />
            </div>
          </div>
        </div>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button
          type="button"
          onClick={caricaPreventivi}
          disabled={loading}
          className="px-5 py-2.5 bg-[#003580] hover:bg-[#002560] disabled:bg-gray-300 text-white rounded-lg text-sm font-semibold"
        >
          {loading ? 'Cerco preventivi…' : 'Vedi preventivi SpediamoPro →'}
        </button>
      </div>
    );
  }

  if (step === 'preventivi') {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-yellow-900 font-semibold">{quotations.length} preventivi disponibili</p>
          <button type="button" onClick={() => setStep('dimensioni')} className="text-xs text-gray-600 hover:underline">← cambia dimensioni</button>
        </div>

        <div className="space-y-2">
          {quotations.map((q) => {
            const selected = selectedQuotation?.quotationId === q.quotationId;
            return (
              <button
                key={q.quotationId}
                type="button"
                onClick={() => { setSelectedQuotation(q); setStep('conferma'); }}
                className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                  selected
                    ? 'border-[#003580] bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-[#003580] hover:bg-blue-50'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{q.carrier}{q.carrierService ? ` — ${q.carrierService}` : ''}</p>
                    {q.transitDays !== undefined && (
                      <p className="text-xs text-gray-600">Consegna in ~{q.transitDays} giorni lavorativi</p>
                    )}
                  </div>
                  <p className="text-lg font-bold text-gray-900">{fmtPrice(q.price.total, q.price.currency)}</p>
                </div>
              </button>
            );
          })}
        </div>
        {error && <p className="text-sm text-red-700">{error}</p>}
      </div>
    );
  }

  if (step === 'conferma' && selectedQuotation) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-yellow-900 font-semibold">Conferma spedizione</p>
        <div className="p-3 bg-white rounded-lg border border-yellow-300">
          <p className="text-sm"><strong>Corriere:</strong> {selectedQuotation.carrier}{selectedQuotation.carrierService ? ` — ${selectedQuotation.carrierService}` : ''}</p>
          <p className="text-sm"><strong>Costo:</strong> {fmtPrice(selectedQuotation.price.total, selectedQuotation.price.currency)}</p>
          <p className="text-sm"><strong>Pacco:</strong> {pesoGrammi / 1000} kg, {lunghezzaCm}×{larghezzaCm}×{altezzaCm} cm</p>
        </div>
        <p className="text-xs text-gray-600">
          Confermando: SpediamoPro crea la spedizione, scarichi l'etichetta PDF, eBay viene notificato automaticamente con tracking.
        </p>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setStep('preventivi')}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50"
          >
            ← Cambia preventivo
          </button>
          <button
            type="button"
            onClick={confermaSpedizione}
            disabled={loading}
            className="px-5 py-2.5 bg-[#FF6600] hover:bg-[#d4580a] disabled:bg-gray-300 text-white rounded-lg text-sm font-semibold"
          >
            {loading ? 'Creazione…' : 'Conferma e crea spedizione'}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
