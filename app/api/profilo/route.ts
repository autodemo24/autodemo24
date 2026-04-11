import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getSession, createSession } from '../../../lib/session';
import { PROVINCE } from '../../../lib/province';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const demolitore = await prisma.demolitore.findUnique({
    where: { id: session.id },
    select: {
      ragioneSociale: true,
      piva: true,
      email: true,
      telefono: true,
      indirizzo: true,
      provincia: true,
      descrizione: true,
    },
  });

  if (!demolitore) return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });
  return NextResponse.json(demolitore);
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 });
  }

  const { ragioneSociale, telefono, indirizzo, provincia, descrizione } = body as {
    ragioneSociale?: string;
    telefono?: string;
    indirizzo?: string;
    provincia?: string;
    descrizione?: string;
  };

  if (!ragioneSociale?.trim())
    return NextResponse.json({ error: 'La ragione sociale è obbligatoria' }, { status: 400 });
  if (!telefono?.trim())
    return NextResponse.json({ error: 'Il telefono è obbligatorio' }, { status: 400 });
  if (!indirizzo?.trim())
    return NextResponse.json({ error: "L'indirizzo è obbligatorio" }, { status: 400 });
  if (!provincia?.trim() || !PROVINCE.includes(provincia.trim() as (typeof PROVINCE)[number]))
    return NextResponse.json({ error: 'Provincia non valida' }, { status: 400 });

  try {
    const updated = await prisma.demolitore.update({
      where: { id: session.id },
      data: {
        ragioneSociale: ragioneSociale.trim(),
        telefono: telefono.trim(),
        indirizzo: indirizzo.trim(),
        provincia: provincia.trim(),
        descrizione: descrizione?.trim() ?? '',
      },
      select: { ragioneSociale: true, email: true },
    });

    // Aggiorna il cookie di sessione con la nuova ragione sociale
    await createSession({ id: session.id, ragioneSociale: updated.ragioneSociale, email: updated.email });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Errore durante il salvataggio. Riprova.' }, { status: 500 });
  }
}
