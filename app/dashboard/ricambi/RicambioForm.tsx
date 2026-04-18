'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RICAMBI_GRUPPI } from '../../../lib/ricambi';
import { MARCHE as MARCHE_LEGACY, getModelli as getModelliLegacy } from '../../../lib/veicoli-db';
import { labelModello, annoMedio, type ModelloAutoLite } from '../../../lib/modelli-auto';
import Combobox from '../../../components/Combobox';
import CompatibilitaEditor, { type CompatibilitaItem } from '../../../components/CompatibilitaEditor';
import PhotoGrid, { type FotoItem } from '../../../components/PhotoGrid';

const DEFAULT_EBAY_CATEGORY_ID = '9886';
const DEFAULT_CATEGORIA = 'Altri ricambi e accessori';

const TIPOLOGIE = [
  { value: 'standard', label: 'Ins. ricambio standard' },
  { value: 'kit', label: 'Kit / pacchetto' },
  { value: 'motore_completo', label: 'Motore completo' },
];

const ALIMENTAZIONI = ['Benzina', 'Diesel', 'GPL', 'Metano', 'Ibrido', 'Elettrico'] as const;
const RICAMBIO_NUOVO = ['Usato', 'Nuovo', 'Ricondizionato', 'Come nuovo', 'Per ricambi o non funzionante'] as const;

type Foto = { id?: number; url: string; copertina?: boolean };
type VeicoloOpt = { id: number; marca: string; modello: string; anno: number; targa: string };
type Stato = 'DISPONIBILE' | 'RISERVATO' | 'VENDUTO' | 'RITIRATO';
const STATI: Stato[] = ['DISPONIBILE', 'RISERVATO', 'VENDUTO', 'RITIRATO'];

