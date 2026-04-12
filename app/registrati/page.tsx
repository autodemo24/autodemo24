'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const provinces = [
  'Agrigento', 'Alessandria', 'Ancona', 'Aosta', 'Arezzo', 'Ascoli Piceno', 'Asti', 'Avellino', 'Bari', 'Barletta-Andria-Trani', 'Belluno', 'Benevento', 'Bergamo', 'Biella', 'Bologna', 'Bolzano', 'Brescia', 'Brindisi', 'Cagliari', 'Caltanissetta', 'Campobasso', 'Carbonia-Iglesias', 'Caserta', 'Catania', 'Catanzaro', 'Chieti', 'Como', 'Cosenza', 'Cremona', 'Crotone', 'Cuneo', 'Enna', 'Fermo', 'Ferrara', 'Firenze', 'Foggia', 'Forlì-Cesena', 'Frosinone', 'Genova', 'Gorizia', 'Grosseto', 'Imperia', 'Isernia', "L'Aquila", 'La Spezia', 'Latina', 'Lecce', 'Lecco', 'Livorno', 'Lodi', 'Lucca', 'Macerata', 'Mantova', 'Massa-Carrara', 'Matera', 'Medio Campidano', 'Messina', 'Milano', 'Modena', 'Monza e della Brianza', 'Napoli', 'Novara', 'Nuoro', 'Ogliastra', 'Olbia-Tempio', 'Oristano', 'Padova', 'Palermo', 'Parma', 'Pavia', 'Perugia', 'Pesaro e Urbino', 'Pescara', 'Piacenza', 'Pisa', 'Pistoia', 'Pordenone', 'Potenza', 'Prato', 'Ragusa', 'Ravenna', 'Reggio Calabria', 'Reggio Emilia', 'Rieti', 'Rimini', 'Roma', 'Rovigo', 'Salerno', 'Sassari', 'Savona', 'Siena', 'Siracusa', 'Sondrio', 'Taranto', 'Teramo', 'Terni', 'Torino', 'Trapani', 'Trento', 'Treviso', 'Trieste', 'Udine', 'Varese', 'Venezia', 'Verbano-Cusio-Ossola', 'Vercelli', 'Verona', 'Vibo Valentia', 'Vicenza', 'Viterbo'
];

type FormErrors = Partial<Record<keyof typeof initialFormData, string>>;

const initialFormData = {
  ragioneSociale: '',
  piva: '',
  nomeReferente: '',
  email: '',
  password: '',
  telefono: '',
  indirizzo: '',
  provincia: '',
  descrizionePiazzale: ''
};

function validateForm(data: typeof initialFormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.ragioneSociale.trim()) errors.ragioneSociale = 'Campo obbligatorio';
  if (!data.nomeReferente.trim()) errors.nomeReferente = 'Campo obbligatorio';
  if (!data.telefono.trim()) errors.telefono = 'Campo obbligatorio';
  if (!data.indirizzo.trim()) errors.indirizzo = 'Campo obbligatorio';
  if (!data.provincia) errors.provincia = 'Seleziona una provincia';
  if (!data.descrizionePiazzale.trim()) errors.descrizionePiazzale = 'Campo obbligatorio';

  if (!/^\d{11}$/.test(data.piva)) {
    errors.piva = 'La P.IVA deve contenere esattamente 11 cifre';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Inserisci un indirizzo email valido';
  }

  if (data.password.length < 8) {
    errors.password = 'La password deve essere di almeno 8 caratteri';
  }

  return errors;
}

