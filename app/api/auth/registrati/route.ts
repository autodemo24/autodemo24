import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { hashPassword } from '../../../../lib/auth';

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 });
  }

  const {
    ragioneSociale,
    piva,
    email,
    password,
    telefono,
    indirizzo,
    provincia,
    descrizione
  } = body as Record<string, string>;

  // Validazione campi obbligatori
  if (!ragioneSociale || !piva || !email || !password || !telefono || !indirizzo || !provincia || !descrizione) {
    return NextResponse.json({ error: 'Tutti i campi sono obbligatori' }, { status: 400 });
  }

  // Validazione P.IVA italiana (11 cifre)
  if (!/^\d{11}$/.test(piva)) {
    return NextResponse.json({ error: 'P.IVA non valida: deve contenere esattamente 11 cifre' }, { status: 400 });
  }

  // Validazione email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Indirizzo email non valido' }, { status: 400 });
  }

  // Validazione password (minimo 8 caratteri)
  if (password.length < 8) {
    return NextResponse.json({ error: 'La password deve essere di almeno 8 caratteri' }, { status: 400 });
  }

  try {
    const [existingByEmail, existingByPiva] = await Promise.all([
      prisma.demolitore.findUnique({ where: { email } }),
      prisma.demolitore.findUnique({ where: { piva } }),
    ]);

    if (existingByEmail) {
      return NextResponse.json({ error: 'Email già registrata' }, { status: 409 });
    }
    if (existingByPiva) {
      return NextResponse.json({ error: 'P.IVA già registrata' }, { status: 409 });
    }

    const hashedPassword = hashPassword(password);

    const demolitore = await prisma.demolitore.create({
      data: {
        ragioneSociale,
        piva,
        email,
        password: hashedPassword,
        telefono,
        indirizzo,
        provincia,
        descrizione,
        abbonamentoAttivo: false
      },
      select: {
        id: true,
        ragioneSociale: true,
        email: true,
        provincia: true,
        abbonamentoAttivo: true
      }
    });

    return NextResponse.json(demolitore, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Errore del server. Riprova più tardi.' }, { status: 500 });
  }
}
