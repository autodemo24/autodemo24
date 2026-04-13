import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '../../../lib/session';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { fotoUrls, confidenceThreshold } = body as {
      fotoUrls: string[];
      confidenceThreshold?: number;
    };

    if (!fotoUrls || fotoUrls.length === 0) {
      return NextResponse.json({ error: 'Nessuna foto fornita' }, { status: 400 });
    }

    const res = await fetch(`${AI_SERVICE_URL}/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_urls: fotoUrls,
        confidence_threshold: confidenceThreshold ?? 0.5,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.error('Errore microservizio AI:', errData);
      return NextResponse.json(
        { error: 'Errore durante l\'analisi AI' },
        { status: 502 },
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('Errore proxy ai-detect:', err);
    return NextResponse.json(
      { error: 'Impossibile contattare il servizio AI' },
      { status: 502 },
    );
  }
}
