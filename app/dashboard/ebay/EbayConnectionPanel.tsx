'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type ConnectionInfo = {
  environment: string;
  ebayUserId: string | null;
  connectedAt: string;
  expiresAt: string;
  refreshExpiresAt: string;
  scopes: string[];
  refreshExpired: boolean;
};

interface Props {
  connection: ConnectionInfo | null;
  currentEnv: 'sandbox' | 'production';
}

export default function EbayConnectionPanel({ connection, currentEnv }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onDisconnect() {
    if (!confirm('Sei sicuro di voler scollegare l\'account eBay? Non potrai pubblicare nuovi ricambi finché non lo ricolleghi.')) return;
    setLoading(true);
    try {
      const r = await fetch('/api/ebay/oauth/disconnect', { method: 'POST' });
      if (r.ok) router.refresh();
      else alert('Errore durante lo scollegamento');
    } finally {
      setLoading(false);
    }
  }

  if (!connection) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-red-500 via-yellow-400 to-green-500 flex items-center justify-center text-white font-bold text-lg shadow">
            eBay
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Non collegato</h2>
            <p className="text-sm text-gray-600">Collega il tuo account eBay venditore per iniziare a pubblicare.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/api/ebay/oauth/connect"
            className="px-5 py-2.5 bg-[#003580] hover:bg-[#002b6b] text-white rounded-lg text-sm font-semibold inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            Collega account eBay
          </a>
          <span className="text-xs text-gray-500">Ambiente: <strong className="uppercase">{currentEnv}</strong></span>
        </div>
      </div>
    );
  }

  const envMismatch = connection.environment !== currentEnv;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-red-500 via-yellow-400 to-green-500 flex items-center justify-center text-white font-bold text-lg shadow">
            eBay
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Collegato {connection.ebayUserId ? (<><span className="text-gray-500 font-normal">come</span> {connection.ebayUserId}</>) : ''}
            </h2>
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

      {connection.refreshExpired && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm mb-4">
          Il collegamento è scaduto. Ricollega l'account per continuare a pubblicare.
        </div>
      )}

      {envMismatch && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm mb-4">
          Questo collegamento è per ambiente <strong>{connection.environment}</strong> ma l'app ora usa <strong>{currentEnv}</strong>. Scollega e ricollega per sincronizzare.
        </div>
      )}

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-6">
        <div>
          <dt className="text-xs text-gray-500 font-semibold uppercase">Token scade</dt>
          <dd className="text-gray-900">{new Date(connection.expiresAt).toLocaleString('it-IT')}</dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500 font-semibold uppercase">Refresh token scade</dt>
          <dd className="text-gray-900">{new Date(connection.refreshExpiresAt).toLocaleDateString('it-IT')}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap items-center gap-3">
        <a
          href="/api/ebay/oauth/connect"
          className="px-4 py-2 border border-[#003580] text-[#003580] hover:bg-[#003580] hover:text-white rounded-lg text-sm font-semibold"
        >
          Ricollega
        </a>
        <button
          type="button"
          onClick={onDisconnect}
          disabled={loading}
          className="px-4 py-2 border border-red-300 text-red-700 hover:bg-red-50 rounded-lg text-sm font-semibold disabled:opacity-50"
        >
          {loading ? 'Scollegamento…' : 'Scollega'}
        </button>
      </div>
    </div>
  );
}