interface Props {
  mode: 'create' | 'edit';
  ricambioId?: number;
  initial?: {
    nome: string;
    nomePersonalizzato?: string | null;
    titolo: string | null;
    categoria: string;
    categoriaEbayId: string | null;
    tipologia?: string | null;
    marca: string;
    modello: string;
    anno: number | null;
    cilindrata?: string | null;
    alimentazione?: string | null;
    kw?: number | null;
    km?: number | null;
    targa: string | null;
    telaio?: string | null;
    codiceMotore?: string | null;
    codiceOe: string | null;
    mpn: string | null;
    ean: string | null;
    altroCodice?: string | null;
    codiceInterno?: string | null;
    dettagli?: string | null;
    quantita: number;
    condizione: string | null;
    condDescrizione: string | null;
    descrizione: string | null;
    notePartePubblica?: string | null;
    noteInterne?: string | null;
    prezzo: string | number;
    prezzoSpedizione?: string | number | null;
    ubicazione: string;
    peso: number | null;
    lunghezzaCm: number | null;
    larghezzaCm: number | null;
    altezzaCm: number | null;
    offline?: boolean;
    subito?: boolean;
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

  // Sidebar sx
  const [tipologia, setTipologia] = useState(initial?.tipologia ?? 'standard');
  const [nome, setNome] = useState(initial?.nome ?? '');
  const [nomePersonalizzato, setNomePersonalizzato] = useState(initial?.nomePersonalizzato ?? '');
  const [titolo, setTitolo] = useState(initial?.titolo ?? '');
  const [titoloEditato, setTitoloEditato] = useState(!!initial?.titolo);
  const [foto, setFoto] = useState<Foto[]>(initial?.foto ?? []);

  // Veicolo
  const [marca, setMarca] = useState(initial?.marca ?? '');
  const [modello, setModello] = useState(initial?.modello ?? '');
  const [anno, setAnno] = useState<string>(initial?.anno ? String(initial.anno) : '');
  const [cilindrata, setCilindrata] = useState(initial?.cilindrata ?? '');
  const [alimentazione, setAlimentazione] = useState(initial?.alimentazione ?? '');
  const [targa, setTarga] = useState(initial?.targa ?? '');
  const [telaio, setTelaio] = useState(initial?.telaio ?? '');
  const [km, setKm] = useState<string>(initial?.km ? String(initial.km) : '');
  const [kw, setKw] = useState<string>(initial?.kw ? String(initial.kw) : '');
  const [codiceMotore, setCodiceMotore] = useState(initial?.codiceMotore ?? '');
  const [altroCodice, setAltroCodice] = useState(initial?.altroCodice ?? '');
  const [noteInterne, setNoteInterne] = useState(initial?.noteInterne ?? '');
  const [dettagli, setDettagli] = useState(initial?.dettagli ?? '');
  const [codiceInterno, setCodiceInterno] = useState(initial?.codiceInterno ?? '');

  // Categoria
  const [categoria, setCategoria] = useState(initial?.categoria ?? '');
  const [categoriaEbayId, setCategoriaEbayId] = useState(initial?.categoriaEbayId ?? '');

  // Codici & ricambio
  const [codiceOe, setCodiceOe] = useState(initial?.codiceOe ?? '');
  const [mpn, setMpn] = useState(initial?.mpn ?? '');
  const [ean, setEan] = useState(initial?.ean ?? '');
  const [quantita, setQuantita] = useState<string>(String(initial?.quantita ?? 1));
  const [condizione, setCondizione] = useState(initial?.condizione ?? 'Usato');
  const [condDescrizione, setCondDescrizione] = useState(initial?.condDescrizione ?? '');

  // Compatibilità
  const [compatibilita, setCompatibilita] = useState<CompatibilitaItem[]>(initial?.compatibilita ?? []);

  // Prezzo & ubicazione
  const [prezzo, setPrezzo] = useState<string>(initial?.prezzo !== undefined ? String(initial.prezzo) : '');
  const [prezzoSpedizione, setPrezzoSpedizione] = useState<string>(initial?.prezzoSpedizione !== undefined && initial?.prezzoSpedizione !== null ? String(initial.prezzoSpedizione) : '');
  const [ubicazione, setUbicazione] = useState(initial?.ubicazione ?? '');
  const [notePartePubblica, setNotePartePubblica] = useState(initial?.notePartePubblica ?? '');

  // Descrizione rich text
  const [descrizione, setDescrizione] = useState(initial?.descrizione ?? '');

  // Spedizione
  const initialPesoKg = initial?.peso ? Math.floor(initial.peso / 1000) : 0;
  const initialPesoG = initial?.peso ? initial.peso % 1000 : 0;
  const [pesoKg, setPesoKg] = useState<string>(initialPesoKg ? String(initialPesoKg) : '');
  const [pesoG, setPesoG] = useState<string>(initialPesoG ? String(initialPesoG) : '');
  const [lunghezzaCm, setLunghezzaCm] = useState<string>(initial?.lunghezzaCm ? String(initial.lunghezzaCm) : '');
  const [larghezzaCm, setLarghezzaCm] = useState<string>(initial?.larghezzaCm ? String(initial.larghezzaCm) : '');
  const [altezzaCm, setAltezzaCm] = useState<string>(initial?.altezzaCm ? String(initial.altezzaCm) : '');

  // Flags
  const [offline, setOffline] = useState(initial?.offline ?? false);
  const [subito, setSubito] = useState(initial?.subito ?? false);

  // Stato (edit)
  const [stato, setStato] = useState<Stato>(initial?.stato ?? 'DISPONIBILE');
  const [pubblicato, setPubblicato] = useState(initial?.pubblicato ?? true);

  // Veicolo sorgente + modelloAuto
  const [veicoloid, setVeicoloid] = useState<string>(initial?.veicoloid ? String(initial.veicoloid) : '');
  const [modelloAutoId, setModelloAutoId] = useState<number | null>(initial?.modelloAutoId ?? null);
  const [annoLocked, setAnnoLocked] = useState(initial?.modelloAutoId != null);

  // Canali di vendita
  const [pubblicaSuEbay, setPubblicaSuEbay] = useState(ebayConnected && mode === 'create');

  // UX stati
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Catalogo
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
    for (const g of RICAMBI_GRUPPI) {
      if ((g.voci as readonly string[]).includes(n)) {
        setCategoria(g.categoria);
        return;
      }
    }
  }

