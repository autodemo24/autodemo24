import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '../../../lib/session';
import { prisma } from '../../../lib/prisma';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { fotoUrl, veicoloId, confirmed, rejected, addedManually } = body as {
      fotoUrl: string;
      veicoloId: number | null;
      confirmed: string[];
      rejected: string[];
      addedManually: string[];
    };

    if (!fotoUrl) {
      return NextResponse.json({ error: 'fotoUrl obbligatorio' }, { status: 400 });
    }

    const feedback = await prisma.aiFeedback.create({
      data: {
        fotoUrl,
        veicoloId: veicoloId ?? null,
        confirmed: confirmed ?? [],
        rejected: rejected ?? [],
        addedManually: addedManually ?? [],
      },
    });

    return NextResponse.json({ status: 'saved', id: feedback.id });
  } catch (err) {
    console.error('Errore salvataggio AI feedback:', err);
    return NextResponse.json(
      { error: 'Errore durante il salvataggio del feedback' },
      { status: 500 },
    );
  }
}
