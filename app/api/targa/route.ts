import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getSession } from '../../../lib/session';
import { getMaxTarga } from '../../../lib/piani';

interface TargaScanResponse {
  targa?: string;
  marca?: string;
  modello?: string;
  allestimento?: string;
  data?: string;           // "YYYY-MM-DD"
  cilindrata?: string;     // es. "1300"
  alimentazione?: string;  // es. "Benzina"
  kw?: string | number;    // es. "68.0"
  extra?: {
    listEngines?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

function inizioMese(): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET(request: NextRequest) {
  // Autenticazione obbligatoria: la ricerca targa consuma il credito mensile
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Accedi per usare la ricerca targa' }, { status: 401 });
  }

  const targa = request.nextUrl.searchParams.get('targa')?.trim().toUpperCase() ?? '';

  if (!targa) {
    return NextResponse.json({ error: 'Targa mancante' }, { status: 400 });
  }

  if (!/^[A-Z]{2}\d{3}[A-Z]{2}$/.test(targa)) {
    return NextResponse.json({ error: 'Formato targa non valido (es. AB123CD)' }, { status: 400 });
  }

  // Controlla il limite mensile del piano
  const demolitore = await prisma.demolitore.findUnique({
    where: { id: session.id },
    select: { piano: true },
  });
  const maxTarga = getMaxTarga(demolitore?.piano ?? 'FREE');

  if (maxTarga !== Infinity) {
    const usate = await prisma.targaLookup.count({
      where: {
        demolitoreid: session.id,
        createdAt: { gte: inizioMese() },
      },
    });

    if (usate >= maxTarga) {
      return NextResponse.json(
        {
          error: `Hai esaurito le ${maxTarga} ricerche targa del mese. Aggiorna il piano su /abbonamento per continuare.`,
          limitReached: true,
          usate,
          massimo: maxTarga,
        },
        { status: 429 },
      );
    }
  }

  // Cache hit — non chiama l'API esterna ma conta comunque come lookup
  const cached = await prisma.targaCache.findUnique({ where: { targa } });
  if (cached) {
    console.log('[targa] cache hit:', targa);
    await prisma.targaLookup.create({ data: { demolitoreid: session.id, targa } });
    return NextResponse.json({
      marca:       cached.marca,
      modello:     cached.modello,
      versione:    cached.versione,
      anno:        cached.anno,
      cilindrata:  cached.cilindrata,
      siglaMotore: cached.siglaMotore,
      carburante:  cached.carburante,
      potenzaKw:   cached.potenzaKw,
    });
  }

  // Chiama TargaScan
  const rapidApiKey  = process.env.RAPIDAPI_KEY;
  const rapidApiHost = process.env.RAPIDAPI_HOST ?? 'targa-scan.p.rapidapi.com';

  if (!rapidApiKey) {
    return NextResponse.json({ error: 'Chiave API non configurata' }, { status: 503 });
  }

  let raw: TargaScanResponse;
  try {
    const res = await fetch(`https://${rapidApiHost}/${encodeURIComponent(targa)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-key':  rapidApiKey,
        'x-rapidapi-host': rapidApiHost,
      },
    });

    console.log('[targa] TargaScan status:', res.status);

    if (res.status === 404) {
      return NextResponse.json({ error: 'Veicolo non trovato' }, { status: 404 });
    }
    if (res.status === 429) {
      return NextResponse.json({ error: 'Limite richieste raggiunto, riprova tra un momento' }, { status: 429 });
    }
    if (!res.ok) {
      const body = await res.text();
      console.error('[targa] TargaScan error:', body);
      return NextResponse.json({ error: 'Errore servizio targa' }, { status: 502 });
    }

    raw = await res.json() as TargaScanResponse;
    console.log('[targa] raw:', JSON.stringify(raw));
  } catch (err) {
    console.error('[targa] fetch error:', err);
    return NextResponse.json({ error: 'Impossibile contattare il servizio targa' }, { status: 502 });
  }

  // Normalizza
  const marca       = String(raw.marca ?? '').trim();
  const modello     = String(raw.modello ?? '').trim();
  const versione    = String(raw.allestimento ?? '').trim();
  const cilindrata  = raw.cilindrata != null ? String(raw.cilindrata).trim() : '';
  const carburante  = String(raw.alimentazione ?? '').trim();
  const siglaMotore = String(raw.extra?.listEngines ?? '').trim();
  const potenzaKw   = Math.round(Number(raw.kw ?? 0));
  const anno        = raw.data ? Number(String(raw.data).slice(0, 4)) : 0;

  if (!marca || !modello) {
    return NextResponse.json({ error: 'Veicolo non trovato' }, { status: 404 });
  }

  const normalized = { marca, modello, versione, anno, cilindrata, siglaMotore, carburante, potenzaKw };

  // Salva in cache + registra lookup (in parallelo)
  await Promise.allSettled([
    prisma.targaCache.create({ data: { targa, ...normalized } }).catch(() => {}),
    prisma.targaLookup.create({ data: { demolitoreid: session.id, targa } }),
  ]);

  return NextResponse.json(normalized);
}