  // Titolo generato automaticamente
  const titoloAuto = useMemo(() => {
    let serieAnni = '';
    if (compatibilita.length > 0) {
      const c = compatibilita[0];
      const anniStr = c.annoFine ? `${c.annoInizio}-${c.annoFine}` : `${c.annoInizio}+`;
      serieAnni = c.versione ? `${c.versione} (${anniStr})` : `(${anniStr})`;
    } else if (modelloAutoId !== null) {
      const m = modelliCatalogo.find((x) => x.id === modelloAutoId);
      if (m) {
        const anniStr = m.annoFine ? `${m.annoInizio}-${m.annoFine}` : `${m.annoInizio}+`;
        serieAnni = m.serie ? `${m.serie} (${anniStr})` : `(${anniStr})`;
      }
    } else if (anno) {
      serieAnni = `(${anno})`;
    }
    const nomeVis = nomePersonalizzato.trim() || nome.trim();
    const parts: string[] = [];
    if (nomeVis) parts.push(nomeVis);
    if (marca.trim()) parts.push(marca.trim());
    if (modello.trim()) parts.push(modello.trim());
    if (serieAnni) parts.push(serieAnni);
    if (codiceOe.trim()) parts.push(codiceOe.trim());
    const mpnVal = mpn.trim();
    if (mpnVal && mpnVal.toLowerCase() !== 'non applicabile') parts.push(mpnVal);

    let t = '';
    for (const p of parts) {
      const next = t ? `${t} ${p}` : p;
      if (next.length > 80) {
        if (!t) return next.slice(0, 80);
        break;
      }
      t = next;
    }
    return t;
  }, [nome, nomePersonalizzato, marca, modello, compatibilita, modelloAutoId, modelliCatalogo, anno, codiceOe, mpn]);

  async function uploadFile(file: File) {
    const fd = new FormData();
    fd.append('file', file);
    const r = await fetch('/api/upload', { method: 'POST', body: fd });
    if (!r.ok) throw new Error('Upload fallito');
    const { url } = await r.json();
    return url as string;
  }

