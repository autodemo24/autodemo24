'use client';

import { useEffect, useRef, useState } from 'react';
import { RICAMBI_GRUPPI } from '../../../lib/ricambi';

const ANNO_CORRENTE = new Date().getFullYear();
const MAX_FOTO = 10;

type FotoItem = {
  id: string;
  preview: string;   // URL R2 (esistente) oppure object URL (nuova)
  url: string | null; // null = upload in corso
  file?: File;
  error: string | null;
};

interface VeicoloData {
  id: number;
  marca: string;
  modello: string;
  anno: number;
  targa: string;
  km: number;
  foto: { id: number; url: string }[];
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
});

type FormState = ReturnType<typeof initialFormFrom>;
type FormErrors = Partial<FormState>;

export default function VeicoloEditModal({ veicolo, onClose, onSaved }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<FormState>(initialFormFrom(veicolo));
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  // Foto: le esistenti partono già "uploaded"
  const [fotos, setFotos] = useState<FotoItem[]>(() =>
    veicolo.foto.map((f) => ({
      id: `ex-${f.id}`,
      preview: f.url,
      url: f.url,
      error: null,
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
      }));
    setFotos((prev) => [...prev, ...items]);
    items.forEach(uploadFoto);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
        : 'border-gray-200 focus:border-red-500 focus:ring-red-200'
    } focus:ring-2 text-gray-700`;

  const uploadingCount = fotos.filter((f) => f.url === null && f.error === null).length;

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
              <input type="text" name="marca" value={form.marca} onChange={handleChange}
                className={inputClass('marca')} placeholder="es. Fiat" />
              {errors.marca && <p className="mt-1 text-xs text-red-600">{errors.marca}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modello *</label>
              <input type="text" name="modello" value={form.modello} onChange={handleChange}
                className={inputClass('modello')} placeholder="es. Punto" />
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
                className="w-full flex flex-col items-center justify-center gap-1 border-2 border-dashed border-gray-200 rounded-lg py-5 hover:border-red-300 hover:bg-red-50 transition-colors mb-3">
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
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
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
                      <div className="absolute top-1 left-1">
                        <span className="inline-flex items-center justify-center w-4 h-4 bg-green-500 rounded-full">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {RICAMBI_GRUPPI.map(({ categoria, voci }) => {
                const tutti = voci.every((v) => selectedRicambi.has(v));
                const alcuni = voci.some((v) => selectedRicambi.has(v));
                return (
                  <div key={categoria} className="border border-gray-100 rounded-lg p-3">
                    <button type="button" onClick={() => toggleCategoria(voci)}
                      className="flex items-center gap-2 w-full mb-2">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        tutti ? 'bg-red-600 border-red-600' : alcuni ? 'bg-red-200 border-red-400' : 'border-gray-300'
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
                            onChange={() => toggleRicambio(voce)} className="w-4 h-4 accent-red-600" />
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
              className="px-5 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2">
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
