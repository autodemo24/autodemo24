import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { WebSearchTool20250305 } from '@anthropic-ai/sdk/resources/messages/messages';

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
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      tools: [
        {
          type: 'web_search_20250305',
          name: 'web_search',
        } satisfies WebSearchTool20250305,
      ],
      messages: [
        {
          role: 'user',
          content: `Cerca online la targa italiana "${targa}" e trova il veicolo corrispondente (marca, modello, anno di immatricolazione, cilindrata, sigla motore). Rispondi SOLO con un oggetto JSON (senza markdown, senza backtick) con questi campi:
- marca: string (es. "Fiat", "Volkswagen")
- modello: string (es. "Punto", "Golf")
- anno: number (anno di immatricolazione)
- cilindrata: string (es. "1.4", "2.0 TDI") oppure stringa vuota se non determinabile
- siglaMotore: string (es. "188A4000", "BKD") oppure stringa vuota se non determinabile

Se non riesci a trovare il veicolo, rispondi con: {"error":"Veicolo non trovato"}
Rispondi SOLO con il JSON, nessun altro testo.`,
        },
      ],
    });

    // With web_search, content may contain tool_use/tool_result blocks before the final text
    const textBlock = message.content.findLast((block) => block.type === 'text');
    const text = textBlock?.type === 'text' ? textBlock.text.trim() : '';

    // Strip markdown code fences if model wraps the JSON anyway
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(cleaned);
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
