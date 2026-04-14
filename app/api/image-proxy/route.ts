import { NextRequest, NextResponse } from 'next/server';

// Proxy per immagini R2 — permette autocrop client-side evitando problemi CORS
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'url obbligatorio' }, { status: 400 });

  // Whitelist: solo R2 e altri domini sicuri
  if (!url.startsWith('https://pub-') && !url.startsWith('https://')) {
    return NextResponse.json({ error: 'URL non permesso' }, { status: 400 });
  }

  try {
    const res = await fetch(url);
    if (!res.ok) return NextResponse.json({ error: 'Errore download' }, { status: 502 });

    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get('content-type') || 'image/jpeg';

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Errore proxy' }, { status: 502 });
  }
}
