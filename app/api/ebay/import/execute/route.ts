import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { getSession } from '../../../../../lib/session';
import { generaCodice, generaQrPayload } from '../../../../../lib/ricambio-codes';
import { getItem } from '../../../../../lib/ebay/trading';
import { mapEbayItemToRicambio } from '../../../../../lib/ebay/import-mapper';
import { mirrorEbayPhotos } from '../../../../../lib/ebay/photo-mirror';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_BATCH_SIZE = 10;

type ImportResult = {
  itemID: string;
  imported?: true;
  skipped?: true;
  failed?: true;
  ricambioId?: number;
  codice?: string;
  reason?: string;
};

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const conn = await prisma.ebayConnection.findUnique({ where: { demolitoreid: session.id } });
  if (!conn) return NextResponse.json({ error: 'eBay non collegato' }, { status: 400 });
  if (conn.refreshExpiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: 'Token eBay scaduto, ricollega l\'account' }, { status: 400 });
  }

  let body: { itemIDs?: unknown };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 });
  }

  const itemIDs = Array.isArray(body.itemIDs) ? body.itemIDs.filter((v): v is string => typeof v === 'string') : [];
  if (itemIDs.length === 0) {
    return NextResponse.json({ error: 'Nessun itemID fornito' }, { status: 400 });
  }
  if (itemIDs.length > MAX_BATCH_SIZE) {
    return NextResponse.json({ error: `Max ${MAX_BATCH_SIZE} items per batch` }, { status: 400 });
  }

  // Check already imported in batch
  const existing = await prisma.ebayListing.findMany({
    where: {
      listingId: { in: itemIDs },
      ricambio: { demolitoreid: session.id },
    },
    select: { listingId: true, ricambio: { select: { id: true, codice: true } } },
  });
  const existingByItemID = new Map<string, { ricambioId: number; codice: string }>();
  for (const e of existing) {
    if (e.listingId) existingByItemID.set(e.listingId, { ricambioId: e.ricambio.id, codice: e.ricambio.codice });
  }

  const results = await Promise.all(itemIDs.map(async (itemID): Promise<ImportResult> => {
    try {
      const alreadyHit = existingByItemID.get(itemID);
      if (alreadyHit) {
        return { itemID, skipped: true, reason: `Già importato come ${alreadyHit.codice}`, ricambioId: alreadyHit.ricambioId, codice: alreadyHit.codice };
      }

      const detail = await getItem(session.id, itemID);
      const mapped = mapEbayItemToRicambio(detail);
      if (!mapped.ok) {
        return { itemID, failed: true, reason: mapped.reason };
      }

      const { mirroredUrls, errors: photoErrors } = await mirrorEbayPhotos(session.id, detail.pictureURLs);
      if (detail.pictureURLs.length > 0 && mirroredUrls.length === 0) {
        return { itemID, failed: true, reason: `Nessuna foto scaricata (${photoErrors[0]?.reason ?? 'errore sconosciuto'})` };
      }

      const payload = mapped.payload;
      payload.fotoUrls = mirroredUrls;

      const ricambioStato = detail.listingStatus === 'Active' ? 'DISPONIBILE' : 'VENDUTO';
      const ebayListingStatus = detail.listingStatus === 'Active' ? 'PUBLISHED' : 'ENDED';
      const prezzoNum = Number(payload.prezzo);
      const ubicazione = payload.ubicazione.trim().toUpperCase();

      const created = await prisma.$transaction(async (tx) => {
        const tmp = await tx.ricambio.create({
          data: {
            codice: `TMP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            qrPayload: `TMP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            nome: payload.nome,
            titolo: payload.titolo ?? null,
            categoria: payload.categoria,
            categoriaEbayId: payload.categoriaEbayId ?? null,
            marca: payload.marca,
            modello: payload.modello,
            anno: payload.anno,
            cilindrata: payload.cilindrata,
            alimentazione: payload.alimentazione,
            kw: payload.kw,
            telaio: payload.telaio,
            codiceMotore: payload.codiceMotore,
            codiceOe: payload.codiceOe,
            mpn: payload.mpn,
            ean: payload.ean,
            quantita: payload.quantita,
            condizione: payload.condizione,
            descrizione: payload.descrizione,
            prezzo: prezzoNum,
            prezzoSpedizione: payload.prezzoSpedizione,
            ubicazione,
            peso: payload.peso && payload.peso > 0 ? payload.peso : null,
            lunghezzaCm: payload.lunghezzaCm && payload.lunghezzaCm > 0 ? payload.lunghezzaCm : null,
            larghezzaCm: payload.larghezzaCm && payload.larghezzaCm > 0 ? payload.larghezzaCm : null,
            altezzaCm: payload.altezzaCm && payload.altezzaCm > 0 ? payload.altezzaCm : null,
            stato: ricambioStato,
            pubblicato: true,
            demolitoreid: session.id,
            foto: mirroredUrls.length > 0
              ? { create: mirroredUrls.map((url, i) => ({ url, copertina: i === 0 })) }
              : undefined,
            compatibilita: payload.compatibilita.length > 0
              ? {
                  create: payload.compatibilita.map((c) => ({
                    marca: c.marca,
                    modello: c.modello,
                    annoInizio: c.annoInizio,
                    annoFine: c.annoFine,
                    versione: c.versione,
                  })),
                }
              : undefined,
            ebayListing: {
              create: {
                sku: `EBAY-${itemID}`,
                listingId: itemID,
                status: ebayListingStatus,
                marketplaceId: 'EBAY_IT',
                lastSyncAt: new Date(),
              },
            },
          },
        });
        const codice = generaCodice(tmp.id);
        const qrPayload = generaQrPayload(tmp.id, codice, session.id);
        return tx.ricambio.update({
          where: { id: tmp.id },
          data: { codice, qrPayload },
          select: { id: true, codice: true },
        });
      });

      return { itemID, imported: true, ricambioId: created.id, codice: created.codice };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Errore sconosciuto';
      console.error(`import execute ${itemID}:`, e);
      return { itemID, failed: true, reason: msg.slice(0, 300) };
    }
  }));

  return NextResponse.json({ results });
}
