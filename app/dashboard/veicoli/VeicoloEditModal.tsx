'use client';

import { useEffect, useRef, useState } from 'react';
import { RICAMBI_GRUPPI } from '../../../lib/ricambi';
import { MARCHE } from '../../../lib/veicoli-db';

const ANNO_CORRENTE = new Date().getFullYear();
const MAX_FOTO = 10;

const CARBURANTI = ['Benzina', 'Diesel', 'Ibrido', 'Ibrido Plug-in', 'Elettrico', 'GPL', 'Metano', 'Benzina/GPL', 'Benzina/Metano'];

type FotoItem = {
  id: string;
  dbId?: number;      // ID nel database (solo per foto esistenti)
  preview: string;   // URL R2 (esistente) oppure object URL (nuova)
  url: string | null; // null = upload in corso
  file?: File;
  error: string | null;
  copertina: boolean;
};

interface VeicoloData {
  id: number;
  marca: string;
  modello: string;
  anno: number;
  targa: string;
  km: number;
  versione?: string | null;
  cilindrata?: string | null;
  siglaMotore?: string | null;
  carburante?: string | null;
  potenzaKw?: number | null;
  foto: { id: number; url: string; copertina: boolean }[];
  ricambi: { id: number; nome: string; disponibile: boolean }[];
}

interface Props {
  veicolo: VeicoloData;
  onClose: () => void;
  onSaved: () => void;
}

const initialFormFrom = (v: VeicoloData) => ({
  marca: v.marca,
  modello: v.modello,
  anno: String(v.anno),
  targa: v.targa,
  km: String(v.km),
  cilindrata: v.cilindrata ?? '',
  siglaMotore: v.siglaMotore ?? '',
  carburante: v.carburante ?? '',
  potenzaKw: v.potenzaKw != null ? String(v.potenzaKw) : '',
});

type FormState = ReturnType<typeof initialFormFrom>;
type FormErrors = Partial<FormState>;

