import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '../../../../lib/session';
import { prisma } from '../../../../lib/prisma';
import FormShell from '../../../../components/FormShell';
import RicambioForm from '../RicambioForm';

export default async function NuovoRicambioPage({
  searchParams,
}: {
  searchParams: Promise<{ duplicaDa?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');

  const sp = await searchParams;
  const duplicaDaId = sp.duplicaDa ? Number(sp.duplicaDa) : null;

  const [demolitore, veicoli, ebayConn, sorgente] = await Promise.all([
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
    duplicaDaId && !Number.isNaN(duplicaDaId)
      ? prisma.ricambio.findUnique({
          where: { id: duplicaDaId },
          include: {
            compatibilita: { orderBy: { id: 'asc' } },
          },
        })
      : Promise.resolve(null),
  ]);
  const ebayConnected = !!ebayConn && ebayConn.refreshExpiresAt.getTime() > Date.now();

  // Se duplicaDa punta a un ricambio di un altro demolitore, ignora
  const src = sorgente && sorgente.demolitoreid === session.id ? sorgente : null;

  const initialFromSrc = src
    ? {
        nome: src.nome,
        nomePersonalizzato: src.nomePersonalizzato,
        titolo: null,
        categoria: src.categoria,
        categoriaEbayId: src.categoriaEbayId,
        tipologia: src.tipologia,
        marca: src.marca,
        modello: src.modello,
        anno: src.anno,
        cilindrata: src.cilindrata,
        alimentazione: src.alimentazione,
        kw: src.kw,
        km: src.km,
        targa: src.targa,
        telaio: src.telaio,
        codiceMotore: src.codiceMotore,
        codiceOe: src.codiceOe,
        mpn: src.mpn,
        ean: src.ean,
        altroCodice: src.altroCodice,
        codiceInterno: src.codiceInterno,
        dettagli: src.dettagli,
        quantita: src.quantita,
        condizione: src.condizione,
        condDescrizione: src.condDescrizione,
        descrizione: src.descrizione,
        notePartePubblica: src.notePartePubblica,
        noteInterne: src.noteInterne,
        prezzo: src.prezzo.toString(),
        prezzoSpedizione: src.prezzoSpedizione?.toString() ?? null,
        ubicazione: src.ubicazione,
        peso: src.peso,
        lunghezzaCm: src.lunghezzaCm,
        larghezzaCm: src.larghezzaCm,
        altezzaCm: src.altezzaCm,
        offline: src.offline,
        subito: src.subito,
        stato: 'DISPONIBILE' as const,
        pubblicato: false,
        veicoloid: src.veicoloid,
        modelloAutoId: src.modelloAutoId,
        foto: [],
        compatibilita: src.compatibilita.map((c) => ({
          marca: c.marca,
          modello: c.modello,
          annoInizio: c.annoInizio,
          annoFine: c.annoFine,
          versione: c.versione,
        })),
      }
    : undefined;

  return (
    <FormShell
      ragioneSociale={session.ragioneSociale}
      email={demolitore?.email ?? session.email}
      headerLeft={
        <Link href="/dashboard/ricambi" className="text-xs text-gray-500 hover:text-gray-700">
          ← Torna ai ricambi
        </Link>
      }
      headerTitle={
        <h1 className="text-xl font-bold text-gray-900">
          {src ? `Nuova inserzione (simile a ${src.codice})` : 'Nuova inserzione ricambio'}
        </h1>
      }
    >
      <RicambioForm
        mode="create"
        initial={initialFromSrc}
        veicoliSorgente={veicoli}
        ebayConnected={ebayConnected}
      />
    </FormShell>
  );
}
