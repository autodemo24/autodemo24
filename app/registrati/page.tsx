'use client';

import { useState } from 'react';

const provinces = [
  'Agrigento', 'Alessandria', 'Ancona', 'Aosta', 'Arezzo', 'Ascoli Piceno', 'Asti', 'Avellino', 'Bari', 'Barletta-Andria-Trani', 'Belluno', 'Benevento', 'Bergamo', 'Biella', 'Bologna', 'Bolzano', 'Brescia', 'Brindisi', 'Cagliari', 'Caltanissetta', 'Campobasso', 'Carbonia-Iglesias', 'Caserta', 'Catania', 'Catanzaro', 'Chieti', 'Como', 'Cosenza', 'Cremona', 'Crotone', 'Cuneo', 'Enna', 'Fermo', 'Ferrara', 'Firenze', 'Foggia', 'Forlì-Cesena', 'Frosinone', 'Genova', 'Gorizia', 'Grosseto', 'Imperia', 'Isernia', "L'Aquila", 'La Spezia', 'Latina', 'Lecce', 'Lecco', 'Livorno', 'Lodi', 'Lucca', 'Macerata', 'Mantova', 'Massa-Carrara', 'Matera', 'Medio Campidano', 'Messina', 'Milano', 'Modena', 'Monza e della Brianza', 'Napoli', 'Novara', 'Nuoro', 'Ogliastra', 'Olbia-Tempio', 'Oristano', 'Padova', 'Palermo', 'Parma', 'Pavia', 'Perugia', 'Pesaro e Urbino', 'Pescara', 'Piacenza', 'Pisa', 'Pistoia', 'Pordenone', 'Potenza', 'Prato', 'Ragusa', 'Ravenna', 'Reggio Calabria', 'Reggio Emilia', 'Rieti', 'Rimini', 'Roma', 'Rovigo', 'Salerno', 'Sassari', 'Savona', 'Siena', 'Siracusa', 'Sondrio', 'Taranto', 'Teramo', 'Terni', 'Torino', 'Trapani', 'Trento', 'Treviso', 'Trieste', 'Udine', 'Varese', 'Venezia', 'Verbano-Cusio-Ossola', 'Vercelli', 'Verona', 'Vibo Valentia', 'Vicenza', 'Viterbo'
];

export default function Registrati() {
  const [formData, setFormData] = useState({
    ragioneSociale: '',
    piva: '',
    nomeReferente: '',
    email: '',
    password: '',
    telefono: '',
    indirizzo: '',
    provincia: '',
    descrizionePiazzale: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Qui puoi aggiungere la logica per inviare i dati al server
    console.log('Dati del form:', formData);
    alert('Registrazione completata! (simulata)');
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-red-600">auto</span>
            <span className="text-2xl font-bold text-gray-800">demo24</span>
          </div>
          <div className="flex gap-3">
            <a href="/login" className="px-4 py-2 text-gray-600 hover:text-red-600 font-medium">
              Accedi
            </a>
            <a href="/registrati" className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">
              Sei un demolitore? Registrati
            </a>
          </div>
        </div>
      </header>

      {/* Form di registrazione */}
      <section className="py-16 max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Registrazione Demolitore</h1>
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-8">
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
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 text-gray-700"
                placeholder="Inserisci la ragione sociale"
              />
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
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 text-gray-700"
                placeholder="Inserisci la partita IVA"
              />
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
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 text-gray-700"
                placeholder="Nome del referente"
              />
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
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 text-gray-700"
                placeholder="email@esempio.com"
              />
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
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 text-gray-700"
                placeholder="Inserisci una password sicura"
              />
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
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 text-gray-700"
                placeholder="+39 123 456 7890"
              />
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
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 text-gray-700"
                placeholder="Via Roma 123, Città"
              />
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
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 text-gray-700"
              >
                <option value="">Seleziona provincia</option>
                {provinces.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </select>
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
                required
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 text-gray-700"
                placeholder="Descrivi il tuo piazzale, dimensioni, tipi di veicoli, ecc."
              />
            </div>
          </div>
          <div className="mt-8 text-center">
            <button
              type="submit"
              className="px-8 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 text-lg"
            >
              Registrati
            </button>
          </div>
        </form>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 py-8 text-center">
        <p className="text-lg font-bold text-white mb-2">autodemo24.it</p>
        <p>Il portale italiano dei demolitori auto</p>
      </footer>
    </main>
  );
}