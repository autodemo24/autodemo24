'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MARCHE as MARCHE_LEGACY, getModelli as getModelliLegacy } from '../../../lib/veicoli-db';
import { labelModello, annoMedio, type ModelloAutoLite } from '../../../lib/modelli-auto';
import { getModelsByMakeYear } from '../../../lib/carquery';
import Combobox from '../../../components/Combobox';

interface Props {
  mode: 'create' | 'edit';
  veicoloId?: number;
  initial?: {
    marca: string;
    modello: string;
    versione: string | null;
    anno: number;
    targa: string;
    km: number;
    cilindrata: string | null;
    siglaMotore: string | null;
    carburante: string | null;
    potenzaKw: number | null;
  };
}

export default function VeicoloForm({ mode, veicoloId, initial }: Props) {
  const router = useRouter();

  const [marca, setMarca] = useState(initial?.marca ?? '');
  const [modello, setModello] = useState(initial?.modello ?? '');
  const [versione, setVersione] = useState(initial?.versione ?? '');
  const [anno, setAnno] = useState(initial?.anno ? String(initial.anno) : '');
  const [targa, setTarga] = useState(initial?.targa ?? '');
  const [km, setKm] = useState(initial?.km ? String(initial.km) : '');
  const [cilindrata, setCilindrata] = useState(initial?.cilindrata ?? '');
  const [siglaMotore, setSiglaMotore] = useState(initial?.siglaMotore ?? '');
  const [carburante, setCarburante] = useState(initial?.carburante ?? '');
  const [potenzaKw, setPotenzaKw] = useState(initial?.potenzaKw ? String(initial.potenzaKw) : '');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [marcheCatalogo, setMarcheCatalogo] = useState<string[]>([]);
  const [modelliCatalogo, setModelliCatalogo] = useState<ModelloAutoLite[]>([]);
  const [annoLocked, setAnnoLocked] = useState(false);

  const [carqueryModels, setCarqueryModels] = useState<string[]>([]);
  const [carqueryLoading, setCarqueryLoading] = useState(false);
  const [carqueryError, setCarqueryError] = useState<string | null>(null);

  const modelliLegacy = useMemo(() => (marca ? getModelliLegacy(marca) : []), [marca]);

  const marcheCombinate = useMemo(
    () => Array.from(new Set([...marcheCatalogo, ...MARCHE_LEGACY])).sort(),
    [marcheCatalogo],
  );

  useEffect(() => {
    const annoNum = anno ? Number(anno) : null;
    const qs = annoNum && Number.isInteger(annoNum) ? `?anno=${annoNum}` : '';
    fetch(`/api/marche${qs}`).then((r) => r.ok ? r.json() : []).then(setMarcheCatalogo).catch(() => {});
  }, [anno]);

  useEffect(() => {
    if (!marca) { setModelliCatalogo([]); return; }
    const annoNum = anno ? Number(anno) : null;
    const qs = annoNum && Number.isInteger(annoNum) ? `&anno=${annoNum}` : '';
    fetch(`/api/modelli?marca=${encodeURIComponent(marca)}${qs}`)
      .then((r) => r.ok ? r.json() : [])
      .then(setModelliCatalogo)
      .catch(() => setModelliCatalogo([]));
  }, [marca, anno]);

  async function cercaSuggerimentiCarQuery() {
    setCarqueryError(null);
    const annoNum = anno ? Number(anno) : null;
    if (!marca.trim() || !annoNum || !Number.isInteger(annoNum)) {
      setCarqueryError('Inserisci marca e anno per cercare suggerimenti');
      return;
    }
    setCarqueryLoading(true);
    try {
      const models = await getModelsByMakeYear(marca, annoNum);
      setCarqueryModels(models);
      if (models.length === 0) setCarqueryError('Nessun suggerimento trovato');
    } catch {
      setCarqueryError('Errore nel recupero suggerimenti');
    } finally {
      setCarqueryLoading(false);
    }
  }

  async function selezionaCarQueryModel(modelloSuggerito: string) {
    const annoNum = anno ? Number(anno) : new Date().getFullYear();
    setModello(modelloSuggerito);
    try {
      await fetch('/api/marche/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marca: marca.trim(), modello: modelloSuggerito, anno: annoNum }),
      });
      const qs = `?marca=${encodeURIComponent(marca)}&anno=${annoNum}`;
      const r = await fetch(`/api/modelli${qs}`);
      if (r.ok) setModelliCatalogo(await r.json());
    } catch { /* non-critico: il modello resta come free text */ }
    setCarqueryModels([]);
  }

  function selezionaModelloDalCatalogo(idStr: string) {
    if (idStr === '__manual__') {
      setAnnoLocked(false);
      return;
    }
    if (idStr === '') {
      setModello('');
      setAnnoLocked(false);
      return;
    }
    const id = Number(idStr);
    const m = modelliCatalogo.find((x) => x.id === id);
    if (!m) return;
    setModello(m.modello);
    setAnno(String(annoMedio(m)));
    setAnnoLocked(true);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!marca.trim() || !modello.trim() || !anno || !targa.trim() || !km) {
      setError('Compila tutti i campi obbligatori'); return;
    }

    setSubmitting(true);

    const body = {
      marca: marca.trim(),
      modello: modello.trim(),
      versione: versione.trim() || null,
      anno: Number(anno),
      targa: targa.trim().toUpperCase(),
      km: Number(km),
      cilindrata: cilindrata.trim() || null,
      siglaMotore: siglaMotore.trim() || null,
      carburante: carburante.trim() || null,
      potenzaKw: potenzaKw ? Number(potenzaKw) : null,
    };

    try {
      const url = mode === 'create' ? '/api/veicoli' : `/api/veicoli/${veicoloId}`;
      const method = mode === 'create' ? 'POST' : 'PUT';
      const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        setError(err.error || 'Errore durante il salvataggio');
        setSubmitting(false);
        return;
      }
      router.push('/dashboard/veicoli');
      router.refresh();
    } catch {
      setError('Errore di rete');
      setSubmitting(false);
    }
  }

  async function onDelete() {
    if (!veicoloId) return;
    if (!confirm('Eliminare questo veicolo sorgente? I ricambi collegati resteranno in magazzino ma perderanno il riferimento.')) return;
    const r = await fetch(`/api/veicoli/${veicoloId}`, { method: 'DELETE' });
    if (r.ok) {
      router.push('/dashboard/veicoli');
      router.refresh();
    } else {
      alert('Errore durante l\'eliminazione');
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Dati veicolo</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Targa *</label>
            <input
              type="text"
              value={targa}
              onChange={(e) => setTarga(e.target.value.toUpperCase())}
              placeholder="AB123CD"
              maxLength={7}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg font-mono focus:outline-none focus:border-[#003580]"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Anno *
              {annoLocked && (
                <button
                  type="button"
                  onClick={() => setAnnoLocked(false)}
                  className="text-[10px] text-[#003580] ml-2 font-normal hover:underline"
                >
                  modifica
                </button>
              )}
            </label>
            <input
              type="number"
              value={anno}
              onChange={(e) => setAnno(e.target.value)}
              min={1900}
              max={new Date().getFullYear() + 1}
              readOnly={annoLocked}
              className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#003580] ${annoLocked ? 'bg-gray-50' : ''}`}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Marca *</label>
            <Combobox
              options={marcheCombinate.map((m) => ({ id: m, label: m }))}
              value={marca}
              onSelect={(opt) => { setMarca(opt?.label ?? ''); setModello(''); setAnnoLocked(false); }}
              onFreeText={(t) => { setMarca(t); setModello(''); setAnnoLocked(false); }}
              placeholder="Seleziona marca…"
              searchPlaceholder="Cerca marca (es. fi…)"
              allowFreeText
              required
              uppercase
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Modello *
              {modelliCatalogo.length > 0 && (
                <span className="text-[10px] text-green-600 ml-2 font-normal">
                  {modelliCatalogo.length} dal catalogo{anno ? ` per il ${anno}` : ''}
                </span>
              )}
            </label>
            {modelliCatalogo.length > 0 ? (
              <Combobox
                options={modelliCatalogo.map((m) => ({ id: String(m.id), label: labelModello(m) }))}
                value={modello ? (modelliCatalogo.find((m) => m.modello === modello) ? labelModello(modelliCatalogo.find((m) => m.modello === modello)!) : modello) : ''}
                onSelect={(opt) => {
                  if (!opt) { setModello(''); setAnnoLocked(false); return; }
                  const m = modelliCatalogo.find((x) => String(x.id) === opt.id);
                  if (!m) return;
                  setModello(m.modello);
                  if (!anno) { setAnno(String(annoMedio(m))); setAnnoLocked(true); }
                }}
                onFreeText={(t) => { setModello(t); setAnnoLocked(false); }}
                placeholder="Seleziona modello…"
                searchPlaceholder="Cerca modello"
                allowFreeText
                required
                disabled={!marca}
              />
            ) : (
              <Combobox
                options={modelliLegacy.map((m) => ({ id: m, label: m }))}
                value={modello}
                onSelect={(opt) => { setModello(opt?.label ?? ''); setAnnoLocked(false); }}
                onFreeText={(t) => { setModello(t); setAnnoLocked(false); }}
                placeholder="Seleziona modello…"
                searchPlaceholder="Cerca modello"
                allowFreeText
                required
                disabled={!marca}
              />
            )}
            {marca && modelliCatalogo.length === 0 && (
              <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-600">Nessun modello in catalogo per {marca}{anno ? ` ${anno}` : ''}.</span>
                  <button
                    type="button"
                    onClick={cercaSuggerimentiCarQuery}
                    disabled={carqueryLoading}
                    className="px-2 py-1 text-[11px] font-semibold text-[#003580] border border-[#003580] rounded hover:bg-[#003580] hover:text-white disabled:opacity-50"
                  >
                    {carqueryLoading ? 'Cerco…' : 'Cerca suggerimenti'}
                  </button>
                </div>
                {carqueryError && <div className="mt-1 text-red-600">{carqueryError}</div>}
                {carqueryModels.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {carqueryModels.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => selezionaCarQueryModel(m)}
                        className="px-2 py-0.5 bg-white border border-gray-300 rounded text-[11px] hover:bg-[#003580] hover:text-white hover:border-[#003580]"
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Versione</label>
            <input
              type="text"
              value={versione}
              onChange={(e) => setVersione(e.target.value)}
              placeholder="Es. 1.6 JTDm Sprint"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#003580]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Chilometraggio *</label>
            <input
              type="number"
              value={km}
              onChange={(e) => setKm(e.target.value)}
              min={0}
              placeholder="120000"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#003580]"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Cilindrata</label>
            <input
              type="text"
              value={cilindrata}
              onChange={(e) => setCilindrata(e.target.value)}
              placeholder="1600"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#003580]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Sigla motore</label>
            <input
              type="text"
              value={siglaMotore}
              onChange={(e) => setSiglaMotore(e.target.value)}
              placeholder="Es. 198A3000"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg font-mono focus:outline-none focus:border-[#003580]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Carburante</label>
            <select
              value={carburante}
              onChange={(e) => setCarburante(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#003580]"
            >
              <option value="">—</option>
              <option value="Benzina">Benzina</option>
              <option value="Diesel">Diesel</option>
              <option value="GPL">GPL</option>
              <option value="Metano">Metano</option>
              <option value="Ibrido">Ibrido</option>
              <option value="Elettrico">Elettrico</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Potenza (kW)</label>
            <input
              type="number"
              value={potenzaKw}
              onChange={(e) => setPotenzaKw(e.target.value)}
              min={0}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#003580]"
            />
          </div>
        </div>
      </section>

      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        {mode === 'edit' && (
          <button type="button" onClick={onDelete}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold">
            Elimina veicolo
          </button>
        )}
        <div className="sm:ml-auto flex gap-3">
          <button type="button" onClick={() => router.push('/dashboard/veicoli')}
            className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50">
            Annulla
          </button>
          <button type="submit" disabled={submitting}
            className="px-5 py-2.5 bg-[#FF6600] hover:bg-[#d4580a] disabled:bg-gray-300 text-white rounded-lg text-sm font-semibold">
            {submitting ? 'Salvataggio…' : mode === 'create' ? 'Crea veicolo' : 'Salva modifiche'}
          </button>
        </div>
      </div>
    </form>
  );
}