export default function VeicoloEditModal({ veicolo, onClose, onSaved }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<FormState>(initialFormFrom(veicolo));
  const [versione, setVersione] = useState(veicolo.versione ?? '');
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [modelliDisponibili, setModelliDisponibili] = useState<string[]>([]);

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

  // Foto: le esistenti partono già "uploaded"
  const [fotos, setFotos] = useState<FotoItem[]>(() =>
    veicolo.foto.map((f) => ({
      id: `ex-${f.id}`,
      dbId: f.id,
      preview: f.url,
      url: f.url,
      error: null,
      copertina: f.copertina,
    })),
  );

  // Ricambi pre-selezionati
  const [selectedRicambi, setSelectedRicambi] = useState<Set<string>>(
    () => new Set(veicolo.ricambi.filter((r) => r.disponibile).map((r) => r.nome)),
  );

  // Blocca scroll body mentre il modal è aperto
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  /* ── handlers form ── */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  /* ── handlers ricambi ── */
  const toggleRicambio = (nome: string) =>
    setSelectedRicambi((prev) => {
      const next = new Set(prev);
      next.has(nome) ? next.delete(nome) : next.add(nome);
      return next;
    });

  const toggleCategoria = (voci: readonly string[]) => {
    const tutti = voci.every((v) => selectedRicambi.has(v));
    setSelectedRicambi((prev) => {
      const next = new Set(prev);
      tutti ? voci.forEach((v) => next.delete(v)) : voci.forEach((v) => next.add(v));
      return next;
    });
  };

  /* ── handlers foto ── */
  const uploadFoto = async (item: FotoItem) => {
    if (!item.file) return;
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
    const items: FotoItem[] = Array.from(files)
      .slice(0, slots)
      .map((file) => ({
        id: Math.random().toString(36).slice(2),
        preview: URL.createObjectURL(file),
        url: null,
        file,
        error: null,
        copertina: false,
      }));
    setFotos((prev) => [...prev, ...items]);
    items.forEach(uploadFoto);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const setCopertina = async (fotoItemId: string) => {
    const item = fotos.find((f) => f.id === fotoItemId);
    // Aggiorna lo stato locale
    setFotos((prev) => prev.map((f) => ({ ...f, copertina: f.id === fotoItemId })));
    // Se e' una foto esistente con dbId, chiama l'API
    if (item?.dbId) {
      await fetch(`/api/veicoli/${veicolo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fotoId: item.dbId }),
      });
    }
  };

  const removeFoto = (id: string) => {
    setFotos((prev) => {
      const item = prev.find((f) => f.id === id);
      // Revoca solo gli object URL (le foto nuove), non gli URL R2
      if (item?.file) URL.revokeObjectURL(item.preview);
      return prev.filter((f) => f.id !== id);
    });
  };

  /* ── validazione ── */
  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!form.marca.trim()) errs.marca = 'Campo obbligatorio';
    if (!form.modello.trim()) errs.modello = 'Campo obbligatorio';
    const anno = Number(form.anno);
    if (!form.anno || isNaN(anno) || anno < 1900 || anno > ANNO_CORRENTE + 1)
      errs.anno = `Anno non valido (1900 – ${ANNO_CORRENTE})`;
    if (!/^[A-Za-z]{2}\d{3}[A-Za-z]{2}$/.test(form.targa.trim()))
      errs.targa = 'Formato non valido (es. AB123CD)';
    const km = Number(form.km);
    if (!form.km || isNaN(km) || km < 0) errs.km = 'Chilometraggio non valido';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /* ── submit ── */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    const inCaricamento = fotos.filter((f) => f.url === null && f.error === null);
    if (inCaricamento.length > 0) { setServerError('Attendi il caricamento delle foto.'); return; }
    const conErrore = fotos.filter((f) => f.error !== null);
    if (conErrore.length > 0) { setServerError('Alcune foto non sono state caricate. Rimuovile e riprova.'); return; }

    setLoading(true);
    try {
      const res = await fetch(`/api/veicoli/${veicolo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marca: form.marca.trim(),
          modello: form.modello.trim(),
          anno: Number(form.anno),
          targa: form.targa.trim().toUpperCase(),
          km: Number(form.km),
          versione: versione || null,
          cilindrata: form.cilindrata.trim() || null,
          siglaMotore: form.siglaMotore.trim() || null,
          carburante: form.carburante || null,
          potenzaKw: form.potenzaKw ? Number(form.potenzaKw) : null,
          ricambi: Array.from(selectedRicambi),
          fotoUrls: fotos.filter((f) => f.url).map((f) => f.url!),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setServerError(data.error ?? 'Errore durante il salvataggio'); return; }
      // Cleanup object URLs foto nuove
      fotos.filter((f) => f.file).forEach((f) => URL.revokeObjectURL(f.preview));
      onSaved();
    } catch {
      setServerError('Impossibile contattare il server. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field: keyof FormErrors) =>
    `w-full px-4 py-3 rounded-lg border ${
      errors[field]
        ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
        : 'border-gray-200 focus:border-[#003580] focus:ring-[#003580]/20'
    } focus:ring-2 text-gray-700`;

  const uploadingCount = fotos.filter((f) => f.url === null && f.error === null).length;

  /* ── AI rileva ricambi ── */
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const rilevaRicambi = async () => {
    const urls = fotos.filter((f) => f.url).map((f) => f.url!);
    if (urls.length === 0) { setAiError('Carica almeno una foto.'); return; }
    setAiLoading(true);
    setAiError('');
    try {
      const res = await fetch('/api/rileva-ricambi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fotoUrls: urls, mode: 'ricambi' }),
      });
      const data = await res.json();
      if (!res.ok) { setAiError(data.error ?? 'Errore durante l\'analisi'); return; }
      if (data.ricambi && data.ricambi.length > 0) {
        setSelectedRicambi((prev) => {
          const next = new Set(prev);
          data.ricambi.forEach((r: string) => next.add(r));
          return next;
        });
      } else {
        setAiError('Nessun ricambio rilevato dalle foto.');
      }
    } catch {
      setAiError('Errore di rete. Riprova.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 overflow-y-auto flex items-start justify-center p-4 pt-8"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-3xl mb-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Modifica veicolo</h2>
            <p className="text-sm text-gray-400">{veicolo.marca} {veicolo.modello} — {veicolo.targa}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="px-6 pb-6 pt-5 space-y-6">
          {serverError && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
              </svg>
              {serverError}
            </div>
          )}

          {/* Dati veicolo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marca *</label>
              <select
                name="marca"
                value={form.marca}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, marca: e.target.value, modello: '' }));
                  setErrors((prev) => ({ ...prev, marca: undefined }));
                }}
                className={inputClass('marca')}
              >
                <option value="">Seleziona marca</option>
                {MARCHE.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              {errors.marca && <p className="mt-1 text-xs text-red-600">{errors.marca}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modello *</label>
              <select
                name="modello"
                value={form.modello}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, modello: e.target.value }));
                  setErrors((prev) => ({ ...prev, modello: undefined }));
                }}
                disabled={!form.marca}
                className={`${inputClass('modello')} ${!form.marca ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
              >
                <option value="">Seleziona modello</option>
                {modelliDisponibili.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              {errors.modello && <p className="mt-1 text-xs text-red-600">{errors.modello}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Anno *</label>
              <input type="number" name="anno" value={form.anno} onChange={handleChange}
                min={1900} max={ANNO_CORRENTE + 1} className={inputClass('anno')} />
              {errors.anno && <p className="mt-1 text-xs text-red-600">{errors.anno}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Targa *</label>
              <input type="text" name="targa" value={form.targa} onChange={handleChange}
                maxLength={7} className={inputClass('targa')} placeholder="AB123CD" />
              {errors.targa && <p className="mt-1 text-xs text-red-600">{errors.targa}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chilometri *</label>
              <input type="number" name="km" value={form.km} onChange={handleChange}
                min={0} className={inputClass('km')} placeholder="es. 120000" />
              {errors.km && <p className="mt-1 text-xs text-red-600">{errors.km}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cilindrata <span className="text-gray-400 font-normal text-xs">(cc)</span>
              </label>
              <input type="text" name="cilindrata" value={form.cilindrata} onChange={handleChange}
                className={inputClass('cilindrata')} placeholder="es. 1300" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Carburante</label>
              <select
                name="carburante"
                value={form.carburante}
                onChange={(e) => setForm((prev) => ({ ...prev, carburante: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#003580] focus:ring-[#003580]/20 focus:ring-2 text-gray-700 bg-white"
              >
                <option value="">— seleziona —</option>
                {CARBURANTI.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Potenza <span className="text-gray-400 font-normal text-xs">(kW)</span>
              </label>
              <input type="number" name="potenzaKw" value={form.potenzaKw} onChange={handleChange}
                min={0} className={inputClass('potenzaKw')} placeholder="es. 68" />
              {form.potenzaKw && Number(form.potenzaKw) > 0 && (
                <p className="mt-1 text-xs text-gray-400">{Math.round(Number(form.potenzaKw) * 1.36)} CV</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sigla motore</label>
              <input type="text" name="siglaMotore" value={form.siglaMotore} onChange={handleChange}
                className={inputClass('siglaMotore')} placeholder="es. M13A" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Versione</label>
              <input type="text" value={versione} onChange={(e) => setVersione(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#003580] focus:ring-[#003580]/20 focus:ring-2 text-gray-700"
                placeholder="es. 1.3 CDTI Sport" />
            </div>
          </div>

          {/* Foto */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">
                Foto <span className="text-gray-400 font-normal">(max {MAX_FOTO})</span>
              </h3>
              <span className="text-xs text-gray-400">
                {fotos.length}/{MAX_FOTO}
                {uploadingCount > 0 && ` · ${uploadingCount} in caricamento…`}
              </span>
            </div>

            {fotos.length < MAX_FOTO && (
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-1 border-2 border-dashed border-gray-200 rounded-lg py-5 hover:border-[#003580]/30 hover:bg-[#003580]/5 transition-colors mb-3">
                <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M4 16l4-4a2 2 0 012.83 0L14 15m2-2l1.17-1.17a2 2 0 012.83 0L22 14M14 8a2 2 0 11-4 0 2 2 0 014 0zM3 20h18a1 1 0 001-1V5a1 1 0 00-1-1H3a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
                <span className="text-xs text-gray-400">Aggiungi foto</span>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
              multiple className="hidden" onChange={(e) => handleFilesSelected(e.target.files)} />

            {fotos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {fotos.map((foto) => (
                  <div key={foto.id} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={foto.preview} alt="" className="w-full h-full object-cover" />
                    {foto.url === null && foto.error === null && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                      </div>
                    )}
                    {foto.error && (
                      <div className="absolute inset-0 bg-red-900/60 flex items-center justify-center p-1">
                        <span className="text-white text-xs text-center leading-tight">{foto.error}</span>
                      </div>
                    )}
                    {foto.url && (
                      <div className="absolute top-1 left-1 flex gap-1">
                        <button type="button" onClick={() => setCopertina(foto.id)}
                          title={foto.copertina ? 'Foto copertina' : 'Imposta come copertina'}
                          className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                            foto.copertina
                              ? 'bg-[#FF6600] text-white'
                              : 'bg-black/40 text-white/70 hover:bg-[#FF6600] hover:text-white'
                          }`}>
                          <svg className="w-3 h-3" fill={foto.copertina ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </button>
                      </div>
                    )}
                    <button type="button" onClick={() => removeFoto(foto.id)}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ricambi */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">Ricambi disponibili</h3>
              <span className="text-xs text-gray-400">
                {selectedRicambi.size} selezionat{selectedRicambi.size === 1 ? 'o' : 'i'}
              </span>
            </div>

            <div className="mb-4">
              <button
                type="button"
                onClick={rilevaRicambi}
                disabled={aiLoading || fotos.filter((f) => f.url).length === 0}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#003580] to-[#0052cc] text-white rounded-lg text-sm font-semibold hover:from-[#002a66] hover:to-[#0047b3] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {aiLoading ? (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                )}
                {aiLoading ? 'Analisi in corso...' : 'Rileva ricambi dalle foto'}
              </button>
              {aiError && <p className="text-xs text-red-600 mt-1.5">{aiError}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {RICAMBI_GRUPPI.map(({ categoria, voci }) => {
                const tutti = voci.every((v) => selectedRicambi.has(v));
                const alcuni = voci.some((v) => selectedRicambi.has(v));
                return (
                  <div key={categoria} className="border border-gray-100 rounded-lg p-3">
                    <button type="button" onClick={() => toggleCategoria(voci)}
                      className="flex items-center gap-2 w-full mb-2">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        tutti ? 'bg-[#003580] border-[#003580]' : alcuni ? 'bg-[#003580]/30 border-[#003580]/50' : 'border-gray-300'
                      }`}>
                        {(tutti || alcuni) && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3}
                              d={tutti ? 'M5 13l4 4L19 7' : 'M5 12h14'} />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-gray-700">{categoria}</span>
                    </button>
                    <div className="space-y-1 pl-1">
                      {voci.map((voce) => (
                        <label key={voce} className="flex items-center gap-2 cursor-pointer group">
                          <input type="checkbox" checked={selectedRicambi.has(voce)}
                            onChange={() => toggleRicambio(voce)} className="w-4 h-4 accent-[#003580]" />
                          <span className="text-sm text-gray-600 group-hover:text-gray-900">{voce}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
              Annulla
            </button>
            <button type="submit" disabled={loading || uploadingCount > 0}
              className="px-5 py-2.5 bg-[#FF6600] text-white rounded-lg text-sm font-semibold hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 transition-colors">
              {(loading || uploadingCount > 0) && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
              {loading ? 'Salvataggio…' : uploadingCount > 0 ? 'Caricamento foto…' : 'Salva modifiche'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