  async function uploadBlob(blob: Blob) {
    const file = new File([blob], `edit-${Date.now()}.webp`, { type: blob.type || 'image/webp' });
    return uploadFile(file);
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

  function calcolaPesoGrammi(): number | null {
    const kg = Number(pesoKg) || 0;
    const g = Number(pesoG) || 0;
    const total = kg * 1000 + g;
    return total > 0 ? total : null;
  }

  async function onSubmit(e: React.FormEvent, pubblicaEbay: boolean) {
    e.preventDefault();
    setError(null);

    if (!nome.trim() || !marca.trim() || !modello.trim() || !ubicazione.trim() || !prezzo) {
      setError('Compila tutti i campi obbligatori (nome, marca, modello, ubicazione, prezzo)');
      return;
    }

    setSubmitting(true);

    const body = {
      nome: nome.trim(),
      nomePersonalizzato: nomePersonalizzato.trim() || null,
      titolo: (titoloEffettivo || nome.trim()).slice(0, 80),
      tipologia,
      categoria: (categoria.trim() || DEFAULT_CATEGORIA),
      categoriaEbayId: categoriaEbayId || DEFAULT_EBAY_CATEGORY_ID,
      marca: marca.trim(),
      modello: modello.trim(),
      anno: anno ? Number(anno) : null,
      cilindrata: cilindrata.trim() || null,
      alimentazione: alimentazione || null,
      kw: kw ? Number(kw) : null,
      km: km ? Number(km) : null,
      targa: targa.trim() ? targa.trim().toUpperCase() : null,
      telaio: telaio.trim() || null,
      codiceMotore: codiceMotore.trim() || null,
      codiceOe: codiceOe.trim() || null,
      mpn: mpn.trim() || null,
      ean: ean.trim() || null,
      altroCodice: altroCodice.trim() || null,
      codiceInterno: codiceInterno.trim() || null,
      dettagli: dettagli.trim() || null,
      quantita: Math.max(1, Number(quantita) || 1),
      condizione: condizione || null,
      condDescrizione: condDescrizione.trim() || null,
      descrizione: descrizione.trim() || null,
      notePartePubblica: notePartePubblica.trim() || null,
      noteInterne: noteInterne.trim() || null,
      prezzo: Number(prezzo),
      prezzoSpedizione: prezzoSpedizione ? Number(prezzoSpedizione) : null,
      ubicazione: ubicazione.trim().toUpperCase(),
      peso: calcolaPesoGrammi(),
      lunghezzaCm: lunghezzaCm ? Number(lunghezzaCm) : null,
      larghezzaCm: larghezzaCm ? Number(larghezzaCm) : null,
      altezzaCm: altezzaCm ? Number(altezzaCm) : null,
      offline,
      subito,
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
            alert(`Ricambio salvato. Pubblicazione eBay fallita: ${pubErr.error || 'errore sconosciuto'}.`);
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
      if (data.ebayWarning) alert(`Ricambio eliminato. Attenzione eBay: ${data.ebayWarning}`);
      router.push('/dashboard/ricambi');
      router.refresh();
    } else {
      alert('Errore durante l\'eliminazione');
    }
  }

  const labelClass = 'block text-xs font-semibold text-gray-600 mb-1';
  const inputClass = 'w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-[#003580]';
  const numberInputClass = inputClass + ' [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]';
  const cardClass = 'bg-white rounded-lg border border-gray-200 shadow-sm p-4';

  const tuttiNomi = RICAMBI_GRUPPI.flatMap((g) => g.voci);
  const titoloEffettivo = titoloEditato ? titolo : titoloAuto;

  return (
    <form onSubmit={(e) => onSubmit(e, pubblicaSuEbay)} className="min-h-screen bg-[#eaf0fa]">
      <div className="flex gap-4 p-4">
        {/* SIDEBAR SX */}
        <aside className="w-72 shrink-0 space-y-3">
          {/* Tipologia */}
          <div className="bg-white border border-gray-200 rounded shadow-sm p-3">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Tipologia ⓘ</p>
            <select value={tipologia} onChange={(e) => setTipologia(e.target.value)} className={inputClass}>
              {TIPOLOGIE.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {/* Nome ricambio */}
          <div className="bg-white border border-gray-200 rounded shadow-sm p-3">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Nome Ricambio</p>
            <input
              type="text"
              list="nomi-ricambi"
              value={nome}
              onChange={(e) => selezionaNome(e.target.value)}
              placeholder="Seleziona o digita"
              className={inputClass}
              required
            />
            <datalist id="nomi-ricambi">
              {tuttiNomi.map((n) => <option key={n} value={n} />)}
            </datalist>
          </div>

          {/* Foto upload */}
          <div className="bg-white border border-gray-200 rounded shadow-sm p-3">
            <p className="text-[11px] text-gray-500 text-center mb-1">Max 1MB per foto</p>
            <label className="flex flex-col items-center justify-center gap-2 px-3 py-6 border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-[#003580] hover:bg-gray-50">
              <input type="file" accept="image/*" multiple onChange={onFileChange} className="hidden" />
              <svg className="w-10 h-10 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 15.2a3.2 3.2 0 100-6.4 3.2 3.2 0 000 6.4z" />
                <path fillRule="evenodd" d="M9 2L7.17 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2h-3.17L15 2H9zm3 15a5 5 0 110-10 5 5 0 010 10z" clipRule="evenodd" />
              </svg>
              <p className="text-xs font-bold text-gray-700 uppercase">CARICA IMMAGINI (Max 24)</p>
              <p className="text-[11px] text-gray-500 text-center leading-tight">
                {uploading ? 'Upload in corso…' : 'Trascina una o più immagini qui per caricarle o clicca per scattare o selezionarne una.'}
              </p>
            </label>
            <PhotoGrid foto={foto as FotoItem[]} onChange={(next) => setFoto(next)} uploadBlob={uploadBlob} />
            {foto.length > 0 && (
              <p className="text-[10px] text-gray-500 mt-1 text-center">Trascina per riordinare. La prima è la copertina.</p>
            )}
          </div>

          {/* Stato (solo edit) */}
          {mode === 'edit' && (
            <div className="bg-white border border-gray-200 rounded shadow-sm p-3">
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Stato & pubblicazione</p>
              <div className="space-y-2">
                <select value={stato} onChange={(e) => setStato(e.target.value as Stato)} className={inputClass}>
                  {STATI.map((s) => <option key={s} value={s}>{s.toLowerCase()}</option>)}
                </select>
                <label className="flex items-center gap-2 text-xs text-gray-700">
                  <input type="checkbox" checked={pubblicato} onChange={(e) => setPubblicato(e.target.checked)} className="w-4 h-4" />
                  Pubblicato
                </label>
              </div>
            </div>
          )}

          {/* Titolo editabile */}
          <div className="bg-[#eef4ff] border border-[#003580]/20 rounded p-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-bold text-gray-500 uppercase">Titolo annuncio</p>
              <span className={`text-[10px] font-mono ${titoloEffettivo.length > 80 ? 'text-red-600' : 'text-gray-500'}`}>
                {titoloEffettivo.length}/80
              </span>
            </div>
            <textarea
              value={titoloEditato ? titolo : titoloAuto}
              onChange={(e) => {
                const v = e.target.value.slice(0, 80);
                setTitolo(v);
                setTitoloEditato(true);
              }}
              placeholder="Compila i campi per generare automaticamente…"
              rows={3}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:border-[#003580] resize-none"
            />
            {titoloEditato && (
              <button
                type="button"
                onClick={() => { setTitolo(''); setTitoloEditato(false); }}
                className="text-[10px] text-[#003580] underline mt-1"
              >
                ↺ Rigenera automaticamente
              </button>
            )}
          </div>
        </aside>

        {/* CENTRO */}
        <div className="flex-1 min-w-0 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded text-sm">{error}</div>
          )}

          {/* Marca + Modello */}
          <div className={cardClass}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className={labelClass}>MARCA</p>
                <Combobox
                  options={marcheCombinate.map((m) => ({ id: m, label: m }))}
                  value={marca}
                  onSelect={(opt) => { setMarca(opt?.label ?? ''); setModello(''); setModelloAutoId(null); setAnnoLocked(false); }}
                  onFreeText={(t) => { setMarca(t); setModello(''); setModelloAutoId(null); setAnnoLocked(false); }}
                  placeholder="Seleziona marca"
                  searchPlaceholder="Cerca marca"
                  allowFreeText required uppercase
                />
              </div>
              <div>
                <p className={labelClass}>MODELLO</p>
                {modelliCatalogo.length > 0 ? (
                  <Combobox
                    options={modelliCatalogo.map((m) => ({ id: String(m.id), label: labelModello(m), hint: m.serie ?? undefined }))}
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
                    placeholder="Seleziona modello" searchPlaceholder="Cerca modello"
                    allowFreeText required disabled={!marca}
                  />
                ) : (
                  <Combobox
                    options={modelliLegacy.map((m) => ({ id: m, label: m }))}
                    value={modello}
                    onSelect={(opt) => { setModello(opt?.label ?? ''); setModelloAutoId(null); setAnnoLocked(false); }}
                    onFreeText={(t) => { setModello(t); setModelloAutoId(null); setAnnoLocked(false); }}
                    placeholder="Seleziona modello" searchPlaceholder="Cerca modello"
                    allowFreeText required disabled={!marca}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Dettagli veicolo */}
          <div className={cardClass}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <p className={labelClass}>Anno</p>
                <input type="number" value={anno} onChange={(e) => setAnno(e.target.value)} min={1900} max={new Date().getFullYear() + 1} className={numberInputClass} />
              </div>
              <div>
                <p className={labelClass}>Cilindrata</p>
                <input type="text" value={cilindrata} onChange={(e) => setCilindrata(e.target.value)} placeholder="1400" className={inputClass} />
              </div>
              <div>
                <p className={labelClass}>Alimentazione</p>
                <select value={alimentazione} onChange={(e) => setAlimentazione(e.target.value)} className={inputClass}>
                  <option value="">—</option>
                  {ALIMENTAZIONI.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <p className={labelClass}>Targa</p>
                <input type="text" value={targa} onChange={(e) => setTarga(e.target.value.toUpperCase())} maxLength={10} className={inputClass + ' font-mono'} />
              </div>
              <div>
                <p className={labelClass}>Telaio</p>
                <input type="text" value={telaio} onChange={(e) => setTelaio(e.target.value)} placeholder="Uso interno" className={inputClass + ' font-mono'} />
              </div>
              <div>
                <p className={labelClass}>Chilometri percorsi</p>
                <input type="number" value={km} onChange={(e) => setKm(e.target.value)} min={0} className={numberInputClass} />
              </div>
              <div>
                <p className={labelClass}>Kw (chilowatt)</p>
                <input type="number" value={kw} onChange={(e) => setKw(e.target.value)} min={0} className={numberInputClass} />
              </div>
              <div>
                <p className={labelClass}>Ricambio Nuovo?</p>
                <select value={condizione} onChange={(e) => setCondizione(e.target.value)} className={inputClass}>
                  {RICAMBIO_NUOVO.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <p className={labelClass}>Codice Motore (P5)</p>
                <input type="text" value={codiceMotore} onChange={(e) => setCodiceMotore(e.target.value)} className={inputClass + ' font-mono'} />
              </div>
              <div>
                <p className={labelClass}>Altro codice</p>
                <input type="text" value={altroCodice} onChange={(e) => setAltroCodice(e.target.value)} className={inputClass + ' font-mono'} />
              </div>
              <div className="col-span-2">
                <p className={labelClass}>Note interne</p>
                <input type="text" value={noteInterne} onChange={(e) => setNoteInterne(e.target.value)} placeholder="Uso interno, non pubblicate" className={inputClass} />
              </div>
            </div>
          </div>

          {/* Prezzo + codici */}
          <div className={cardClass}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <p className={labelClass}>Prezzo compreso iva *</p>
                <input type="number" value={prezzo} onChange={(e) => setPrezzo(e.target.value)} step="0.01" min="0" placeholder="Es. 100" className={numberInputClass} required />
              </div>
              <div>
                <p className={labelClass}>Codice ricambio</p>
                <input type="text" value={mpn} onChange={(e) => setMpn(e.target.value)} placeholder="Indispensabile" className={inputClass + ' font-mono'} />
              </div>
              <div>
                <p className={labelClass}>Codice OE ⓘ</p>
                <input type="text" value={codiceOe} onChange={(e) => setCodiceOe(e.target.value)} placeholder="Codice costruttore" className={inputClass + ' font-mono'} />
              </div>
              <div>
                <p className={labelClass}>Ubicazione di magazzino *</p>
                <input type="text" value={ubicazione} onChange={(e) => setUbicazione(e.target.value.toUpperCase())} placeholder="Ubicazione" className={inputClass + ' font-mono'} required />
              </div>
            </div>
          </div>

          {/* Compatibilità */}
          <div className={cardClass}>
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Compatibilità veicoli</p>
            <CompatibilitaEditor value={compatibilita} onChange={setCompatibilita} />
          </div>

          {/* eBay */}
          {mode === 'create' && (
            <div className="bg-[#eef4ff] border border-[#003580]/30 rounded p-4">
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Canali di vendita</p>
              <label className="flex items-center gap-3 text-sm">
                <input type="checkbox" checked={pubblicaSuEbay} onChange={(e) => setPubblicaSuEbay(e.target.checked)} disabled={!ebayConnected} className="w-5 h-5" />
                <span className={ebayConnected ? 'text-gray-800' : 'text-gray-400'}>
                  Pubblica su eBay
                  {!ebayConnected && (
                    <Link href="/dashboard/ebay" className="text-[11px] text-red-600 ml-2 underline">collega eBay</Link>
                  )}
                </span>
              </label>
            </div>
          )}

          {/* Bottoni finali */}
          <div className="flex flex-wrap justify-between gap-3 pb-8">
            {mode === 'edit' ? (
              <button type="button" onClick={onDelete} className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-semibold">Elimina</button>
            ) : <span />}
            <div className="flex gap-3">
              <Link href="/dashboard/ricambi" className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded text-sm font-semibold hover:bg-gray-50">Annulla</Link>
              {mode === 'create' && (
                <button type="button" onClick={(e) => onSubmit(e as unknown as React.FormEvent, false)} disabled={submitting || uploading} className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded text-sm font-semibold hover:bg-gray-50 disabled:bg-gray-100">Salva bozza</button>
              )}
              <button type="submit" disabled={submitting || uploading} className="px-5 py-2.5 bg-[#FF6600] hover:bg-[#d4580a] disabled:bg-gray-300 text-white rounded text-sm font-semibold">
                {submitting ? 'Salvataggio…' : mode === 'create' ? (pubblicaSuEbay ? 'Pubblica e stampa etichetta' : 'Crea ricambio') : 'Salva modifiche'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </form>
  );
}
