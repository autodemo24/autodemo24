'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PROVINCE } from '../../../lib/province';

interface InitialData {
  ragioneSociale: string;
  piva: string;
  email: string;
  telefono: string;
  indirizzo: string;
  cap: string | null;
  citta: string | null;
  provincia: string;
  descrizione: string;
}

interface FormState {
  ragioneSociale: string;
  telefono: string;
  indirizzo: string;
  cap: string;
  citta: string;
  provincia: string;
  descrizione: string;
}

type FormErrors = Partial<Omit<FormState, 'descrizione'>>;

export default function ProfiloForm({ initial }: { initial: InitialData }) {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    ragioneSociale: initial.ragioneSociale,
    telefono: initial.telefono,
    indirizzo: initial.indirizzo,
    cap: initial.cap ?? '',
    citta: initial.citta ?? '',
    provincia: initial.provincia,
    descrizione: initial.descrizione,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setSuccess(false);
  };

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!form.ragioneSociale.trim()) errs.ragioneSociale = 'Campo obbligatorio';
    if (!form.telefono.trim()) errs.telefono = 'Campo obbligatorio';
    if (!form.indirizzo.trim()) errs.indirizzo = 'Campo obbligatorio';
    if (!/^\d{5}$/.test(form.cap.trim())) errs.cap = 'CAP 5 cifre';
    if (!form.citta.trim()) errs.citta = 'Campo obbligatorio';
    if (!form.provincia) errs.provincia = 'Seleziona una provincia';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError('');
    setSuccess(false);
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/profilo', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ragioneSociale: form.ragioneSociale.trim(),
          telefono: form.telefono.trim(),
          indirizzo: form.indirizzo.trim(),
          cap: form.cap.trim(),
          citta: form.citta.trim(),
          provincia: form.provincia,
          descrizione: form.descrizione.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error ?? 'Errore durante il salvataggio');
        return;
      }

      setSuccess(true);
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
        : 'border-gray-200 focus:border-[#003580] focus:ring-[#003580]/20'
    } focus:ring-2 text-gray-700 bg-white`;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">

      {success && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Profilo aggiornato con successo.
        </div>
      )}

      {serverError && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
          </svg>
          {serverError}
        </div>
      )}

      {/* Dati non modificabili */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Dati fiscali</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">P. IVA</label>
            <div className="w-full px-4 py-3 rounded-lg border border-gray-100 bg-gray-50 text-gray-500 text-sm font-mono">
              {initial.piva}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Email di accesso</label>
            <div className="w-full px-4 py-3 rounded-lg border border-gray-100 bg-gray-50 text-gray-500 text-sm">
              {initial.email}
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">P. IVA ed email non sono modificabili. Contatta il supporto per cambiarle.</p>
      </div>

      {/* Dati aziendali modificabili */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Dati aziendali</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Ragione sociale *</label>
            <input
              type="text"
              name="ragioneSociale"
              value={form.ragioneSociale}
              onChange={handleChange}
              className={inputClass('ragioneSociale')}
              placeholder="es. Rossi Autodemolizioni s.r.l."
            />
            {errors.ragioneSociale && <p className="mt-1 text-xs text-red-600">{errors.ragioneSociale}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefono *</label>
            <input
              type="tel"
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              className={inputClass('telefono')}
              placeholder="es. 02 1234567"
            />
            {errors.telefono && <p className="mt-1 text-xs text-red-600">{errors.telefono}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Provincia *</label>
            <select
              name="provincia"
              value={form.provincia}
              onChange={handleChange}
              className={inputClass('provincia')}
            >
              <option value="">Seleziona provincia</option>
              {PROVINCE.map((p) => (
                <option key={p.code} value={p.code}>{p.code} — {p.name}</option>
              ))}
            </select>
            {errors.provincia && <p className="mt-1 text-xs text-red-600">{errors.provincia}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Indirizzo (via + civico) *</label>
            <input
              type="text"
              name="indirizzo"
              value={form.indirizzo}
              onChange={handleChange}
              className={inputClass('indirizzo')}
              placeholder="es. Via Roma 12"
            />
            {errors.indirizzo && <p className="mt-1 text-xs text-red-600">{errors.indirizzo}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CAP *</label>
            <input
              type="text"
              name="cap"
              value={form.cap}
              onChange={handleChange}
              maxLength={5}
              inputMode="numeric"
              pattern="\d{5}"
              className={inputClass('cap') + ' font-mono'}
              placeholder="20100"
            />
            {errors.cap && <p className="mt-1 text-xs text-red-600">{errors.cap}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Città *</label>
            <input
              type="text"
              name="citta"
              value={form.citta}
              onChange={handleChange}
              className={inputClass('citta')}
              placeholder="es. Milano"
            />
            {errors.citta && <p className="mt-1 text-xs text-red-600">{errors.citta}</p>}
          </div>

        </div>
      </div>

      {/* Descrizione piazzale */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-1">Descrizione piazzale</h2>
        <p className="text-sm text-gray-400 mb-4">Visibile pubblicamente agli acquirenti. Descrivi specializzazioni, orari, servizi offerti.</p>
        <textarea
          name="descrizione"
          value={form.descrizione}
          onChange={handleChange}
          rows={4}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#003580] focus:ring-2 focus:ring-[#003580]/20 text-gray-700 bg-white resize-none"
          placeholder="es. Specializzati in vetture europee, aperti dal lunedì al sabato 8-17..."
        />
      </div>

      {/* Salva */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-[#FF6600] text-white rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
        >
          {loading && (
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          )}
          {loading ? 'Salvataggio…' : 'Salva modifiche'}
        </button>
      </div>

    </form>
  );
}
