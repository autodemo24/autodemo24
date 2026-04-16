'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RICAMBI_GRUPPI } from '../../../lib/ricambi';
import { MARCHE as MARCHE_LEGACY, getModelli as getModelliLegacy } from '../../../lib/veicoli-db';
import { labelModello, annoMedio, type ModelloAutoLite } from '../../../lib/modelli-auto';
import Combobox from '../../../components/Combobox';
import RichTextEditor from '../../../components/RichTextEditor';
import CompatibilitaEditor, { type CompatibilitaItem } from '../../../components/CompatibilitaEditor';
import { EBAY_CATEGORIES_IT } from '../../../lib/ebay/categories';

type Foto = { id?: number; url: string; copertina?: boolean };

type VeicoloOpt = { id: number; marca: string; modello: string; anno: number; targa: string };

const CONDIZIONI = [
  'Nuovo',
  'Come nuovo',
  'Usato - ottime condizioni',
  'Usato - buone condizioni',
  'Usato',
  'Usato - condizioni accettabili',
  'Per ricambi o non funzionante',
] as const;

type Stato = 'DISPONIBILE' | 'RISERVATO' | 'VENDUTO' | 'RITIRATO';
const STATI: Stato[] = ['DISPONIBILE', 'RISERVATO', 'VENDUTO', 'RITIRATO'];

interface Props {
  mode: 'create' | 'edit';
  ricambioId?: number;
  initial?: {
    nome: string;
    titolo: string | null;
    categoria: string;
    categoriaEbayId: string | null;
    marca: string;
    modello: string;
    anno: number | null;
    targa: string | null;
    codiceOe: string | null;
    mpn: string | null;
    ean: string | null;
    quantita: number;
    condizione: string | null;
    condDescrizione: string | null;
    descrizione: string | null;
    prezzo: string | number;
    ubicazione: string;
    peso: number | null;
    lunghezzaCm: number | null;
    larghezzaCm: number | null;
    altezzaCm: number | null;
    stato: Stato;
    pubblicato: boolean;
    veicoloid: number | null;
    modelloAutoId: number | null;
    foto: Foto[];
    compatibilita: CompatibilitaItem[];
  };
  veicoliSorgente: VeicoloOpt[];
  ebayConnected: boolean;
}

