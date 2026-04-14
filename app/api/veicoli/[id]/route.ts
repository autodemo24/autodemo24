import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getSession } from '../../../../lib/session';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const { id } = await params;
  const idNum = Number(id);
  if (isNaN(idNum)) return NextResponse.json({ error: 'ID non valido' }, { status: 400 });

  const esistente = await prisma.veicolo.findUnique({ where: { id: idNum } });
  if (!esistente || esistente.demolitoreid !== session.id) {
    return NextResponse.json({ error: 'Veicolo non trovato' }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 }); }

  const { marca, modello, anno, targa, km, versione, cilindrata, siglaMotore, carburante, potenzaKw } = body as {
    marca: string; modello: string; anno: number; targa: string; km: number;
    versione?: string | null; cilindrata?: string | null; siglaMotore?: string | null;
    carburante?: string | null; potenzaKw?: number | null;
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

  try {
    await prisma.veicolo.update({
      where: { id: idNum },
      data: {
        marca: marca.trim(),
        modello: modello.trim(),
        anno: annoNum,
        targa: targaNorm,
        km: kmNum,
        versione: versione ?? null,
        cilindrata: cilindrata ?? null,
        siglaMotore: siglaMotore ?? null,
        carburante: carburante ?? null,
        potenzaKw: potenzaKw ?? null,
      },
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

  await prisma.$transaction([
    prisma.ricambio.updateMany({ where: { veicoloid: idNum }, data: { veicoloid: null } }),
    prisma.fotoVeicolo.deleteMany({ where: { veicoloid: idNum } }),
    prisma.veicolo.delete({ where: { id: idNum } }),
  ]);

  return NextResponse.json({ ok: true });
}
