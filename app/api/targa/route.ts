import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(request: NextRequest) {
  const targa = request.nextUrl.searchParams.get('targa')?.trim().toUpperCase() ?? '';

  if (!targa) {
    return NextResponse.json({ error: 'Targa mancante' }, { status: 400 });
  }

  if (!/^[A-Z]{2}\d{3}[A-Z]{2}$/.test(targa)) {
    return NextResponse.json({ error: 'Formato targa non valido (es. AB123CD)' }, { status: 400 });
  }

  // 1) Cerca nella cache
  const cached = await prisma.targaCache.findUnique({ where: { targa } });
  if (cached) {
    console.log('[targa] cache hit:', targa);
    return NextResponse.json({
      marca: cached.marca,
      modello: cached.modello,
      versione: cached.versione,
      anno: cached.anno,
      cilindrata: cached.cilindrata,
      siglaMotore: cached.siglaMotore,
      carburante: cached.carburante,
      potenzaKw: cached.potenzaKw,
    });
  }

  // 2) Chiama TargaScan via RapidAPI
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  const rapidApiHost = process.env.RAPIDAPI_HOST ?? 'targascan.p.rapidapi.com';

  if (!rapidApiKey) {
    return NextResponse.json({ error: 'Chiave API non configurata' }, { status: 503 });
  }

  let apiData: Record<string, unknown>;
  try {
    const res = await fetch(
      `https://${rapidApiHost}/api/targa/${encodeURIComponent(targa)}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-key': rapidApiKey,
          'x-rapidapi-host': rapidApiHost,
        },
      },
    );

    console.log('[targa] RapidAPI status:', res.status);

    if (res.status === 404) {
      return NextResponse.json({ error: 'Veicolo non trovato' }, { status: 404 });
    }

    if (!res.ok) {
      const body = await res.text();
      console.error('[targa] RapidAPI error body:', body);
      return NextResponse.json({ error: 'Errore servizio targa' }, { status: 502 });
    }

    const raw = await res.json();
    console.log('[targa] RapidAPI raw response:', JSON.stringify(raw));
    apiData = raw as Record<string, unknown>;
  } catch (err) {
    console.error('[targa] RapidAPI fetch error:', err);
    return NextResponse.json({ error: 'Impossibile contattare il servizio targa' }, { status: 502 });
  }

  // 3) Normalizza la risposta (adatta i nomi dei campi alla risposta reale di TargaScan)
  const normalized = {
    marca:       String(apiData.marca       ?? apiData.Marca       ?? apiData.brand        ?? ''),
    modello:     String(apiData.modello     ?? apiData.Modello     ?? apiData.model        ?? ''),
    versione:    String(apiData.versione    ?? apiData.Versione    ?? apiData.version      ?? ''),
    anno:        Number(apiData.anno        ?? apiData.Anno        ?? apiData.year         ?? 0),
    cilindrata:  String(apiData.cilindrata  ?? apiData.Cilindrata  ?? apiData.displacement ?? ''),
    siglaMotore: String(apiData.siglaMotore ?? apiData.SiglaMotore ?? apiData.engineCode   ?? ''),
    carburante:  String(apiData.carburante  ?? apiData.Carburante  ?? apiData.fuel         ?? ''),
    potenzaKw:   Number(apiData.potenzaKw   ?? apiData.PotenzaKw   ?? apiData.powerKw      ?? apiData.power ?? 0),
  };

  if (!normalized.marca || !normalized.modello) {
    return NextResponse.json({ error: 'Veicolo non trovato' }, { status: 404 });
  }

  // 4) Salva in cache per le prossime ricerche
  try {
    await prisma.targaCache.create({ data: { targa, ...normalized } });
    console.log('[targa] salvato in cache:', targa);
  } catch (err) {
    // Non bloccare la risposta se il salvataggio fallisce (es. race condition unique)
    console.warn('[targa] cache save failed:', err);
  }

  return NextResponse.json(normalized);
}
