'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type ConnectionInfo = {
  environment: string;
  connectedAt: string;
};

interface Props {
  connection: ConnectionInfo | null;
}

export default function SpediamoProPanel({ connection }: Props) {
  const router = useRouter();
  const [authcode, setAuthcode] = useState('');
  const [environment, setEnvironment] = useState<'staging' | 'production'>(
    (connection?.environment as 'staging' | 'production') ?? 'staging',
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onConnect(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!authcode.trim()) {
      setError('Authcode obbligatorio');
      return;
    }
    setLoading(true);
    try {
      const r = await fetch('/api/spediamopro/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authcode: authcode.trim(), environment }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error ?? 'Errore');
        setLoading(false);
        return;
      }
      setAuthcode('');
      router.refresh();
    } catch {
      setError('Errore di rete');
      setLoading(false);
    }
  }

  async function onDisconnect() {
    if (!confirm('Vuoi scollegare SpediamoPro? Non potrai più creare etichette finché non lo ricolleghi.')) return;
    setLoading(true);
    try {
      const r = await fetch('/api/spediamopro/connect', { method: 'DELETE' });
      if (r.ok) router.refresh();
      else alert('Errore');
    } finally {
      setLoading(false);
    }
  }

  if (connection) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-yellow-400 flex items-center justify-center font-bold text-sm shadow">
              SP
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">SpediamoPro collegato</h2>
              <p className="text-sm text-gray-600">
                Collegato il {new Date(connection.connectedAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <span className={`px-2 py-1 rounded text-[11px] font-bold uppercase ${
            connection.environment === 'production'
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {connection.environment}
          </span>
        </div>

        <p className="text-sm text-gray-700 mb-4">
          Ora dalla pagina dettaglio di un ordine eBay puoi cliccare <strong>"Crea spedizione SpediamoPro"</strong> per generare automaticamente etichetta + tracking.
        </p>

        <button
          type="button"
          onClick={onDisconnect}
          disabled={loading}
          className="px-4 py-2 border border-red-300 text-red-700 hover:bg-red-50 rounded-lg text-sm font-semibold disabled:opacity-50"
        >
          {loading ? 'Scollegamento…' : 'Scollega'}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-lg bg-yellow-400 flex items-center justify-center font-bold text-sm shadow">
          SP
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Non collegato</h2>
          <p className="text-sm text-gray-600">Inserisci il tuo Authcode SpediamoPro per attivare l'integrazione.</p>
        </div>
      </div>

      <form onSubmit={onConnect} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Authcode *</label>
          <input
            type="text"
            value={authcode}
            onChange={(e) => setAuthcode(e.target.value)}
            placeholder="incolla qui l'Authcode dal tuo account SpediamoPro"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg font-mono focus:outline-none focus:border-[#003580]"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Ambiente</label>
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="env"
                value="staging"
                checked={environment === 'staging'}
                onChange={() => setEnvironment('staging')}
              />
              Staging (test)
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="env"
                value="production"
                checked={environment === 'production'}
                onChange={() => setEnvironment('production')}
              />
              Production (reale)
            </label>
          </div>
        </div>

        {error && <p className="text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-[#003580] hover:bg-[#002560] disabled:bg-gray-300 text-white rounded-lg text-sm font-semibold"
        >
          {loading ? 'Verifica…' : 'Collega SpediamoPro'}
        </button>
      </form>
    </div>
  );
}
