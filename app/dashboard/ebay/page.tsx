import { redirect } from 'next/navigation';
import { prisma } from '../../../lib/prisma';
import { getSession } from '../../../lib/session';
import { getEbayEnv } from '../../../lib/ebay/config';
import EbayConnectionPanel from './EbayConnectionPanel';

export default async function EbayConfigPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; declined?: string; error?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');

  const params = await searchParams;
  const connection = await prisma.ebayConnection.findUnique({
    where: { demolitoreid: session.id },
    select: {
      id: true,
      environment: true,
      ebayUserId: true,
      expiresAt: true,
      refreshExpiresAt: true,
      scopes: true,
      connectedAt: true,
    },
  });

  const env = getEbayEnv();
  const now = Date.now();
  const refreshExpired = connection ? connection.refreshExpiresAt.getTime() < now : false;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurazione negozio eBay</h1>
        <p className="text-sm text-gray-600 mt-1">
          Collega il tuo account eBay per pubblicare automaticamente i ricambi dal tuo account venditore.
        </p>
      </div>

      {params.connected && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm">
          Account eBay collegato correttamente.
        </div>
      )}
      {params.declined && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
          Collegamento annullato. Puoi riprovare quando vuoi.
        </div>
      )}
      {params.error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
          Errore durante il collegamento: {params.error}
        </div>
      )}

      <EbayConnectionPanel
        connection={
          connection
            ? {
                environment: connection.environment,
                ebayUserId: connection.ebayUserId,
                connectedAt: connection.connectedAt.toISOString(),
                expiresAt: connection.expiresAt.toISOString(),
                refreshExpiresAt: connection.refreshExpiresAt.toISOString(),
                scopes: connection.scopes,
                refreshExpired,
              }
            : null
        }
        currentEnv={env}
      />

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Funzionalità</h2>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex gap-2">
            <span className="text-[#003580] font-bold">•</span>
            <span>Pubblicazione automatica ricambi su eBay con un click dal form di inserimento.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#003580] font-bold">•</span>
            <span>Le tue policy di spedizione/reso/pagamento configurate su eBay Seller Hub vengono usate automaticamente.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#003580] font-bold">•</span>
            <span>Compatibilità multi-veicolo: un ricambio può essere compatibile con più modelli/anni.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#003580] font-bold">•</span>
            <span>I tuoi token OAuth sono cifrati nel nostro database (AES-256-GCM).</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
