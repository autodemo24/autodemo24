'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Inserisci email e password'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Errore durante il login'); return; }
      router.push('/dashboard');
    } catch {
      setError('Impossibile contattare il server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-[#003580] flex-col justify-between p-12">
        <a href="/" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-white.svg" alt="autodemo24.it" className="h-9" />
        </a>
        <div>
          <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Gestisci il tuo piazzale<br />
            <span className="text-[#FF6600]">ovunque tu sia</span>
          </h2>
          <p className="text-white/60 text-lg">
            Pubblica veicoli, gestisci i ricambi e raggiungi migliaia di clienti ogni giorno.
          </p>
        </div>
        <p className="text-white/30 text-sm">© {new Date().getFullYear()} autodemo24.it</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden bg-[#003580] px-6 py-4">
          <a href="/" className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo-white.svg" alt="autodemo24.it" className="h-7" />
          </a>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Accedi all&apos;area demolitore</h1>
              <p className="text-gray-500 text-sm mb-8">Inserisci le tue credenziali per continuare</p>

              {error && (
                <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
                  </svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email" placeholder="email@azienda.it"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-700 text-sm focus:border-[#003580] focus:ring-2 focus:ring-[#003580]/20 outline-none transition" />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                  <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password" placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-700 text-sm focus:border-[#003580] focus:ring-2 focus:ring-[#003580]/20 outline-none transition" />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3.5 bg-[#FF6600] hover:bg-orange-600 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {loading && (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  )}
                  {loading ? 'Accesso in corso…' : 'Accedi'}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                <p className="text-sm text-gray-500">
                  Non hai ancora un account?{' '}
                  <a href="/registrati" className="text-[#003580] font-semibold hover:underline">
                    Registrati gratis
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
