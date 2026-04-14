'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RICAMBI_GRUPPI } from '../../../lib/ricambi';
import { MARCHE as MARCHE_LEGACY, getModelli as getModelliLegacy } from '../../../lib/veicoli-db';
import { labelModello, annoMedio, type ModelloAutoLite } from '../../../lib/modelli-auto';
import Combobox from '../../../components/Combobox';

type Foto = { id?: number; url: string; copertina?: boolean };

type VeicoloOpt = { id: number; marca: string; modello: string; anno: number; targa: string };

interface Props {
  mode: 'create' | 'edit';
  ricambioId?: number;
  initial?: {
    nome: string;
    categoria: string;
    marca: string;
    modello: string;
    anno: number | null;
    descrizione: string | null;
    prezzo: string | number;
    ubicazione: string;
    stato: 'DISPONIBILE' | 'RISERVATO' | 'VENDUTO' | 'RITIRATO';
    pubblicato: boolean;
    veicoloid: number | null;
    modelloAutoId: number | null;
    foto: Foto[];
  };
  veicoliSorgente: VeicoloOpt[];
}

const STATI: Array<'DISPONIBILE' | 'RISERVATO' | 'VENDUTO' | 'RITIRATO'> = [
  'DISPONIBILE', 'RISERVATO', 'VENDUTO', 'RITIRATO',
];

