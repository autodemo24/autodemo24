import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '../../../lib/session';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// GET /api/ai-training — stato del training
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  try {
    const res = await fetch(`${AI_SERVICE_URL}/training/status`);
    if (!res.ok) return NextResponse.json({ running: false, progress: 'Microservizio non disponibile' });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ running: false, progress: 'Microservizio non raggiungibile' });
  }
}

// POST /api/ai-training — avvia training
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  try {
    const res = await fetch(`${AI_SERVICE_URL}/training/start`, { method: 'POST' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: data.error ?? 'Errore avvio training' },
        { status: 502 },
      );
    }
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json(
      { error: 'Microservizio AI non raggiungibile. Assicurati che sia avviato.' },
      { status: 502 },
    );
  }
}
