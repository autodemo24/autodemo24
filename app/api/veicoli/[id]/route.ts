import { NextResponse } from 'next/server';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from '../../../../lib/prisma';
import { getSession } from '../../../../lib/session';

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

// ── PUT /api/veicoli/[id] ──────────────────────────────────────────────────
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const { id } = await params;
  const idNum = Number(id);
  if (isNaN(idNum)) return NextResponse.json({ error: 'ID non valido' }, { status: 400 });

  // Verifica proprietà
  const esistente = await prisma.veicolo.findUnique({
    where: { id: idNum },
    include: { foto: true },
  });
  if (!esistente || esistente.demolitoreid !== session.id) {
    return NextResponse.json({ error: 'Veicolo non trovato' }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 });
  }

  const { marca, modello, anno, targa, km, versione, cilindrata, siglaMotore, carburante, potenzaKw, ricambi, fotoUrls } = body as {
    marca: string;
    modello: string;
    anno: number;
    targa: string;
    km: number;
    versione?: string | null;
    cilindrata?: string | null;
    siglaMotore?: string | null;
    carburante?: string | null;
    potenzaKw?: number | null;
    ricambi?: string[];
    fotoUrls?: string[];
  };

  if (!marca?.trim() || !modello?.trim() || !anno || !targa?.trim() || km === undefined) {
    return NextResponse.json({ error: 'Tutti i campi obbligatori devono essere compilati' }, { status: 400 });
  }

  const targaNorm = targa.trim().toUpperCase();
  if (!/^[A-Z]{2}\d{3}[A-Z]{2}$/.test(targaNorm)) {
    return NextResponse.json({ error: 'Formato targa non valido (es. AB123CD)' }, { status: 400 });
  }
  const annoNum = Number(anno);
  if (isNaN(annoNum) || annoNum < 1900 || annoNum > new Date().getFullYear() + 1) {
    return NextResponse.json({ error: 'Anno non valido' }, { status: 400 });
  }
  const kmNum = Number(km);
  if (isNaN(kmNum) || kmNum < 0) {
    return NextResponse.json({ error: 'Chilometraggio non valido' }, { status: 400 });
  }

  const urlsFinali = fotoUrls ?? [];
  const urlsEsistenti = esistente.foto.map((f) => f.url);

  // Foto da rimuovere: erano presenti ma non sono nelle urlsFinali
  const fotoDaEliminare = esistente.foto.filter((f) => !urlsFinali.includes(f.url));
  // Foto da aggiungere: sono nelle urlsFinali ma non erano presenti
  const urlsDaAggiungere = urlsFinali.filter((u) => !urlsEsistenti.includes(u));

  // Rimuovi da R2 (best-effort, non blocca il salvataggio)
  await deleteFromR2(fotoDaEliminare.map((f) => f.url));

  try {
    await prisma.$transaction(async (tx) => {
      if (fotoDaEliminare.length > 0) {
        await tx.fotoVeicolo.deleteMany({ where: { id: { in: fotoDaEliminare.map((f) => f.id) } } });
      }
      await tx.ricambio.deleteMany({ where: { veicoloid: idNum } });
      await tx.veicolo.update({
        where: { id: idNum },
        data: {
          marca: marca.trim(),
          modello: modello.trim(),
          anno: annoNum,
          targa: targaNorm,
          km: kmNum,
          versione:    versione    ?? null,
          cilindrata:  cilindrata  ?? null,
          siglaMotore: siglaMotore ?? null,
          carburante:  carburante  ?? null,
          potenzaKw:   potenzaKw   ?? null,
          ricambi: { create: (ricambi ?? []).map((nome) => ({ nome, disponibile: true })) },
          ...(urlsDaAggiungere.length > 0 && {
            foto: { create: urlsDaAggiungere.map((url) => ({ url })) },
          }),
        },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const prismaErr = err as { code?: string };
    if (prismaErr?.code === 'P2002') {
      return NextResponse.json({ error: 'Targa già presente nel sistema' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Errore durante il salvataggio. Riprova.' }, { status: 500 });
  }
}

// ── PATCH /api/veicoli/[id] — imposta foto copertina ──────────────────────
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const { id } = await params;
  const idNum = Number(id);
  if (isNaN(idNum)) return NextResponse.json({ error: 'ID non valido' }, { status: 400 });

  const veicolo = await prisma.veicolo.findUnique({ where: { id: idNum } });
  if (!veicolo || veicolo.demolitoreid !== session.id) {
    return NextResponse.json({ error: 'Veicolo non trovato' }, { status: 404 });
  }

  let body: { fotoId?: number };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 }); }

  const { fotoId } = body;
  if (!fotoId) return NextResponse.json({ error: 'fotoId mancante' }, { status: 400 });

  // Rimuovi copertina da tutte le foto del veicolo, poi imposta quella scelta
  await prisma.$transaction([
    prisma.fotoVeicolo.updateMany({ where: { veicoloid: idNum }, data: { copertina: false } }),
    prisma.fotoVeicolo.update({ where: { id: fotoId }, data: { copertina: true } }),
  ]);

  return NextResponse.json({ ok: true });
}

// ── DELETE /api/veicoli/[id] ───────────────────────────────────────────────
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const { id } = await params;
  const idNum = Number(id);
  if (isNaN(idNum)) return NextResponse.json({ error: 'ID non valido' }, { status: 400 });

  const veicolo = await prisma.veicolo.findUnique({
    where: { id: idNum },
    include: { foto: true },
  });
  if (!veicolo || veicolo.demolitoreid !== session.id) {
    return NextResponse.json({ error: 'Veicolo non trovato' }, { status: 404 });
  }

  // Rimuovi tutte le foto da R2
  await deleteFromR2(veicolo.foto.map((f) => f.url));

  // Elimina dal DB (FK: prima ricambi e foto, poi il veicolo)
  await prisma.$transaction([
    prisma.fotoVeicolo.deleteMany({ where: { veicoloid: idNum } }),
    prisma.ricambio.deleteMany({ where: { veicoloid: idNum } }),
    prisma.veicolo.delete({ where: { id: idNum } }),
  ]);

  return NextResponse.json({ ok: true });
}