export default function RicambioForm({ mode, ricambioId, initial, veicoliSorgente }: Props) {
  const router = useRouter();

  const [nome, setNome] = useState(initial?.nome ?? '');
  const [categoria, setCategoria] = useState(initial?.categoria ?? '');
  const [marca, setMarca] = useState(initial?.marca ?? '');
  const [modello, setModello] = useState(initial?.modello ?? '');
  const [anno, setAnno] = useState<string>(initial?.anno ? String(initial.anno) : '');
  const [descrizione, setDescrizione] = useState(initial?.descrizione ?? '');
  const [prezzo, setPrezzo] = useState<string>(initial?.prezzo !== undefined ? String(initial.prezzo) : '');
  const [ubicazione, setUbicazione] = useState(initial?.ubicazione ?? '');
  const [stato, setStato] = useState<'DISPONIBILE' | 'RISERVATO' | 'VENDUTO' | 'RITIRATO'>(initial?.stato ?? 'DISPONIBILE');
  const [pubblicato, setPubblicato] = useState(initial?.pubblicato ?? true);
  const [veicoloid, setVeicoloid] = useState<string>(initial?.veicoloid ? String(initial.veicoloid) : '');
  const [modelloAutoId, setModelloAutoId] = useState<number | null>(initial?.modelloAutoId ?? null);
  const [foto, setFoto] = useState<Foto[]>(initial?.foto ?? []);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [marcheCatalogo, setMarcheCatalogo] = useState<string[]>([]);
  const [modelliCatalogo, setModelliCatalogo] = useState<ModelloAutoLite[]>([]);
  const [annoLocked, setAnnoLocked] = useState(initial?.modelloAutoId != null);

  const modelliLegacy = useMemo(() => (marca ? getModelliLegacy(marca) : []), [marca]);

  // Carica marche dal catalogo (filtra per anno se valido)
  useEffect(() => {
    const annoNum = anno ? Number(anno) : null;
    const qs = annoNum && Number.isInteger(annoNum) ? `?anno=${annoNum}` : '';
    fetch(`/api/marche${qs}`).then((r) => r.ok ? r.json() : []).then(setMarcheCatalogo).catch(() => {});
  }, [anno]);

  // Carica modelli dal catalogo quando cambia marca o anno
  useEffect(() => {
    if (!marca) { setModelliCatalogo([]); return; }
    const annoNum = anno ? Number(anno) : null;
    const qs = annoNum && Number.isInteger(annoNum) ? `&anno=${annoNum}` : '';
    fetch(`/api/modelli?marca=${encodeURIComponent(marca)}${qs}`)
      .then((r) => r.ok ? r.json() : [])
      .then(setModelliCatalogo)
      .catch(() => setModelliCatalogo([]));
  }, [marca, anno]);

  // Cascade: quando seleziono veicolo sorgente, precompila marca/modello/anno
  useEffect(() => {
    if (!veicoloid) return;
    const v = veicoliSorgente.find((x) => String(x.id) === veicoloid);
    if (v) {
      setMarca(v.marca);
      setModello(v.modello);
      setAnno(String(v.anno));
      setModelloAutoId(null);
      setAnnoLocked(false);
    }
  }, [veicoloid, veicoliSorgente]);

  function selezionaModelloDalCatalogo(idStr: string) {
    if (idStr === '__manual__') {
      setModelloAutoId(null);
      setAnnoLocked(false);
      return;
    }
    if (idStr === '') {
      setModelloAutoId(null);
      setModello('');
      setAnnoLocked(false);
      return;
    }
    const id = Number(idStr);
    const m = modelliCatalogo.find((x) => x.id === id);
    if (!m) return;
    setModelloAutoId(m.id);
    setModello(m.modello);
    setAnno(String(annoMedio(m)));
    setAnnoLocked(true);
  }

  const marcheCombinate = useMemo(() => {
    return Array.from(new Set([...marcheCatalogo, ...MARCHE_LEGACY])).sort();
  }, [marcheCatalogo]);

  // Cascade: quando cambio nome (da select), imposta categoria automaticamente
  function selezionaNome(n: string) {
    setNome(n);
    for (const g of RICAMBI_GRUPPI) {
      if ((g.voci as readonly string[]).includes(n)) {
        setCategoria(g.categoria);
        return;
      }
    }
  }

  async function uploadFile(file: File) {
    const fd = new FormData();
    fd.append('file', file);
    const r = await fetch('/api/upload', { method: 'POST', body: fd });
    if (!r.ok) throw new Error('Upload fallito');
    const { url } = await r.json();
    return url as string;
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true); setError(null);
    try {
      const urls = await Promise.all(files.map(uploadFile));
      setFoto((prev) => [...prev, ...urls.map((url, i) => ({ url, copertina: prev.length === 0 && i === 0 }))]);
    } catch {
      setError('Errore durante l\'upload delle foto');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  function rimuoviFoto(url: string) {
    setFoto((prev) => {
      const next = prev.filter((f) => f.url !== url);
      if (next.length > 0 && !next.some((f) => f.copertina)) next[0].copertina = true;
      return next;
    });
  }

  function impostaCopertina(url: string) {
    setFoto((prev) => prev.map((f) => ({ ...f, copertina: f.url === url })));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!nome.trim() || !categoria.trim() || !marca.trim() || !modello.trim() || !ubicazione.trim() || !prezzo) {
      setError('Compila tutti i campi obbligatori'); return;
    }

    setSubmitting(true);

    const body = {
      nome: nome.trim(),
      categoria: categoria.trim(),
      marca: marca.trim(),
      modello: modello.trim(),
      anno: anno ? Number(anno) : null,
      descrizione: descrizione.trim() || null,
      prezzo: Number(prezzo),
      ubicazione: ubicazione.trim().toUpperCase(),
      veicoloid: veicoloid ? Number(veicoloid) : null,
      modelloAutoId,
      ...(mode === 'edit' && { stato, pubblicato }),
      // Riordina: copertina per prima
      fotoUrls: [...foto].sort((a, b) => (b.copertina ? 1 : 0) - (a.copertina ? 1 : 0)).map((f) => f.url),
    };

    try {
      const url = mode === 'create' ? '/api/ricambi' : `/api/ricambi/${ricambioId}`;
      const method = mode === 'create' ? 'POST' : 'PUT';
      const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        setError(err.error || 'Errore durante il salvataggio');
        setSubmitting(false);
        return;
      }
      if (mode === 'create') {
        const created = await r.json();
        router.push(`/dashboard/ricambi/${created.id}/qr`);
      } else {
        router.push('/dashboard/ricambi');
        router.refresh();
      }
    } catch {
      setError('Errore di rete');
      setSubmitting(false);
    }
  }

  async function onDelete() {
    if (!ricambioId) return;
    if (!confirm('Eliminare definitivamente questo ricambio?')) return;
    const r = await fetch(`/api/ricambi/${ricambioId}`, { method: 'DELETE' });
    if (r.ok) {
      router.push('/dashboard/ricambi');
      router.refresh();
    } else {
      alert('Errore durante l\'eliminazione');
    }
  }

  const tuttiNomi = RICAMBI_GRUPPI.flatMap((g) => g.voci);

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Veicolo sorgente (opzionale)</h2>
        <p className="text-xs text-gray-500 mb-3">
          Se hai registrato il veicolo di provenienza, selezionalo per precompilare marca/modello/anno.
        </p>
        <select
          value={veicoloid}
          onChange={(e) => setVeicoloid(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#003580]"
        >
          <option value="">— Nessun veicolo sorgente —</option>
          {veicoliSorgente.map((v) => (
            <option key={v.id} value={v.id}>
              {v.marca} {v.modello} ({v.anno}) · {v.targa}
            </option>
          ))}
        </select>
      </section>

      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Dati ricambio</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Nome ricambio *</label>
            <input
              type="text"
              list="nomi-ricambi"
              value={nome}
              onChange={(e) => selezionaNome(e.target.value)}
              placeholder="Es. Faro anteriore sinistro"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#003580]"
              required
            />
            <datalist id="nomi-ricambi">
              {tuttiNomi.map((n) => <option key={n} value={n} />)}
            </datalist>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Categoria *</label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#003580]"
              required
            >
              <option value="">Seleziona…</option>
              {RICAMBI_GRUPPI.map((g) => <option key={g.categoria} value={g.categoria}>{g.categoria}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Ubicazione magazzino *</label>
            <input
              type="text"
              value={ubicazione}
              onChange={(e) => setUbicazione(e.target.value.toUpperCase())}
              placeholder="Es. 86A"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg font-mono focus:outline-none focus:border-[#003580]"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Marca auto *</label>
            <Combobox
              options={marcheCombinate.map((m) => ({ id: m, label: m }))}
              value={marca}
              onSelect={(opt) => {
                setMarca(opt?.label ?? '');
                setModello('');
                setModelloAutoId(null);
                setAnnoLocked(false);
              }}
              onFreeText={(t) => {
                setMarca(t);
                setModello('');
                setModelloAutoId(null);
                setAnnoLocked(false);
              }}
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
                options={modelliCatalogo.map((m) => ({
                  id: String(m.id),
                  label: labelModello(m),
                  hint: m.serie ?? undefined,
                }))}
                value={modelloAutoId !== null
                  ? labelModello(modelliCatalogo.find((m) => m.id === modelloAutoId) ?? { modello, serie: null, annoInizio: Number(anno) || 0, annoFine: null })
                  : modello}
                onSelect={(opt) => {
                  if (!opt) { setModello(''); setModelloAutoId(null); setAnnoLocked(false); return; }
                  const m = modelliCatalogo.find((x) => String(x.id) === opt.id);
                  if (!m) return;
                  setModelloAutoId(m.id);
                  setModello(m.modello);
                  if (!anno) {
                    setAnno(String(annoMedio(m)));
                    setAnnoLocked(true);
                  }
                }}
                onFreeText={(t) => {
                  setModello(t);
                  setModelloAutoId(null);
                  setAnnoLocked(false);
                }}
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
                onSelect={(opt) => { setModello(opt?.label ?? ''); setModelloAutoId(null); setAnnoLocked(false); }}
                onFreeText={(t) => { setModello(t); setModelloAutoId(null); setAnnoLocked(false); }}
                placeholder="Seleziona modello…"
                searchPlaceholder="Cerca modello"
                allowFreeText
                required
                disabled={!marca}
              />
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Anno
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
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Prezzo (€) *</label>
            <input
              type="number"
              value={prezzo}
              onChange={(e) => setPrezzo(e.target.value)}
              step="0.01"
              min="0"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#003580]"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Descrizione</label>
            <textarea
              value={descrizione}
              onChange={(e) => setDescrizione(e.target.value)}
              rows={3}
              placeholder="Note, difetti, codici OEM, compatibilità…"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#003580]"
            />
          </div>
        </div>
      </section>

      {mode === 'edit' && (
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Stato & pubblicazione</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Stato</label>
              <select
                value={stato}
                onChange={(e) => setStato(e.target.value as typeof stato)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#003580]"
              >
                {STATI.map((s) => <option key={s} value={s}>{s.toLowerCase()}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input
                id="pubblicato"
                type="checkbox"
                checked={pubblicato}
                onChange={(e) => setPubblicato(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="pubblicato" className="text-sm text-gray-700">
                Visibile nel portale pubblico
              </label>
            </div>
          </div>
        </section>
      )}

      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Foto</h2>

        {foto.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
            {foto.map((f) => (
              <div key={f.url} className="relative group">
                <img src={f.url} alt="" className={`w-full aspect-square object-cover rounded-lg ${f.copertina ? 'ring-2 ring-[#FF6600]' : ''}`} />
                {f.copertina && (
                  <span className="absolute top-1 left-1 bg-[#FF6600] text-white text-xs px-2 py-0.5 rounded font-semibold">
                    Copertina
                  </span>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 rounded-lg">
                  {!f.copertina && (
                    <button type="button" onClick={() => impostaCopertina(f.url)}
                      className="px-2 py-1 bg-white text-xs rounded">
                      Copertina
                    </button>
                  )}
                  <button type="button" onClick={() => rimuoviFoto(f.url)}
                    className="px-2 py-1 bg-red-600 text-white text-xs rounded">
                    Rimuovi
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <label className="flex flex-col items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#003580] hover:bg-gray-50 transition">
          <input type="file" accept="image/*" multiple onChange={onFileChange} className="hidden" />
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span className="text-sm text-gray-600">
            {uploading ? 'Upload in corso…' : 'Trascina o clicca per caricare foto'}
          </span>
        </label>
      </section>

      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        {mode === 'edit' && (
          <button type="button" onClick={onDelete}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold">
            Elimina ricambio
          </button>
        )}
        <div className="sm:ml-auto flex gap-3">
          <button type="button" onClick={() => router.push('/dashboard/ricambi')}
            className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50">
            Annulla
          </button>
          <button type="submit" disabled={submitting || uploading}
            className="px-5 py-2.5 bg-[#FF6600] hover:bg-[#d4580a] disabled:bg-gray-300 text-white rounded-lg text-sm font-semibold">
            {submitting ? 'Salvataggio…' : mode === 'create' ? 'Crea ricambio' : 'Salva modifiche'}
          </button>
        </div>
      </div>
    </form>
  );
}
