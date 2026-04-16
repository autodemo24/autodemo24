import { NextResponse } from 'next/server';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from '../../../../lib/prisma';
import { getSession } from '../../../../lib/session';
import type { Prisma } from '@prisma/client';

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

function extractR2Key(url: string): string | null {
  const base = process.env.R2_PUBLIC_URL;
  if (!base || !url.startsWith(base)) return null;
  return url.slice(base.length).replace(/^\//, '');
}

async function deleteFromR2(urls: string[]) {
  await Promise.allSettled(
    urls.map((url) => {
      const key = extractR2Key(url);
      if (!key) return Promise.resolve();
      return s3.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME!, Key: key }));
    }),
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const idNum = Number(id);
  if (isNaN(idNum)) return NextResponse.json({ error: 'ID non valido' }, { status: 400 });

  const ricambio = await prisma.ricambio.findUnique({
    where: { id: idNum },
    include: {
      foto: true,
      demolitore: { select: { id: true, ragioneSociale: true, provincia: true, indirizzo: true, telefono: true, email: true } },
      veicolo: { select: { id: true, marca: true, modello: true, anno: true, targa: true } },
    },
  });
  if (!ricambio) return NextResponse.json({ error: 'Ricambio non trovato' }, { status: 404 });

  return NextResponse.json(ricambio);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const { id } = await params;
  const idNum = Number(id);
  if (isNaN(idNum)) return NextResponse.json({ error: 'ID non valido' }, { status: 400 });

  const esistente = await prisma.ricambio.findUnique({
    where: { id: idNum },
    include: { foto: true },
  });
  if (!esistente || esistente.demolitoreid !== session.id) {
    return NextResponse.json({ error: 'Ricambio non trovato' }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 }); }

  const {
    nome, titolo, categoria, categoriaEbayId, marca, modello, anno,
    targa, codiceOe, mpn, ean, quantita, condizione, condDescrizione,
    descrizione, prezzo, ubicazione, peso, lunghezzaCm, larghezzaCm, altezzaCm,
    stato, pubblicato, veicoloid, modelloAutoId, fotoUrls, compatibilita,
  } = body as {
    nome: string;
    titolo?: string | null;
    categoria: string;
    categoriaEbayId?: string | null;
    marca: string;
    modello: string;
    anno?: number | null;
    targa?: string | null;
    codiceOe?: string | null;
    mpn?: string | null;
    ean?: string | null;
    quantita?: number;
    condizione?: string | null;
    condDescrizione?: string | null;
    descrizione?: string | null;
    prezzo: number | string;
    ubicazione: string;
    peso?: number | null;
    lunghezzaCm?: number | null;
    larghezzaCm?: number | null;
    altezzaCm?: number | null;
    stato?: 'DISPONIBILE' | 'RISERVATO' | 'VENDUTO' | 'RITIRATO';
    pubblicato?: boolean;
    veicoloid?: number | null;
    modelloAutoId?: number | null;
    fotoUrls?: string[];
    compatibilita?: Array<{
      marca: string;
      modello: string;
      annoInizio: number;
      annoFine: number | null;
      versione?: string | null;
    }>;
  };

  if (!nome?.trim() || !categoria?.trim() || !marca?.trim() || !modello?.trim() || !ubicazione?.trim()) {
    return NextResponse.json({ error: 'Compila tutti i campi obbligatori' }, { status: 400 });
  }

  const prezzoNum = Number(prezzo);
  if (isNaN(prezzoNum) || prezzoNum < 0) {
    return NextResponse.json({ error: 'Prezzo non valido' }, { status: 400 });
  }

  const annoNum = anno ? Number(anno) : null;
  if (annoNum !== null && (isNaN(annoNum) || annoNum < 1900 || annoNum > new Date().getFullYear() + 1)) {
    return NextResponse.json({ error: 'Anno non valido' }, { status: 400 });
  }

  if (veicoloid) {
    const v = await prisma.veicolo.findUnique({ where: { id: Number(veicoloid) }, select: { demolitoreid: true } });
    if (!v || v.demolitoreid !== session.id) {
      return NextResponse.json({ error: 'Veicolo sorgente non valido' }, { status: 400 });
    }
  }

  if (modelloAutoId) {
    const m = await prisma.modelloAuto.findUnique({ where: { id: Number(modelloAutoId) }, select: { id: true } });
    if (!m) {
      return NextResponse.json({ error: 'Modello del catalogo non valido' }, { status: 400 });
    }
  }

  const urlsFinali = fotoUrls ?? [];
  const urlsEsistenti = esistente.foto.map((f) => f.url);
  const fotoDaEliminare = esistente.foto.filter((f) => !urlsFinali.includes(f.url));
  const urlsDaAggiungere = urlsFinali.filter((u) => !urlsEsistenti.includes(u));

  await deleteFromR2(fotoDaEliminare.map((f) => f.url));

  const wasVenduto = esistente.stato === 'VENDUTO';
  const isVenduto = stato === 'VENDUTO';

  const dataUpdate: Prisma.RicambioUpdateInput = {
    nome: nome.trim(),
    titolo: titolo?.trim() || null,
    categoria: categoria.trim(),
    categoriaEbayId: categoriaEbayId?.trim() || null,
    marca: marca.trim(),
    modello: modello.trim(),
    anno: annoNum,
    targa: targa?.trim() ? targa.trim().toUpperCase() : null,
    codiceOe: codiceOe?.trim() || null,
    mpn: mpn?.trim() || null,
    ean: ean?.trim() || null,
    quantita: Math.max(1, Number(quantita) || 1),
    condizione: condizione?.trim() || null,
    condDescrizione: condDescrizione?.trim() || null,
    descrizione: descrizione?.trim() || null,
    prezzo: prezzoNum,
    ubicazione: ubicazione.trim().toUpperCase(),
    peso: peso && peso > 0 ? peso : null,
    lunghezzaCm: lunghezzaCm && lunghezzaCm > 0 ? lunghezzaCm : null,
    larghezzaCm: larghezzaCm && larghezzaCm > 0 ? larghezzaCm : null,
    altezzaCm: altezzaCm && altezzaCm > 0 ? altezzaCm : null,
    ...(stato && { stato }),
    ...(pubblicato !== undefined && { pubblicato }),
    ...(!wasVenduto && isVenduto && { venditoIl: new Date() }),
    ...(wasVenduto && !isVenduto && { venditoIl: null }),
    veicolo: veicoloid ? { connect: { id: Number(veicoloid) } } : { disconnect: true },
    modelloAuto: modelloAutoId ? { connect: { id: Number(modelloAutoId) } } : { disconnect: true },
    ...(urlsDaAggiungere.length > 0 && {
      foto: { create: urlsDaAggiungere.map((url) => ({ url })) },
    }),
  };

  try {
    await prisma.$transaction(async (tx) => {
      if (fotoDaEliminare.length > 0) {
        await tx.fotoRicambio.deleteMany({ where: { id: { in: fotoDaEliminare.map((f) => f.id) } } });
      }
      await tx.ricambio.update({ where: { id: idNum }, data: dataUpdate });
      if (compatibilita) {
        await tx.ebayCompatibilita.deleteMany({ where: { ricambioid: idNum } });
        if (compatibilita.length > 0) {
          await tx.ebayCompatibilita.createMany({
            data: compatibilita.map((c) => ({
              ricambioid: idNum,
              marca: c.marca.trim(),
              modello: c.modello.trim(),
              annoInizio: c.annoInizio,
              annoFine: c.annoFine,
              versione: c.versione?.trim() || null,
            })),
          });
        }
      }
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Errore update ricambio:', e);
    return NextResponse.json({ error: 'Errore durante il salvataggio. Riprova.' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const { id } = await params;
  const idNum = Number(id);
  if (isNaN(idNum)) return NextResponse.json({ error: 'ID non valido' }, { status: 400 });

  const ricambio = await prisma.ricambio.findUnique({ where: { id: idNum } });
  if (!ricambio || ricambio.demolitoreid !== session.id) {
    return NextResponse.json({ error: 'Ricambio non trovato' }, { status: 404 });
  }

  let body: { fotoId?: number; stato?: 'DISPONIBILE' | 'RISERVATO' | 'VENDUTO' | 'RITIRATO' };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 }); }

  if (body.fotoId) {
    await prisma.$transaction([
      prisma.fotoRicambio.updateMany({ where: { ricambioid: idNum }, data: { copertina: false } }),
      prisma.fotoRicambio.update({ where: { id: body.fotoId }, data: { copertina: true } }),
    ]);
    return NextResponse.json({ ok: true });
  }

  if (body.stato) {
    const wasVenduto = ricambio.stato === 'VENDUTO';
    const isVenduto = body.stato === 'VENDUTO';
    await prisma.ricambio.update({
      where: { id: idNum },
      data: {
        stato: body.stato,
        ...(!wasVenduto && isVenduto && { venditoIl: new Date() }),
        ...(wasVenduto && !isVenduto && { venditoIl: null }),
      },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Nessun campo da aggiornare' }, { status: 400 });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const { id } = await params;
  const idNum = Number(id);
  if (isNaN(idNum)) return NextResponse.json({ error: 'ID non valido' }, { status: 400 });

  const ricambio = await prisma.ricambio.findUnique({
    where: { id: idNum },
    include: { foto: true, ebayListing: true },
  });
  if (!ricambio || ricambio.demolitoreid !== session.id) {
    return NextResponse.json({ error: 'Ricambio non trovato' }, { status: 404 });
  }

  // Se pubblicato su eBay, ritira/cancella prima dell'eliminazione locale.
  // Errori eBay non bloccano l'eliminazione locale (best-effort): l'utente potrebbe
  // aver già ritirato manualmente, o il token può essere scaduto.
  let ebayWarning: string | null = null;
  if (ricambio.ebayListing) {
    const { withdrawOffer, deleteOffer, deleteInventoryItem } = await import('../../../../lib/ebay/inventory');
    const { offerId, sku, status } = ricambio.ebayListing;
    try {
      if (offerId && status === 'PUBLISHED') {
        try { await withdrawOffer(session.id, offerId); } catch (e) {
          ebayWarning = `Withdraw fallito: ${e instanceof Error ? e.message : 'unknown'}`;
        }
      }
      if (offerId) {
        try { await deleteOffer(session.id, offerId); } catch { /* ignore */ }
      }
      if (sku) {
        try { await deleteInventoryItem(session.id, sku); } catch { /* ignore */ }
      }
    } catch (e) {
      ebayWarning = `Errore sync eBay: ${e instanceof Error ? e.message : 'unknown'}`;
    }
  }

  await deleteFromR2(ricambio.foto.map((f) => f.url));
  await prisma.ricambio.delete({ where: { id: idNum } });

  return NextResponse.json({ ok: true, ebayWarning });
}
