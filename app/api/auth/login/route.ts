import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { verifyPassword } from '../../../../lib/auth';
import { createSession } from '../../../../lib/session';

export async function POST(request: Request) {
  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 });
  }

  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ error: 'Email e password sono obbligatorie' }, { status: 400 });
  }

  try {
    const demolitore = await prisma.demolitore.findUnique({ where: { email } });

    if (!demolitore || !verifyPassword(password, demolitore.password)) {
      return NextResponse.json({ error: 'Credenziali non valide' }, { status: 401 });
    }

    await createSession({
      id: demolitore.id,
      ragioneSociale: demolitore.ragioneSociale,
      email: demolitore.email,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Errore del server. Riprova più tardi.' }, { status: 500 });
  }
}