export default function RicambioForm({ mode, ricambioId, initial, veicoliSorgente, ebayConnected }: Props) {
  const router = useRouter();

  // Identificazione
  const [titolo, setTitolo] = useState(initial?.titolo ?? '');
  const [nome, setNome] = useState(initial?.nome ?? '');
  const [categoria, setCategoria] = useState(initial?.categoria ?? '');
  const [categoriaEbayId, setCategoriaEbayId] = useState(initial?.categoriaEbayId ?? '');

  // Specifiche
  const [targa, setTarga] = useState(initial?.targa ?? '');
  const [marca, setMarca] = useState(initial?.marca ?? '');
  const [modello, setModello] = useState(initial?.modello ?? '');
  const [anno, setAnno] = useState<string>(initial?.anno ? String(initial.anno) : '');
  const [codiceOe, setCodiceOe] = useState(initial?.codiceOe ?? '');
  const [mpn, setMpn] = useState(initial?.mpn ?? '');
  const [ean, setEan] = useState(initial?.ean ?? '');
  const [quantita, setQuantita] = useState<string>(String(initial?.quantita ?? 1));

  // Compatibilità
  const [compatibilita, setCompatibilita] = useState<CompatibilitaItem[]>(initial?.compatibilita ?? []);

  // Condizione
  const [condizione, setCondizione] = useState(initial?.condizione ?? 'Usato');
  const [condDescrizione, setCondDescrizione] = useState(initial?.condDescrizione ?? '');

  // Descrizione rich text
  const [descrizione, setDescrizione] = useState(initial?.descrizione ?? '');

  // Prezzo
  const [prezzo, setPrezzo] = useState<string>(initial?.prezzo !== undefined ? String(initial.prezzo) : '');

  // Ubicazione
  const [ubicazione, setUbicazione] = useState(initial?.ubicazione ?? '');

  // Spedizione (peso in kg + g, dimensioni cm)
  const initialPesoKg = initial?.peso ? Math.floor(initial.peso / 1000) : 0;
  const initialPesoG = initial?.peso ? initial.peso % 1000 : 0;
  const [pesoKg, setPesoKg] = useState<string>(initialPesoKg ? String(initialPesoKg) : '');
  const [pesoG, setPesoG] = useState<string>(initialPesoG ? String(initialPesoG) : '');
  const [lunghezzaCm, setLunghezzaCm] = useState<string>(initial?.lunghezzaCm ? String(initial.lunghezzaCm) : '');
  const [larghezzaCm, setLarghezzaCm] = useState<string>(initial?.larghezzaCm ? String(initial.larghezzaCm) : '');
  const [altezzaCm, setAltezzaCm] = useState<string>(initial?.altezzaCm ? String(initial.altezzaCm) : '');

  // Stato (solo edit)
  const [stato, setStato] = useState<Stato>(initial?.stato ?? 'DISPONIBILE');
  const [pubblicato, setPubblicato] = useState(initial?.pubblicato ?? true);

  // Foto, veicolo sorgente, modelloAuto
  const [foto, setFoto] = useState<Foto[]>(initial?.foto ?? []);
  const [veicoloid, setVeicoloid] = useState<string>(initial?.veicoloid ? String(initial.veicoloid) : '');
  const [modelloAutoId, setModelloAutoId] = useState<number | null>(initial?.modelloAutoId ?? null);
  const [annoLocked, setAnnoLocked] = useState(initial?.modelloAutoId != null);

  // Canali di vendita
  const [pubblicaSuEbay, setPubblicaSuEbay] = useState(ebayConnected && mode === 'create');

  // Stati UX
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Catalogo marche/modelli
  const [marcheCatalogo, setMarcheCatalogo] = useState<string[]>([]);
  const [modelliCatalogo, setModelliCatalogo] = useState<ModelloAutoLite[]>([]);
  const modelliLegacy = useMemo(() => (marca ? getModelliLegacy(marca) : []), [marca]);

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

  // Cascade veicolo sorgente → marca/modello/anno/targa
  useEffect(() => {
    if (!veicoloid) return;
    const v = veicoliSorgente.find((x) => String(x.id) === veicoloid);
    if (v) {
      setMarca(v.marca);
      setModello(v.modello);
      setAnno(String(v.anno));
      setTarga(v.targa);
      setModelloAutoId(null);
      setAnnoLocked(false);
    }
  }, [veicoloid, veicoliSorgente]);

  const marcheCombinate = useMemo(
    () => Array.from(new Set([...marcheCatalogo, ...MARCHE_LEGACY])).sort(),
    [marcheCatalogo],
  );

  function selezionaNome(n: string) {
    setNome(n);
    if (!titolo) setTitolo(n); // se il titolo è vuoto, lo prefilla con il nome
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

  function calcolaPesoGrammi(): number | null {
    const kg = Number(pesoKg) || 0;
    const g = Number(pesoG) || 0;
    const total = kg * 1000 + g;
    return total > 0 ? total : null;
  }

  async function onSubmit(e: React.FormEvent, pubblicaEbay: boolean) {
    e.preventDefault();
    setError(null);

    if (!nome.trim() || !categoria.trim() || !marca.trim() || !modello.trim() || !ubicazione.trim() || !prezzo) {
      setError('Compila tutti i campi obbligatori (nome, categoria, marca, modello, ubicazione, prezzo)');
      return;
    }
    if ((titolo.trim() || nome.trim()).length > 80) {
      setError('Il titolo non può superare 80 caratteri');
      return;
    }

    setSubmitting(true);

    const body = {
      nome: nome.trim(),
      titolo: titolo.trim() || null,
      categoria: categoria.trim(),
      categoriaEbayId: categoriaEbayId || null,
      marca: marca.trim(),
      modello: modello.trim(),
      anno: anno ? Number(anno) : null,
      targa: targa.trim() ? targa.trim().toUpperCase() : null,
      codiceOe: codiceOe.trim() || null,
      mpn: mpn.trim() || null,
      ean: ean.trim() || null,
      quantita: Math.max(1, Number(quantita) || 1),
      condizione: condizione || null,
      condDescrizione: condDescrizione.trim() || null,
      descrizione: descrizione.trim() || null,
      prezzo: Number(prezzo),
      ubicazione: ubicazione.trim().toUpperCase(),
      peso: calcolaPesoGrammi(),
      lunghezzaCm: lunghezzaCm ? Number(lunghezzaCm) : null,
      larghezzaCm: larghezzaCm ? Number(larghezzaCm) : null,
      altezzaCm: altezzaCm ? Number(altezzaCm) : null,
      veicoloid: veicoloid ? Number(veicoloid) : null,
      modelloAutoId,
      compatibilita: compatibilita.map((c) => ({
        marca: c.marca,
        modello: c.modello,
        annoInizio: c.annoInizio,
        annoFine: c.annoFine,
        versione: c.versione ?? null,
      })),
      ...(mode === 'edit' && { stato, pubblicato }),
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

      const saved = mode === 'create' ? await r.json() : { id: ricambioId };
      const savedId = saved.id;

      if (pubblicaEbay && ebayConnected) {
        try {
          const pubR = await fetch(`/api/ricambi/${savedId}/publish-ebay`, { method: 'POST' });
          if (!pubR.ok) {
            const pubErr = await pubR.json().catch(() => ({}));
            // Non blocca il flow: il ricambio è salvato, solo il publish eBay è fallito
            alert(`Ricambio salvato. Pubblicazione eBay fallita: ${pubErr.error || 'errore sconosciuto'}. Puoi riprovare dalla scheda ricambio.`);
          }
        } catch {
          alert('Ricambio salvato. Pubblicazione eBay fallita per errore di rete.');
        }
      }

      if (mode === 'create') {
        router.push(`/dashboard/ricambi/${savedId}/qr`);
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
    if (!confirm('Eliminare definitivamente questo ricambio? Se è pubblicato su eBay verrà ritirato anche da lì.')) return;
    const r = await fetch(`/api/ricambi/${ricambioId}`, { method: 'DELETE' });
    if (r.ok) {
      const data = await r.json().catch(() => ({}));
      if (data.ebayWarning) {
        alert(`Ricambio eliminato. Attenzione eBay: ${data.ebayWarning}`);
      }
      router.push('/dashboard/ricambi');
      router.refresh();
    } else {
      alert('Errore durante l\'eliminazione');
    }
  }

  const tuttiNomi = RICAMBI_GRUPPI.flatMap((g) => g.voci);
  const titoloCorrente = titolo || nome;
  const titoloLen = titoloCorrente.length;

  return (
    <form onSubmit={(e) => onSubmit(e, pubblicaSuEbay)} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {/* FOTO E VIDEO */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Foto e video</h2>
        <p className="text-xs text-gray-500 mb-3">{foto.length}/25 · Trascina o clicca per caricare</p>

        {foto.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
            {foto.map((f) => (
              <div key={f.url} className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.url} alt="" className={`w-full aspect-square object-cover rounded-lg ${f.copertina ? 'ring-2 ring-[#FF6600]' : ''}`} />
                {f.copertina && (
                  <span className="absolute top-1 left-1 bg-[#FF6600] text-white text-xs px-2 py-0.5 rounded font-semibold">
                    Copertina
                  </span>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 rounded-lg">
                  {!f.copertina && (
                    <button type="button" onClick={() => impostaCopertina(f.url)}
                      className="px-2 py-1 bg-white text-xs rounded">Copertina</button>
                  )}
                  <button type="button" onClick={() => rimuoviFoto(f.url)}
                    className="px-2 py-1 bg-red-600 text-white text-xs rounded">Rimuovi</button>
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
          <span className="text-sm text-gray-600">{uploading ? 'Upload in corso…' : 'Trascina o clicca per caricare foto'}</span>
        </label>
      </section>

      {/* TITOLO */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Titolo</h2>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Titolo inserzione *</label>
          <input
            type="text"
            value={titolo}
            onChange={(e) => setTitolo(e.target.value.slice(0, 80))}
            placeholder={nome || 'Es. Centralina motore Fiat Panda 2015'}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#003580]"
          />
          <div className={`text-xs mt-1 text-right ${titoloLen > 80 ? 'text-red-600' : 'text-gray-500'}`}>
            {titoloLen}/80
          </div>
        </div>
      </section>

      {/* CATEGORIA */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Categoria dell'oggetto</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Categoria autodemo24 *</label>
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
            <label className="block text-xs font-semibold text-gray-600 mb-1">Categoria eBay</label>
            <select
              value={categoriaEbayId}
              onChange={(e) => setCategoriaEbayId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#003580]"
            >
              <option value="">— Nessuna (non pubblicabile su eBay) —</option>
              {EBAY_CATEGORIES_IT.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
            <p className="text-[11px] text-gray-500 mt-1">Obbligatoria se pubblichi su eBay.</p>
          </div>
        </div>
      </section>

      {/* SPECIFICHE */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Specifiche dell'oggetto</h2>

        <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Targa del veicolo di provenienza
            <span className="text-[10px] font-normal text-blue-700 ml-2">(finirà sull'etichetta QR)</span>
          </label>
          <input
            type="text"
            value={targa}
            onChange={(e) => setTarga(e.target.value.toUpperCase())}
            placeholder="AB123CD"
            maxLength={10}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg font-mono focus:outline-none focus:border-[#003580]"
          />
        </div>

        {veicoliSorgente.length > 0 && (
          <div className="mb-5">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Veicolo sorgente (opzionale)</label>
            <select
              value={veicoloid}
              onChange={(e) => setVeicoloid(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#003580]"
            >
              <option value="">— Seleziona un veicolo registrato per precompilare —</option>
              {veicoliSorgente.map((v) => (
                <option key={v.id} value={v.id}>{v.marca} {v.modello} ({v.anno}) · {v.targa}</option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Nome ricambio *</label>
            <input
              type="text"
              list="nomi-ricambi"
              value={nome}
              onChange={(e) => selezionaNome(e.target.value)}
              placeholder="Es. Centralina motore"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#003580]"
              required
            />
            <datalist id="nomi-ricambi">
              {tuttiNomi.map((n) => <option key={n} value={n} />)}
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Marca *</label>
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
              searchPlaceholder="Cerca marca"
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
                  {modelliCatalogo.length} dal catalogo
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
                  if (!anno) { setAnno(String(annoMedio(m))); setAnnoLocked(true); }
                }}
                onFreeText={(t) => { setModello(t); setModelloAutoId(null); setAnnoLocked(false); }}
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
                <button type="button" onClick={() => setAnnoLocked(false)}
                  className="text-[10px] text-[#003580] ml-2 font-normal hover:underline">modifica</button>
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
            <label className="block text-xs font-semibold text-gray-600 mb-1">Quantità</label>
            <input
              type="number"
              value={quantita}
              onChange={(e) => setQuantita(e.target.value)}
              min={1}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#003580]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Codice originale OE/OEM</label>
            <input
              type="text"
              value={codiceOe}
              onChange={(e) => setCodiceOe(e.target.value)}
              placeholder="Es. 55283304"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg font-mono focus:outline-none focus:border-[#003580]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">MPN (Manufacturer Part Number)</label>
            <input
              type="text"
              value={mpn}
              onChange={(e) => setMpn(e.target.value)}
              placeholder="Es. 0281016086"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg font-mono focus:outline-none focus:border-[#003580]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">EAN (Barcode)</label>
            <input
              type="text"
              value={ean}
              onChange={(e) => setEan(e.target.value)}
              placeholder="Es. 4047026334517"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg font-mono focus:outline-none focus:border-[#003580]"
            />
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
        </div>
      </section>

      {/* COMPATIBILITÀ */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Compatibilità</h2>
        <p className="text-xs text-gray-500 mb-4">Specifica i veicoli compatibili con questo ricambio per facilitare la ricerca agli acquirenti.</p>
        <CompatibilitaEditor value={compatibilita} onChange={setCompatibilita} />
      </section>

      {/* CONDIZIONE */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Condizione</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Condizione dell'oggetto</label>
            <select
              value={condizione}
              onChange={(e) => setCondizione(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#003580]"
            >
              {CONDIZIONI.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Descrizione della condizione</label>
            <textarea
              value={condDescrizione}
              onChange={(e) => setCondDescrizione(e.target.value.slice(0, 1000))}
              rows={3}
              placeholder="Descrivi graffi, usura, parti mancanti…"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#003580]"
            />
            <div className="text-xs text-gray-500 mt-1 text-right">{condDescrizione.length}/1000</div>
          </div>
        </div>
      </section>

      {/* DESCRIZIONE */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Descrizione</h2>
        <RichTextEditor
          value={descrizione}
          onChange={setDescrizione}
          placeholder="Descrivi il ricambio, note, codici, compatibilità aggiuntive…"
          minHeight={200}
        />
      </section>

      {/* PREZZO */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Prezzo</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Prezzo dell'oggetto *</label>
            <div className="relative">
              <input
                type="number"
                value={prezzo}
                onChange={(e) => setPrezzo(e.target.value)}
                step="0.01"
                min="0"
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#003580]"
                required
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">€</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">IVA inclusa se applicabile</p>
          </div>
        </div>
      </section>

      {/* SPEDIZIONE */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Spedizione</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Peso del pacco (opzionale)</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={pesoKg}
                onChange={(e) => setPesoKg(e.target.value)}
                min={0}
                placeholder="kg"
                className="w-24 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#003580]"
              />
              <input
                type="number"
                value={pesoG}
                onChange={(e) => setPesoG(e.target.value)}
                min={0}
                max={999}
                placeholder="g"
                className="w-24 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#003580]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Dimensioni pacco (cm, opzionale)</label>
            <div className="flex items-center gap-2">
              <input type="number" value={lunghezzaCm} onChange={(e) => setLunghezzaCm(e.target.value)} min={0} placeholder="L" className="w-20 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#003580]" />
              <span className="text-gray-500">×</span>
              <input type="number" value={larghezzaCm} onChange={(e) => setLarghezzaCm(e.target.value)} min={0} placeholder="W" className="w-20 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#003580]" />
              <span className="text-gray-500">×</span>
              <input type="number" value={altezzaCm} onChange={(e) => setAltezzaCm(e.target.value)} min={0} placeholder="H" className="w-20 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#003580]" />
            </div>
          </div>
        </div>
      </section>

      {/* STATO (solo edit) */}
      {mode === 'edit' && (
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Stato & pubblicazione</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Stato</label>
              <select
                value={stato}
                onChange={(e) => setStato(e.target.value as Stato)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#003580]"
              >
                {STATI.map((s) => <option key={s} value={s}>{s.toLowerCase()}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input id="pubblicato" type="checkbox" checked={pubblicato} onChange={(e) => setPubblicato(e.target.checked)} className="w-4 h-4" />
              <label htmlFor="pubblicato" className="text-sm text-gray-700">Visibile nel portale pubblico</label>
            </div>
          </div>
        </section>
      )}

      {/* CANALI DI VENDITA */}
      {mode === 'create' && (
        <section className="bg-[#eef4ff] border border-[#003580]/20 rounded-xl p-5">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">Canali di vendita</h2>
          <div className="flex items-center gap-3">
            <input
              id="pubblicaEbay"
              type="checkbox"
              checked={pubblicaSuEbay}
              onChange={(e) => setPubblicaSuEbay(e.target.checked)}
              disabled={!ebayConnected}
              className="w-4 h-4"
            />
            <label htmlFor="pubblicaEbay" className={`text-sm ${ebayConnected ? 'text-gray-800' : 'text-gray-400'}`}>
              Pubblica su eBay
              {!ebayConnected && (
                <span className="text-[11px] text-red-600 ml-2">
                  (non connesso — <a href="/dashboard/ebay" className="underline">collega eBay</a>)
                </span>
              )}
            </label>
          </div>
        </section>
      )}

      {/* PULSANTI FINALI */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        {mode === 'edit' && (
          <button type="button" onClick={onDelete}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold">
            Elimina ricambio
          </button>
        )}
        <div className="sm:ml-auto flex flex-wrap gap-3">
          <button type="button" onClick={() => router.push('/dashboard/ricambi')}
            className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50">
            Annulla
          </button>
          {mode === 'create' && (
            <button
              type="button"
              onClick={(e) => onSubmit(e as unknown as React.FormEvent, false)}
              disabled={submitting || uploading}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 disabled:bg-gray-100"
            >
              Salva bozza
            </button>
          )}
          <button type="submit" disabled={submitting || uploading}
            className="px-5 py-2.5 bg-[#FF6600] hover:bg-[#d4580a] disabled:bg-gray-300 text-white rounded-lg text-sm font-semibold">
            {submitting ? 'Salvataggio…' : mode === 'create' ? (pubblicaSuEbay ? 'Pubblica e stampa etichetta' : 'Crea e stampa etichetta') : 'Salva modifiche'}
          </button>
        </div>
      </div>
    </form>
  );
}
