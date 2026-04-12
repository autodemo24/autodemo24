'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import RicercaTarga, { type TargaResult } from '../../../components/RicercaTarga';

const RICAMBI_GRUPPI = [
  {
    categoria: 'Meccanica',
    voci: [
      'Motore completo', 'Cambio', 'Radiatore', 'Alternatore',
      'Motorino di avviamento', 'Compressore AC', 'Pompa carburante', 'Marmitta / Scarico',
    ],
  },
  {
    categoria: 'Carrozzeria',
    voci: [
      'Cofano', 'Paraurti anteriore', 'Paraurti posteriore',
      'Parafango ant. sinistro', 'Parafango ant. destro',
      'Portiera ant. sinistra', 'Portiera ant. destra',
      'Portiera post. sinistra', 'Portiera post. destra',
    ],
  },
  {
    categoria: 'Illuminazione',
    voci: [
      'Faro ant. sinistro', 'Faro ant. destro',
      'Fanale post. sinistro', 'Fanale post. destro',
      'Specchietto sinistro', 'Specchietto destro',
    ],
  },
  {
    categoria: 'Vetri',
    voci: ['Parabrezza', 'Lunotto', 'Cristallo lat. sinistro', 'Cristallo lat. destro'],
  },
  {
    categoria: 'Interni',
    voci: [
      'Cruscotto completo', 'Volante', 'Sedile ant. sinistro', 'Sedile ant. destro',
      'Sedili posteriori', 'Airbag volante', 'Airbag passeggero', 'Centralina ECU',
    ],
  },
  {
    categoria: 'Ruote e freni',
    voci: [
      'Sospensioni anteriori', 'Sospensioni posteriori',
      'Freni anteriori', 'Freni posteriori',
      'Cerchi in lega', 'Pneumatici',
    ],
  },
];

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleTargaResult = (result: TargaResult) => {
    setForm((prev) => ({
      ...prev,
      targa:       result.targa,
      marca:       result.marca,
      modello:     result.modello,
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

  const toggleCategoria = (voci: string[]) => {
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
  };

  /* ── validazione ── */
  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.marca.trim()) newErrors.marca = 'Campo obbligatorio';
    if (!form.modello.trim()) newErrors.modello = 'Campo obbligatorio';
    const anno = Number(form.anno);
    if (!form.anno || isNaN(anno) || anno < 1900 || anno > ANNO_CORRENTE + 1) {
      newErrors.anno = `Anno non valido (1900 – ${ANNO_CORRENTE})`;
    }
    if (!/^[A-Za-z]{2}\d{3}[A-Za-z]{2}$/.test(form.targa.trim())) {
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
          fotoUrls:    fotos.filter((f) => f.url).map((f) => f.url!),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setServerError(data.error ?? 'Errore durante la pubblicazione'); return; }

      fotos.forEach((f) => URL.revokeObjectURL(f.preview));
      setForm(initialForm);
      setVersione('');
      setTargaFound(false);
      setSelectedRicambi(new Set());
      setFotos([]);
      setAperto(false);
      router.refresh();
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
    <div className="bg-white rounded-xl shadow-sm mb-8">
      {/* Header collassabile */}
      <button
        type="button"
        onClick={() => setAperto((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-5 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="text-lg font-semibold text-gray-800">Pubblica un nuovo veicolo</span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${aperto ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {aperto && (
        <form onSubmit={handleSubmit} noValidate className="px-6 pb-6 border-t border-gray-100 pt-6 space-y-8">
          {serverError && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
              </svg>
              {serverError}
            </div>
          )}

          {/* ── SEZIONE 1: Ricerca automatica per targa ── */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-blue-800">Ricerca automatica per targa</h3>
                <p className="text-xs text-blue-600 mt-0.5">
                  Digita la targa per compilare automaticamente marca, modello, anno e dati tecnici
                </p>
              </div>
            </div>

            <RicercaTarga
              onResult={handleTargaResult}
              onClear={handleTargaClear}
              usate={usate}
              max={targaMax}
              onLookupSuccess={() => setUsate((n) => n + 1)}
            />

            {/* Risultato trovato */}
            {targaFound && versione && (
              <div className="mt-3 flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                <svg className="w-3.5 h-3.5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span><span className="font-medium">Versione rilevata:</span> {versione}</span>
              </div>
            )}
          </div>

          {/* ── SEZIONE 2: Dati veicolo ── */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 text-xs flex items-center justify-center font-bold">2</span>
              Dati del veicolo
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
                  min={1900} max={ANNO_CORRENTE + 1}
                  className={inputClass('anno')} placeholder={`es. ${ANNO_CORRENTE - 5}`} />
                {errors.anno && <p className="mt-1 text-xs text-red-600">{errors.anno}</p>}
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
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-red-500 focus:ring-red-200 focus:ring-2 text-gray-700 bg-white"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Versione <span className="text-gray-400 font-normal text-xs">(allestimento)</span>
                </label>
                <input type="text" value={versione} onChange={(e) => setVersione(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-red-500 focus:ring-red-200 focus:ring-2 text-gray-700"
                  placeholder="es. 1.3 CDTI Sport" />
              </div>
            </div>
          </div>

          {/* ── SEZIONE 3: Foto ── */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 text-xs flex items-center justify-center font-bold">3</span>
              Foto
              <span className="text-gray-400 font-normal text-xs">(max {MAX_FOTO})</span>
              <span className="ml-auto text-xs text-gray-400 font-normal">
                {fotos.length}/{MAX_FOTO}
                {uploadingCount > 0 && ` · ${uploadingCount} in caricamento…`}
              </span>
            </h3>

            {fotos.length < MAX_FOTO && (
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-lg py-8 hover:border-red-300 hover:bg-red-50 transition-colors mb-4">
                <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M4 16l4-4a2 2 0 012.83 0L14 15m2-2l1.17-1.17a2 2 0 012.83 0L22 14M14 8a2 2 0 11-4 0 2 2 0 014 0zM3 20h18a1 1 0 001-1V5a1 1 0 00-1-1H3a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
                <span className="text-sm text-gray-400">
                  Clicca per selezionare foto <span className="text-gray-300">(jpeg, png, webp · max 5 MB)</span>
                </span>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
              multiple className="hidden" onChange={(e) => handleFilesSelected(e.target.files)} />

            {fotos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {fotos.map((foto) => (
                  <div key={foto.id} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={foto.preview} alt="" className="w-full h-full object-cover" />
                    {foto.url === null && foto.error === null && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <svg className="animate-spin w-6 h-6 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                      </div>
                    )}
                    {foto.error && (
                      <div className="absolute inset-0 bg-red-900/60 flex flex-col items-center justify-center gap-1 p-1">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className="text-white text-xs text-center leading-tight">{foto.error}</span>
                      </div>
                    )}
                    {foto.url && (
                      <div className="absolute top-1 left-1">
                        <span className="inline-flex items-center justify-center w-5 h-5 bg-green-500 rounded-full">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      </div>
                    )}
                    <button type="button" onClick={() => removeFoto(foto.id)}
                      className="absolute top-1 right-1 w-6 h-6 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── SEZIONE 4: Ricambi ── */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 text-xs flex items-center justify-center font-bold">4</span>
              Ricambi disponibili
              <span className="ml-auto text-xs text-gray-400 font-normal">
                {selectedRicambi.size} selezionat{selectedRicambi.size === 1 ? 'o' : 'i'}
              </span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {RICAMBI_GRUPPI.map(({ categoria, voci }) => {
                const tuttiSelezionati = voci.every((v) => selectedRicambi.has(v));
                const alcuniSelezionati = voci.some((v) => selectedRicambi.has(v));
                return (
                  <div key={categoria} className="border border-gray-100 rounded-lg p-3">
                    <button type="button" onClick={() => toggleCategoria(voci)}
                      className="flex items-center gap-2 w-full mb-2">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        tuttiSelezionati ? 'bg-red-600 border-red-600'
                          : alcuniSelezionati ? 'bg-red-200 border-red-400' : 'border-gray-300'
                      }`}>
                        {(tuttiSelezionati || alcuniSelezionati) && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3}
                              d={tuttiSelezionati ? 'M5 13l4 4L19 7' : 'M5 12h14'} />
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

          {/* ── SEZIONE 5: Targa ── */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-amber-800">Targa del veicolo *</h3>
                <p className="text-xs text-amber-700 mt-0.5">
                  Anche senza usare la ricerca automatica, inserire la targa ti permette di ritrovare
                  il veicolo tra i tuoi annunci e di cancellarlo rapidamente una volta che l&apos;auto è stata demolita.
                </p>
              </div>
            </div>
            <input
              type="text"
              name="targa"
              value={form.targa}
              onChange={handleChange}
              maxLength={7}
              autoComplete="off"
              placeholder="AB123CD"
              className={`w-full sm:w-48 px-4 py-3 rounded-lg border font-mono tracking-widest text-lg font-semibold ${
                errors.targa
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                  : 'border-amber-200 focus:border-amber-400 focus:ring-amber-100'
              } focus:ring-2 text-gray-700 bg-white uppercase`}
              style={{ textTransform: 'uppercase' }}
            />
            {errors.targa && <p className="mt-1.5 text-xs text-red-600">{errors.targa}</p>}
            {form.targa && !errors.targa && /^[A-Za-z]{2}\d{3}[A-Za-z]{2}$/.test(form.targa) && (
              <p className="mt-1.5 text-xs text-amber-700">
                ✓ Targa valida
              </p>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading || uploadingCount > 0}
              className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {(loading || uploadingCount > 0) && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
              {loading ? 'Pubblicazione…' : uploadingCount > 0 ? 'Caricamento foto…' : 'Pubblica veicolo'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
