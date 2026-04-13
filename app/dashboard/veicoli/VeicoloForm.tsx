'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import RicercaTarga, { type TargaResult } from '../../../components/RicercaTarga';
import { MARCHE, getModelli } from '../../../lib/veicoli-db';
import { RICAMBI_GRUPPI } from '../../../lib/ricambi';

const ANNO_CORRENTE = new Date().getFullYear();
const MAX_FOTO = 10;
const CARBURANTI = ['Benzina', 'Diesel', 'Ibrido', 'Ibrido Plug-in', 'Elettrico', 'GPL', 'Metano', 'Benzina/GPL', 'Benzina/Metano'];

type FotoItem = {
  id: string;
  file: File;
  preview: string;
  url: string | null;
  error: string | null;
};

const initialForm = {
  marca: '',
  modello: '',
  anno: '',
  targa: '',
  km: '',
  cilindrata: '',
  siglaMotore: '',
  carburante: '',
  potenzaKw: '',
};

type FormErrors = Partial<typeof initialForm>;

interface Props {
  targaUsate: number;
  targaMax: number;
}

export default function VeicoloForm({ targaUsate, targaMax }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState(initialForm);
  const [versione, setVersione] = useState('');
  const [targaFound, setTargaFound] = useState(false);
  const [usate, setUsate] = useState(targaUsate);
  const [selectedRicambi, setSelectedRicambi] = useState<Set<string>>(new Set());
  const [fotos, setFotos] = useState<FotoItem[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [aperto, setAperto] = useState(false);
  const [modelliDisponibili, setModelliDisponibili] = useState<string[]>([]);

  const [copertinaId, setCopertinaId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // AI detection state
  const [aiSuggestions, setAiSuggestions] = useState<Map<string, number>>(new Map());
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiSuccess, setAiSuccess] = useState('');
  const [previewFotoIdx, setPreviewFotoIdx] = useState(0);

  useEffect(() => {
    if (!form.marca) { setModelliDisponibili([]); return; }
    fetch(`/api/modelli?marca=${encodeURIComponent(form.marca)}`)
      .then((r) => r.json())
      .then((data: string[]) => {
        if (form.modello && !data.includes(form.modello)) {
          setModelliDisponibili([form.modello, ...data]);
        } else {
          setModelliDisponibili(data);
        }
      })
      .catch(() => setModelliDisponibili([]));
  }, [form.marca, form.modello]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleTargaResult = (result: TargaResult) => {
    const matchedMarca = MARCHE.find(
      (m) => m.toLowerCase() === result.marca.toLowerCase()
    ) ?? result.marca;
    const modelliDb = getModelli(matchedMarca);
    const matchedModello = modelliDb.find(
      (m) => m.toLowerCase() === result.modello.toLowerCase()
    ) ?? result.modello;

    setForm((prev) => ({
      ...prev,
      targa:       result.targa,
      marca:       matchedMarca,
      modello:     matchedModello,
      anno:        result.anno ? String(result.anno) : prev.anno,
      cilindrata:  result.cilindrata,
      siglaMotore: result.siglaMotore,
      carburante:  result.carburante,
      potenzaKw:   result.potenzaKw ? String(result.potenzaKw) : prev.potenzaKw,
    }));
    setVersione(result.versione);
    setTargaFound(true);
    setErrors((prev) => ({
      ...prev,
      marca: undefined, modello: undefined, anno: undefined, targa: undefined,
    }));
  };

  const handleTargaClear = () => {
    setTargaFound(false);
    setVersione('');
  };

  /* ── ricambi ── */
  const toggleRicambio = (nome: string) => {
    setSelectedRicambi((prev) => {
      const next = new Set(prev);
      next.has(nome) ? next.delete(nome) : next.add(nome);
      return next;
    });
  };

  const toggleCategoria = (voci: readonly string[]) => {
    const tuttiSelezionati = voci.every((v) => selectedRicambi.has(v));
    setSelectedRicambi((prev) => {
      const next = new Set(prev);
      if (tuttiSelezionati) { voci.forEach((v) => next.delete(v)); }
      else { voci.forEach((v) => next.add(v)); }
      return next;
    });
  };

  /* ── foto ── */
  const uploadFoto = async (item: FotoItem) => {
    const fd = new FormData();
    fd.append('file', item.file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      setFotos((prev) =>
        prev.map((f) =>
          f.id === item.id
            ? { ...f, url: res.ok ? (data.url as string) : null, error: res.ok ? null : (data.error ?? 'Errore upload') }
            : f,
        ),
      );
    } catch {
      setFotos((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, url: null, error: 'Errore di rete' } : f)),
      );
    }
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!files) return;
    const slots = MAX_FOTO - fotos.length;
    if (slots <= 0) return;
    const newItems: FotoItem[] = Array.from(files).slice(0, slots).map((file) => ({
      id: Math.random().toString(36).slice(2),
      file,
      preview: URL.createObjectURL(file),
      url: null,
      error: null,
    }));
    setFotos((prev) => [...prev, ...newItems]);
    newItems.forEach((item) => uploadFoto(item));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFoto = (id: string) => {
    setFotos((prev) => {
      const item = prev.find((f) => f.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((f) => f.id !== id);
    });
    if (copertinaId === id) setCopertinaId(null);
  };

  const handleDragStart = (id: string) => setDragId(id);
  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDragOverId(id);
  };
  const handleDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) { setDragId(null); setDragOverId(null); return; }
    setFotos((prev) => {
      const fromIdx = prev.findIndex((f) => f.id === dragId);
      const toIdx = prev.findIndex((f) => f.id === targetId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
    setDragId(null);
    setDragOverId(null);
  };
  const handleDragEnd = () => { setDragId(null); setDragOverId(null); };

  const getCopertinaId = () => copertinaId ?? fotos[0]?.id ?? null;

  /* ── validazione ── */
  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.marca.trim()) newErrors.marca = 'Campo obbligatorio';
    if (!form.modello.trim()) newErrors.modello = 'Campo obbligatorio';
    const anno = Number(form.anno);
    if (!form.anno || isNaN(anno) || anno < 1900 || anno > ANNO_CORRENTE + 1) {
      newErrors.anno = `Anno non valido (1900 – ${ANNO_CORRENTE})`;
    }
    if (form.targa.trim() && !/^[A-Za-z]{2}\d{3}[A-Za-z]{2}$/.test(form.targa.trim())) {
      newErrors.targa = 'Formato non valido (es. AB123CD)';
    }
    const km = Number(form.km);
    if (!form.km || isNaN(km) || km < 0) newErrors.km = 'Chilometraggio non valido';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ── submit ── */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    const fotosInCaricamento = fotos.filter((f) => f.url === null && f.error === null);
    if (fotosInCaricamento.length > 0) { setServerError('Attendi il completamento del caricamento delle foto.'); return; }
    const fotosConErrore = fotos.filter((f) => f.error !== null);
    if (fotosConErrore.length > 0) { setServerError('Alcune foto non sono state caricate. Rimuovile e riprova.'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/veicoli', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marca:       form.marca.trim(),
          modello:     form.modello.trim(),
          anno:        Number(form.anno),
          targa:       form.targa.trim().toUpperCase(),
          km:          Number(form.km),
          versione,
          cilindrata:  form.cilindrata.trim(),
          siglaMotore: form.siglaMotore.trim(),
          carburante:  form.carburante,
          potenzaKw:   form.potenzaKw ? Number(form.potenzaKw) : null,
          ricambi:     Array.from(selectedRicambi),
          fotoUrls:    (() => {
            const uploaded = fotos.filter((f) => f.url);
            const covId = getCopertinaId();
            // Metti la copertina per prima
            const sorted = covId
              ? [
                  ...uploaded.filter((f) => f.id === covId),
                  ...uploaded.filter((f) => f.id !== covId),
                ]
              : uploaded;
            return sorted.map((f) => f.url!);
          })(),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setServerError(data.error ?? 'Errore durante la pubblicazione'); return; }

      // Invia feedback AI se ci sono stati suggerimenti
      if (aiSuggestions.size > 0) {
        const aiNames = new Set(aiSuggestions.keys());
        const confirmed = Array.from(aiNames).filter((n) => selectedRicambi.has(n));
        const rejected = Array.from(aiNames).filter((n) => !selectedRicambi.has(n));
        const addedManually = Array.from(selectedRicambi).filter((n) => !aiNames.has(n));
        const firstFotoUrl = fotos.find((f) => f.url)?.url;
        if (firstFotoUrl) {
          fetch('/api/ai-feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fotoUrl: firstFotoUrl,
              veicoloId: data.id ?? null,
              confirmed,
              rejected,
              addedManually,
            }),
          }).catch(() => { /* feedback non bloccante */ });
        }
      }

      fotos.forEach((f) => URL.revokeObjectURL(f.preview));
      setForm(initialForm);
      setVersione('');
      setTargaFound(false);
      setSelectedRicambi(new Set());
      setAiSuggestions(new Map());
      setCopertinaId(null);
      setFotos([]);
      setAperto(false);
      router.refresh();
    } catch {
      setServerError('Impossibile contattare il server. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  const uploadingCount = fotos.filter((f) => f.url === null && f.error === null).length;

  /* ── AI rileva auto + ricambi ── */
  const rilevaAuto = async () => {
    const urls = fotos.filter((f) => f.url).map((f) => f.url!);
    if (urls.length === 0) { setAiError('Carica almeno una foto prima di usare il rilevamento automatico.'); return; }
    setAiLoading(true);
    setAiError('');
    setAiSuccess('');
    try {
      const res = await fetch('/api/rileva-ricambi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fotoUrls: urls, mode: 'completo' }),
      });
      const data = await res.json();
      if (!res.ok) { setAiError(data.error ?? 'Errore durante l\'analisi'); return; }

      const risultati: string[] = [];

      if (data.veicolo && data.veicolo.marca) {
        const aiMarca = MARCHE.find(
          (m) => m.toLowerCase() === data.veicolo.marca.toLowerCase()
        ) ?? data.veicolo.marca;
        setForm((prev) => ({
          ...prev,
          marca: aiMarca,
          modello: data.veicolo.modello || prev.modello,
          anno: data.veicolo.anno ? String(data.veicolo.anno) : prev.anno,
        }));
        risultati.push(`${aiMarca} ${data.veicolo.modello}${data.veicolo.anno ? ` (${data.veicolo.anno})` : ''}`);
      }

      if (data.ricambi && data.ricambi.length > 0) {
        const newSuggestions = new Map<string, number>();
        data.ricambi.forEach((r: string) => newSuggestions.set(r, 1));
        setAiSuggestions(newSuggestions);
        setSelectedRicambi((prev) => {
          const next = new Set(prev);
          data.ricambi.forEach((r: string) => next.add(r));
          return next;
        });
        risultati.push(`${data.ricambi.length} ricambi rilevati`);
      }

      if (risultati.length > 0) {
        setAiSuccess(`Rilevato: ${risultati.join(' — ')}`);
      } else {
        setAiError('Non sono riuscito a identificare il veicolo. Prova con foto piu chiare.');
      }
    } catch {
      setAiError('Errore di rete. Riprova.');
    } finally {
      setAiLoading(false);
    }
  };

  const inputCls = (field: keyof FormErrors) =>
    `w-full px-3 py-2 rounded-lg border text-sm ${
      errors[field]
        ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
        : 'border-gray-200 focus:border-[#003580] focus:ring-[#003580]/20'
    } focus:ring-2 text-gray-700 bg-white`;

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <form onSubmit={handleSubmit} noValidate className="p-6 space-y-8">
          {serverError && (
            <div className="mx-6 mt-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
              </svg>
              {serverError}
            </div>
          )}

          {/* ═══ ROW 1: Foto + Identificazione ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 p-6">

            {/* ── Colonna SX: Foto ── */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Foto del veicolo</h3>
                <span className="text-xs text-gray-400">{fotos.length}/{MAX_FOTO}</span>
              </div>

              {/* Upload area */}
              {fotos.length < MAX_FOTO && (
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-lg py-6 hover:border-[#003580]/40 hover:bg-[#003580]/5 transition-colors cursor-pointer">
                  <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-sm text-gray-400">
                    Aggiungi foto <span className="text-gray-300 hidden sm:inline">(max 5 MB)</span>
                  </span>
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
                multiple className="hidden" onChange={(e) => handleFilesSelected(e.target.files)} />

              {/* Griglia foto — drag & drop per riordinare */}
              {fotos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {fotos.map((foto) => {
                    const isCopertina = foto.id === getCopertinaId();
                    const isDragging = foto.id === dragId;
                    const isDragOver = foto.id === dragOverId && dragId !== foto.id;
                    return (
                      <div
                        key={foto.id}
                        draggable
                        onDragStart={() => handleDragStart(foto.id)}
                        onDragOver={(e) => handleDragOver(e, foto.id)}
                        onDrop={() => handleDrop(foto.id)}
                        onDragEnd={handleDragEnd}
                        className={`relative group rounded-lg overflow-hidden bg-gray-100 cursor-grab active:cursor-grabbing transition-all
                          ${isCopertina ? 'col-span-3 aspect-[16/9] ring-2 ring-[#FF6600]' : 'aspect-square'}
                          ${isDragging ? 'opacity-40 scale-95' : ''}
                          ${isDragOver ? 'ring-2 ring-[#003580] ring-offset-1' : ''}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={foto.preview} alt="" className="w-full h-full object-cover pointer-events-none" />

                        {/* Loading */}
                        {foto.url === null && foto.error === null && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                          </div>
                        )}

                        {/* Error */}
                        {foto.error && (
                          <div className="absolute inset-0 bg-red-900/60 flex items-center justify-center p-1">
                            <span className="text-white text-[10px] text-center leading-tight">{foto.error}</span>
                          </div>
                        )}

                        {/* Copertina badge */}
                        {isCopertina && (
                          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-[#FF6600] rounded text-[9px] font-bold text-white leading-none">
                            COPERTINA
                          </div>
                        )}

                        {/* Controls overlay - visible on hover */}
                        <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!isCopertina && (
                            <button type="button" onClick={() => setCopertinaId(foto.id)}
                              className="w-6 h-6 bg-black/50 hover:bg-[#FF6600] rounded-full flex items-center justify-center" title="Imposta come copertina">
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                              </svg>
                            </button>
                          )}
                          <button type="button" onClick={() => removeFoto(foto.id)}
                            className="w-6 h-6 bg-black/50 hover:bg-red-500 rounded-full flex items-center justify-center" title="Rimuovi">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Bottone AI */}
              {fotos.filter((f) => f.url).length > 0 && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={rilevaAuto}
                    disabled={aiLoading || uploadingCount > 0}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#003580] text-white rounded-lg text-sm font-medium hover:bg-[#002a66] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {aiLoading ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Analisi in corso...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Rileva auto e ricambi con AI
                      </>
                    )}
                  </button>
                  {aiError && <p className="text-xs text-red-600 mt-1.5">{aiError}</p>}
                  {aiSuccess && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-green-700 bg-green-50 rounded-lg px-3 py-1.5">
                      <svg className="w-3 h-3 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {aiSuccess}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Colonna DX: Targa + Dati principali ── */}
            <div className="lg:col-span-3 space-y-5">
              {/* Targa — campo unico con bottone cerca */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Targa
                  <span className="ml-1.5 text-xs font-normal text-gray-400">(opzionale)</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    name="targa"
                    value={form.targa}
                    onChange={handleChange}
                    maxLength={7}
                    autoComplete="off"
                    placeholder="AB123CD"
                    className={`w-44 px-3 py-2.5 rounded-lg border font-mono tracking-widest text-base font-semibold ${
                      errors.targa
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                        : 'border-gray-200 focus:border-[#003580] focus:ring-[#003580]/20'
                    } focus:ring-2 text-gray-700 bg-white uppercase`}
                    style={{ textTransform: 'uppercase' }}
                  />
                  <RicercaTarga
                    onResult={handleTargaResult}
                    onClear={handleTargaClear}
                    usate={usate}
                    max={targaMax}
                    onLookupSuccess={() => setUsate((n) => n + 1)}
                    targaValue={form.targa}
                  />
                </div>
                {errors.targa && <p className="mt-1 text-xs text-red-600">{errors.targa}</p>}
                {targaFound && versione ? (
                  <p className="mt-1.5 text-xs text-green-600 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Dati compilati automaticamente — {versione}
                  </p>
                ) : (
                  <p className="mt-1.5 text-xs text-gray-400">
                    Inserisci la targa e clicca &quot;Cerca dati&quot; per compilare automaticamente, oppure compila marca e modello manualmente
                  </p>
                )}
              </div>

              {/* Dati veicolo - griglia compatta */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Dati del veicolo</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Marca *</label>
                    <select
                      name="marca"
                      value={form.marca}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, marca: e.target.value, modello: '' }));
                        setErrors((prev) => ({ ...prev, marca: undefined }));
                      }}
                      className={inputCls('marca')}
                    >
                      <option value="">Seleziona</option>
                      {MARCHE.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                    {errors.marca && <p className="mt-0.5 text-xs text-red-600">{errors.marca}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Modello *</label>
                    <select
                      name="modello"
                      value={form.modello}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, modello: e.target.value }));
                        setErrors((prev) => ({ ...prev, modello: undefined }));
                      }}
                      disabled={!form.marca}
                      className={`${inputCls('modello')} ${!form.marca ? 'bg-gray-50 text-gray-400' : ''}`}
                    >
                      <option value="">Seleziona</option>
                      {modelliDisponibili.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                    {errors.modello && <p className="mt-0.5 text-xs text-red-600">{errors.modello}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Anno *</label>
                    <input type="number" name="anno" value={form.anno} onChange={handleChange}
                      min={1900} max={ANNO_CORRENTE + 1}
                      className={inputCls('anno')} placeholder={String(ANNO_CORRENTE - 5)} />
                    {errors.anno && <p className="mt-0.5 text-xs text-red-600">{errors.anno}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Km *</label>
                    <input type="number" name="km" value={form.km} onChange={handleChange}
                      min={0} className={inputCls('km')} placeholder="120000" />
                    {errors.km && <p className="mt-0.5 text-xs text-red-600">{errors.km}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Carburante</label>
                    <select
                      name="carburante"
                      value={form.carburante}
                      onChange={(e) => setForm((prev) => ({ ...prev, carburante: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#003580] focus:ring-[#003580]/20 focus:ring-2 text-sm text-gray-700 bg-white"
                    >
                      <option value="">—</option>
                      {CARBURANTI.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Cilindrata (cc)</label>
                    <input type="text" name="cilindrata" value={form.cilindrata} onChange={handleChange}
                      className={inputCls('cilindrata')} placeholder="1300" />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Potenza (kW)</label>
                    <input type="number" name="potenzaKw" value={form.potenzaKw} onChange={handleChange}
                      min={0} className={inputCls('potenzaKw')} placeholder="68" />
                    {form.potenzaKw && Number(form.potenzaKw) > 0 && (
                      <p className="mt-0.5 text-xs text-gray-400">{Math.round(Number(form.potenzaKw) * 1.36)} CV</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Sigla motore</label>
                    <input type="text" name="siglaMotore" value={form.siglaMotore} onChange={handleChange}
                      className={inputCls('siglaMotore')} placeholder="M13A" />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Versione</label>
                    <input type="text" value={versione} onChange={(e) => setVersione(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#003580] focus:ring-[#003580]/20 focus:ring-2 text-sm text-gray-700"
                      placeholder="1.3 CDTI Sport" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ═══ ROW 2: Foto sticky + Ricambi ═══ */}
          <div className="px-6 pb-6">
            <div className="border-t border-gray-100 pt-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700">Ricambi disponibili</h3>
                <span className="text-xs text-gray-400">
                  {selectedRicambi.size} selezionat{selectedRicambi.size === 1 ? 'o' : 'i'}
                  {aiSuggestions.size > 0 && (
                    <span className="ml-2 text-[#1a5f96]">({aiSuggestions.size} suggeriti AI)</span>
                  )}
                </span>
              </div>

              <div className="flex gap-6">
                {/* Foto sticky a sinistra — visibile mentre scrolli i ricambi */}
                {fotos.length > 0 && (
                  <div className="hidden lg:block w-96 shrink-0">
                    <div className="sticky top-20 space-y-2">
                      {/* Foto principale con navigazione */}
                      <div className="relative rounded-lg overflow-hidden bg-gray-100 aspect-[4/3]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={fotos[previewFotoIdx]?.preview ?? fotos[0]?.preview}
                          alt="Foto veicolo"
                          className="w-full h-full object-cover"
                        />
                        {/* Frecce navigazione */}
                        {fotos.length > 1 && (
                          <>
                            <button type="button"
                              onClick={() => setPreviewFotoIdx((i) => (i - 1 + fotos.length) % fotos.length)}
                              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                              </svg>
                            </button>
                            <button type="button"
                              onClick={() => setPreviewFotoIdx((i) => (i + 1) % fotos.length)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded">
                              {previewFotoIdx + 1} / {fotos.length}
                            </div>
                          </>
                        )}
                      </div>
                      {/* Miniature cliccabili */}
                      {fotos.length > 1 && (
                        <div className="flex gap-1.5 overflow-x-auto pb-1">
                          {fotos.map((f, i) => (
                            <button key={f.id} type="button"
                              onClick={() => setPreviewFotoIdx(i)}
                              className={`w-14 h-14 rounded overflow-hidden bg-gray-100 shrink-0 border-2 transition-colors ${
                                i === previewFotoIdx ? 'border-[#1a5f96]' : 'border-transparent hover:border-gray-300'
                              }`}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={f.preview} alt="" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                      <p className="text-[11px] text-gray-400 text-center">
                        Scorri le foto per selezionare i ricambi visibili
                      </p>
                    </div>
                  </div>
                )}

                {/* Griglia ricambi */}
                <div className="flex-1 min-w-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {RICAMBI_GRUPPI.map(({ categoria, voci }) => {
                  const tuttiSelezionati = voci.every((v) => selectedRicambi.has(v));
                  const alcuniSelezionati = voci.some((v) => selectedRicambi.has(v));
                  return (
                    <div key={categoria} className="border border-gray-100 rounded-lg p-3">
                      <button type="button" onClick={() => toggleCategoria(voci)}
                        className="flex items-center gap-2 w-full mb-2 pb-2 border-b border-gray-50">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          tuttiSelezionati ? 'bg-[#1a5f96] border-[#1a5f96]'
                            : alcuniSelezionati ? 'bg-[#1a5f96]/30 border-[#1a5f96]/50' : 'border-gray-300'
                        }`}>
                          {(tuttiSelezionati || alcuniSelezionati) && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3}
                                d={tuttiSelezionati ? 'M5 13l4 4L19 7' : 'M5 12h14'} />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm font-semibold text-gray-800">{categoria}</span>
                        <span className="ml-auto text-[10px] text-gray-400">
                          {voci.filter((v) => selectedRicambi.has(v)).length}/{voci.length}
                        </span>
                      </button>
                      <div className="space-y-1.5">
                        {voci.map((voce) => (
                          <label key={voce} className="flex items-center gap-2 cursor-pointer group py-0.5">
                            <input type="checkbox" checked={selectedRicambi.has(voce)}
                              onChange={() => toggleRicambio(voce)} className="w-4 h-4 accent-[#1a5f96] shrink-0" />
                            <span className="text-[13px] text-gray-600 group-hover:text-gray-900 leading-snug">{voce}</span>
                            {aiSuggestions.has(voce) && (
                              <span className="shrink-0 px-1.5 py-0.5 rounded bg-[#1a5f96]/10 text-[#1a5f96] text-[10px] font-semibold">
                                AI
                              </span>
                            )}
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
                </div>
              </div>
            </div>
          </div>

          {/* ═══ FOOTER: Submit ═══ */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400 hidden sm:block">
              {uploadingCount > 0 && `${uploadingCount} foto in caricamento...`}
            </p>
            <button
              type="submit"
              disabled={loading || uploadingCount > 0}
              className="px-6 py-2.5 bg-[#FF6600] text-white rounded-lg text-sm font-semibold hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 transition-colors ml-auto"
            >
              {(loading || uploadingCount > 0) && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
              {loading ? 'Pubblicazione...' : uploadingCount > 0 ? 'Caricamento foto...' : 'Pubblica veicolo'}
            </button>
          </div>
        </form>
    </div>
  );
}
