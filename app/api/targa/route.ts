import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function GET(request: NextRequest) {
  const targa = request.nextUrl.searchParams.get('targa')?.trim().toUpperCase() ?? '';

  if (!targa) {
    return NextResponse.json({ error: 'Targa mancante' }, { status: 400 });
  }

  if (!/^[A-Z]{2}\d{3}[A-Z]{2}$/.test(targa)) {
    return NextResponse.json({ error: 'Formato targa non valido (es. AB123CD)' }, { status: 400 });
  }

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: `Sei un esperto di veicoli italiani. Data la targa italiana "${targa}", rispondi SOLO con un oggetto JSON (senza markdown, senza backtick) con questi campi:
- marca: string (es. "Fiat", "Volkswagen")
- modello: string (es. "Punto", "Golf")
- anno: number (anno di immatricolazione approssimativo)
- cilindrata: string (es. "1.4", "2.0 TDI") oppure stringa vuota se non determinabile
- siglaMotore: string (es. "188A4000", "BKD") oppure stringa vuota se non determinabile

Se non riesci a determinare il veicolo dalla targa, rispondi con: {"error":"Veicolo non trovato"}
Rispondi SOLO con il JSON, nessun altro testo.`,
        },
      ],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text.trim() : '';

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: 'Risposta non valida dal modello AI' }, { status: 500 });
    }

    if (parsed.error) {
      return NextResponse.json({ error: parsed.error }, { status: 404 });
    }

    return NextResponse.json({
      marca: String(parsed.marca ?? ''),
      modello: String(parsed.modello ?? ''),
      anno: Number(parsed.anno ?? 0),
      cilindrata: String(parsed.cilindrata ?? ''),
      siglaMotore: String(parsed.siglaMotore ?? ''),
    });
  } catch (err) {
    console.error('Anthropic API error:', err);
    return NextResponse.json({ error: 'Errore durante la ricerca' }, { status: 500 });
  }
}
