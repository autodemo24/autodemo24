import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '../../../../lib/session';
import { prisma } from '../../../../lib/prisma';
import Navbar from '../../../../components/Navbar';
import DashboardSidebar from '../../../../components/DashboardSidebar';
import RicambioForm from '../RicambioForm';

export default async function EditRicambioPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { id } = await params;
  const idNum = Number(id);
  if (isNaN(idNum)) notFound();

  const [ricambio, demolitore, veicoli, ebayConn] = await Promise.all([
    prisma.ricambio.findUnique({
      where: { id: idNum },
      include: {
        foto: { orderBy: { copertina: 'desc' } },
        compatibilita: { orderBy: { id: 'asc' } },
      },
    }),
    prisma.demolitore.findUnique({ where: { id: session.id }, select: { email: true } }),
    prisma.veicolo.findMany({
      where: { demolitoreid: session.id },
      select: { id: true, marca: true, modello: true, anno: true, targa: true },
      orderBy: { id: 'desc' },
    }),
    prisma.ebayConnection.findUnique({
      where: { demolitoreid: session.id },
      select: { refreshExpiresAt: true },
    }),
  ]);

  if (!ricambio || ricambio.demolitoreid !== session.id) notFound();
  const ebayConnected = !!ebayConn && ebayConn.refreshExpiresAt.getTime() > Date.now();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="lg:hidden"><Navbar /></div>
      <div className="flex">
        <DashboardSidebar ragioneSociale={session.ragioneSociale} email={demolitore?.email ?? session.email} />
        <main className="ml-0 lg:ml-60 flex-1">
          <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
            <div>
              <Link href="/dashboard/ricambi" className="text-xs text-gray-500 hover:text-gray-700">
                ← Torna ai ricambi
              </Link>
              <h1 className="text-xl font-bold text-gray-900">Modifica ricambio <span className="text-gray-500 font-mono text-sm">{ricambio.codice}</span></h1>
            </div>
            <Link href={`/dashboard/ricambi/${ricambio.id}/qr`}
              className="px-4 py-2 border border-gray-300 text-gray-700 hover:text-[#003580] hover:border-[#003580] rounded text-sm font-semibold">
              Stampa QR
            </Link>
          </div>

          <RicambioForm
            mode="edit"
            ricambioId={ricambio.id}
            initial={{
              nome: ricambio.nome,
              nomePersonalizzato: ricambio.nomePersonalizzato,
              titolo: ricambio.titolo,
              categoria: ricambio.categoria,
              categoriaEbayId: ricambio.categoriaEbayId,
              tipologia: ricambio.tipologia,
              marca: ricambio.marca,
              modello: ricambio.modello,
              anno: ricambio.anno,
              cilindrata: ricambio.cilindrata,
              alimentazione: ricambio.alimentazione,
              kw: ricambio.kw,
              km: ricambio.km,
              targa: ricambio.targa,
              telaio: ricambio.telaio,
              codiceMotore: ricambio.codiceMotore,
              codiceOe: ricambio.codiceOe,
              mpn: ricambio.mpn,
              ean: ricambio.ean,
              altroCodice: ricambio.altroCodice,
              codiceInterno: ricambio.codiceInterno,
              dettagli: ricambio.dettagli,
              quantita: ricambio.quantita,
              condizione: ricambio.condizione,
              condDescrizione: ricambio.condDescrizione,
              descrizione: ricambio.descrizione,
              notePartePubblica: ricambio.notePartePubblica,
              noteInterne: ricambio.noteInterne,
              prezzo: ricambio.prezzo.toString(),
              prezzoSpedizione: ricambio.prezzoSpedizione?.toString() ?? null,
              ubicazione: ricambio.ubicazione,
              peso: ricambio.peso,
              lunghezzaCm: ricambio.lunghezzaCm,
              larghezzaCm: ricambio.larghezzaCm,
              altezzaCm: ricambio.altezzaCm,
              offline: ricambio.offline,
              subito: ricambio.subito,
              stato: ricambio.stato,
              pubblicato: ricambio.pubblicato,
              veicoloid: ricambio.veicoloid,
              modelloAutoId: ricambio.modelloAutoId,
              foto: ricambio.foto.map((f) => ({ id: f.id, url: f.url, copertina: f.copertina })),
              compatibilita: ricambio.compatibilita.map((c) => ({
                id: c.id,
                marca: c.marca,
                modello: c.modello,
                annoInizio: c.annoInizio,
                annoFine: c.annoFine,
                versione: c.versione,
              })),
            }}
            veicoliSorgente={veicoli}
            ebayConnected={ebayConnected}
          />
        </main>
      </div>
    </div>
  );
}
