import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '../../../../lib/session';
import { prisma } from '../../../../lib/prisma';
import DashboardShell from '../../../../components/DashboardShell';
import ShipOrderForm from './ShipOrderForm';
import ShipWithSpediamoPro from './ShipWithSpediamoPro';
import DownloadLabelButton from './DownloadLabelButton';

export const dynamic = 'force-dynamic';

function fmt(v: unknown): string {
  const n = Number(v);
  return isNaN(n) ? '—' : `€ ${n.toFixed(2)}`;
}

export default async function OrdineDetailPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { id } = await params;
  const idNum = Number(id);
  if (isNaN(idNum)) notFound();

  const [ordine, demolitore, spConn] = await Promise.all([
    prisma.ordine.findUnique({
      where: { id: idNum },
      include: {
        items: { include: { ricambio: { select: { id: true, codice: true, nome: true, titolo: true } } } },
        spedizione: true,
      },
    }),
    prisma.demolitore.findUnique({ where: { id: session.id }, select: { email: true } }),
    prisma.spediamoProConnection.findUnique({ where: { demolitoreid: session.id }, select: { id: true } }),
  ]);

  if (!ordine || ordine.demolitoreid !== session.id) notFound();
  const spediamoProConnected = !!spConn;

  const totalItems = ordine.items.reduce((a, i) => a + i.quantity, 0);
  const subtotale = ordine.items.reduce((a, i) => a + Number(i.totalPrice), 0);
  const spedizione = Number(ordine.totalAmount) - subtotale;

  return (
    <DashboardShell ragioneSociale={session.ragioneSociale} email={demolitore?.email ?? session.email}>
      <div className="max-w-5xl mx-auto p-4 sm:p-8">
        <div className="mb-6">
            <Link href="/dashboard/ordini" className="text-xs text-gray-500 hover:text-gray-700">
              ← Torna agli ordini
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">Ordine eBay</h1>
            <p className="text-gray-500 text-sm font-mono mt-1">{ordine.ebayOrderId}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Colonna sinistra: dati ordine */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stato + spedisci */}
              {ordine.stato === 'PAID' && (
                <section className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
                  <h2 className="text-sm font-bold text-yellow-900 uppercase tracking-wide mb-3">Da spedire</h2>
                  {spediamoProConnected ? (
                    <ShipWithSpediamoPro ordineId={ordine.id} />
                  ) : (
                    <>
                      <div className="mb-4 p-3 bg-white rounded-lg border border-yellow-300">
                        <p className="text-xs text-gray-700">
                          💡 Suggerimento: <a href="/dashboard/spediamopro" className="text-[#003580] underline font-semibold">collega SpediamoPro</a> per generare automaticamente etichetta + tracking.
                        </p>
                      </div>
                      <p className="text-sm text-yellow-800 mb-4">
                        Inserisci il numero di tracking manualmente e segnalo come spedito.
                      </p>
                      <ShipOrderForm ordineId={ordine.id} />
                    </>
                  )}
                </section>
              )}

              {ordine.stato === 'SHIPPED' && (
                <section className="bg-green-50 border border-green-200 rounded-xl p-5">
                  <h2 className="text-sm font-bold text-green-900 uppercase tracking-wide mb-2">Spedito</h2>
                  <p className="text-sm text-green-800">
                    {ordine.shippedAt && `Spedito il ${new Date(ordine.shippedAt).toLocaleDateString('it-IT')}`}
                    {ordine.shippingCarrier && ` via ${ordine.shippingCarrier}`}
                    {ordine.trackingNumber && <>. Tracking: <span className="font-mono">{ordine.trackingNumber}</span></>}
                  </p>
                  {ordine.spedizione?.labelUrl ? (
                    <a
                      href={ordine.spedizione.labelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-3 px-4 py-2 bg-white border border-green-400 text-green-800 hover:bg-green-100 rounded-lg text-sm font-semibold"
                    >
                      📄 Scarica etichetta
                    </a>
                  ) : ordine.spedizione?.spShipmentId ? (
                    <DownloadLabelButton ordineId={ordine.id} />
                  ) : null}
                </section>
              )}

              {/* Articoli */}
              <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">
                  Articoli ({totalItems})
                </h2>
                <div className="divide-y divide-gray-100">
                  {ordine.items.map((item) => (
                    <div key={item.id} className="py-3 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{item.titolo}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          SKU: <span className="font-mono">{item.sku}</span>
                          {item.ricambio && (
                            <> · <Link href={`/dashboard/ricambi/${item.ricambio.id}`} className="text-[#003580] hover:underline">
                              scheda ricambio →
                            </Link></>
                          )}
                        </p>
                        {!item.ricambio && (
                          <p className="text-xs text-red-600 mt-1">⚠ Ricambio non trovato nel magazzino (SKU non mappato)</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-gray-900">{fmt(item.totalPrice)}</p>
                        <p className="text-xs text-gray-500">{item.quantity} × {fmt(item.unitPrice)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 space-y-1 text-sm">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotale articoli</span>
                    <span>{fmt(subtotale)}</span>
                  </div>
                  {spedizione > 0 && (
                    <div className="flex justify-between text-gray-700">
                      <span>Spedizione</span>
                      <span>{fmt(spedizione)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100">
                    <span>Totale</span>
                    <span>{fmt(ordine.totalAmount)}</span>
                  </div>
                </div>
              </section>

              {/* Note acquirente */}
              {ordine.noteAcquirente && (
                <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                  <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Nota dell'acquirente</h2>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{ordine.noteAcquirente}</p>
                </section>
              )}
            </div>

            {/* Colonna destra: acquirente + spedizione */}
            <div className="space-y-6">
              <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Acquirente</h2>
                <dl className="space-y-2 text-sm">
                  {ordine.buyerUsername && (
                    <div>
                      <dt className="text-xs text-gray-500">Username eBay</dt>
                      <dd className="text-gray-900 font-mono">{ordine.buyerUsername}</dd>
                    </div>
                  )}
                  {ordine.buyerEmail && (
                    <div>
                      <dt className="text-xs text-gray-500">Email</dt>
                      <dd className="text-gray-900 break-all">{ordine.buyerEmail}</dd>
                    </div>
                  )}
                  {ordine.buyerPhone && (
                    <div>
                      <dt className="text-xs text-gray-500">Telefono</dt>
                      <dd className="text-gray-900">{ordine.buyerPhone}</dd>
                    </div>
                  )}
                </dl>
              </section>

              <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Indirizzo di spedizione</h2>
                <div className="text-sm text-gray-800 leading-relaxed">
                  {ordine.shippingName && <p className="font-semibold">{ordine.shippingName}</p>}
                  {ordine.shippingAddressLine1 && <p>{ordine.shippingAddressLine1}</p>}
                  {ordine.shippingAddressLine2 && <p>{ordine.shippingAddressLine2}</p>}
                  {(ordine.shippingPostalCode || ordine.shippingCity) && (
                    <p>{ordine.shippingPostalCode} {ordine.shippingCity}{ordine.shippingProvince ? ` (${ordine.shippingProvince})` : ''}</p>
                  )}
                  {ordine.shippingCountry && <p className="text-xs text-gray-500 mt-1">{ordine.shippingCountry}</p>}
                </div>
              </section>

              <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Pagamento</h2>
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-xs text-gray-500">Stato</dt>
                    <dd className="text-gray-900">{ordine.paidAt ? `Pagato il ${new Date(ordine.paidAt).toLocaleDateString('it-IT')}` : 'In attesa'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Totale</dt>
                    <dd className="text-gray-900 font-bold text-lg">{fmt(ordine.totalAmount)}</dd>
                  </div>
                </dl>
              </section>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
