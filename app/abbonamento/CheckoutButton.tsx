'use client';

import { useState } from 'react';

interface Props {
  piano: string;
  label: string;
  disabled?: boolean;
}

export default function CheckoutButton({ piano, label, disabled }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClick = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ piano }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Errore durante il checkout');
        return;
      }
      window.location.href = data.url;
    } catch {
      setError('Impossibile contattare il server. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={disabled || loading}
        className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-[#FF6600] text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        )}
        {loading ? 'Reindirizzamento…' : label}
      </button>
      {error && <p className="mt-2 text-xs text-red-600 text-center">{error}</p>}
    </div>
  );
}