export default function Registrati() {
  const router = useRouter();
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Rimuovi l'errore del campo non appena l'utente inizia a correggere
    if (errors[name as keyof typeof initialFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError('');

    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/registrati', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ragioneSociale: formData.ragioneSociale,
          piva: formData.piva,
          email: formData.email,
          password: formData.password,
          telefono: formData.telefono,
          indirizzo: formData.indirizzo,
          provincia: formData.provincia,
          descrizione: formData.descrizionePiazzale,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error ?? 'Errore durante la registrazione');
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch {
      setServerError('Impossibile contattare il server. Controlla la connessione e riprova.');
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = (field: keyof typeof initialFormData) =>
    `w-full px-4 py-3 rounded-lg border ${
      errors[field] ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-[#003580] focus:ring-[#003580]/20'
    } focus:ring-2 text-gray-700`;

  if (success) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm p-10 max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Registrazione completata!</h2>
          <p className="text-gray-500">Il tuo account è stato creato. Verrai reindirizzato alla pagina di accesso...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#003580] text-white">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-1">
            <span className="text-2xl font-bold text-white">auto</span>
            <span className="text-2xl font-bold text-[#FF6600]">demo24</span>
          </a>
          <div className="flex items-center gap-4">
            <a href="/login" className="text-sm text-white/80 hover:text-white">
              Accedi
            </a>
            <a href="/registrati" className="px-4 py-2 bg-[#FF6600] hover:bg-orange-600 text-white rounded-lg text-sm font-semibold transition-colors">
              Sei un demolitore? Registrati
            </a>
          </div>
        </div>
      </header>

      {/* Form di registrazione */}
      <section className="py-16 max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Registrazione Demolitore</h1>

        {serverError && (
          <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-lg">
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
            </svg>
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="bg-white rounded-xl shadow-sm p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div>
              <label htmlFor="ragioneSociale" className="block text-sm font-medium text-gray-700 mb-2">
                Ragione Sociale *
              </label>
              <input
                type="text"
                id="ragioneSociale"
                name="ragioneSociale"
                value={formData.ragioneSociale}
                onChange={handleChange}
                className={fieldClass('ragioneSociale')}
                placeholder="Inserisci la ragione sociale"
              />
              {errors.ragioneSociale && <p className="mt-1 text-sm text-red-600">{errors.ragioneSociale}</p>}
            </div>

            <div>
              <label htmlFor="piva" className="block text-sm font-medium text-gray-700 mb-2">
                P.IVA *
              </label>
              <input
                type="text"
                id="piva"
                name="piva"
                value={formData.piva}
                onChange={handleChange}
                maxLength={11}
                className={fieldClass('piva')}
                placeholder="11 cifre senza spazi"
              />
              {errors.piva && <p className="mt-1 text-sm text-red-600">{errors.piva}</p>}
            </div>

            <div>
              <label htmlFor="nomeReferente" className="block text-sm font-medium text-gray-700 mb-2">
                Nome Referente *
              </label>
              <input
                type="text"
                id="nomeReferente"
                name="nomeReferente"
                value={formData.nomeReferente}
                onChange={handleChange}
                className={fieldClass('nomeReferente')}
                placeholder="Nome del referente"
              />
              {errors.nomeReferente && <p className="mt-1 text-sm text-red-600">{errors.nomeReferente}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={fieldClass('email')}
                placeholder="email@esempio.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={fieldClass('password')}
                placeholder="Minimo 8 caratteri"
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>

            <div>
              <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-2">
                Telefono *
              </label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                className={fieldClass('telefono')}
                placeholder="+39 123 456 7890"
              />
              {errors.telefono && <p className="mt-1 text-sm text-red-600">{errors.telefono}</p>}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="indirizzo" className="block text-sm font-medium text-gray-700 mb-2">
                Indirizzo *
              </label>
              <input
                type="text"
                id="indirizzo"
                name="indirizzo"
                value={formData.indirizzo}
                onChange={handleChange}
                className={fieldClass('indirizzo')}
                placeholder="Via Roma 123, Città"
              />
              {errors.indirizzo && <p className="mt-1 text-sm text-red-600">{errors.indirizzo}</p>}
            </div>

            <div>
              <label htmlFor="provincia" className="block text-sm font-medium text-gray-700 mb-2">
                Provincia *
              </label>
              <select
                id="provincia"
                name="provincia"
                value={formData.provincia}
                onChange={handleChange}
                className={fieldClass('provincia')}
              >
                <option value="">Seleziona provincia</option>
                {provinces.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </select>
              {errors.provincia && <p className="mt-1 text-sm text-red-600">{errors.provincia}</p>}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="descrizionePiazzale" className="block text-sm font-medium text-gray-700 mb-2">
                Descrizione del Piazzale *
              </label>
              <textarea
                id="descrizionePiazzale"
                name="descrizionePiazzale"
                value={formData.descrizionePiazzale}
                onChange={handleChange}
                rows={4}
                className={fieldClass('descrizionePiazzale')}
                placeholder="Descrivi il tuo piazzale, dimensioni, tipi di veicoli, ecc."
              />
              {errors.descrizionePiazzale && <p className="mt-1 text-sm text-red-600">{errors.descrizionePiazzale}</p>}
            </div>

          </div>

          <div className="mt-8 text-center">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-[#FF6600] text-white rounded-lg font-bold hover:bg-orange-600 text-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 mx-auto transition-colors"
            >
              {loading && (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
              {loading ? 'Registrazione in corso...' : 'Registrati'}
            </button>
          </div>
        </form>
      </section>

      {/* Footer */}
      <footer className="bg-[#001f4d] text-white/50 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <a href="/" className="inline-flex items-center gap-1 mb-2">
            <span className="font-bold text-white">auto</span>
            <span className="font-bold text-[#FF6600]">demo24</span>
          </a>
          <p className="text-sm">Il portale italiano dei demolitori auto</p>
        </div>
      </footer>
    </main>
  );
}
