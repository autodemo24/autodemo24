import { redirect } from 'next/navigation';
import { getSession } from '../../lib/session';
import LogoutButton from './LogoutButton';

export default async function Dashboard() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-red-600">auto</span>
            <span className="text-2xl font-bold text-gray-800">demo24</span>
          </a>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:block">
              {session.ragioneSociale}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Contenuto dashboard */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Benvenuto, {session.ragioneSociale}
          </h1>
          <p className="text-gray-500 mt-1">{session.email}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card veicoli */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM3 5h2l2 7h10l2-7H3z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Veicoli</h2>
            </div>
            <p className="text-gray-500 text-sm mb-4">Gestisci i veicoli nel tuo piazzale</p>
            <a
              href="/dashboard/veicoli"
              className="inline-block px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
            >
              Vai ai veicoli
            </a>
          </div>

          {/* Card profilo */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Profilo</h2>
            </div>
            <p className="text-gray-500 text-sm mb-4">Modifica i dati della tua azienda</p>
            <a
              href="/dashboard/profilo"
              className="inline-block px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
            >
              Vai al profilo
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
