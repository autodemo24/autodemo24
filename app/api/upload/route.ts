import { NextResponse } from 'next/server';
import { getSession } from '../../../lib/session';
import { uploadBufferToR2 } from '../../../lib/upload-to-r2';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  let formData: FormData;
  try { formData = await request.formData(); } catch {
    return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'Nessun file fornito' }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: 'Formato non supportato' }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'File troppo grande (max 10 MB)' }, { status: 400 });

  const inputBuffer = Buffer.from(await file.arrayBuffer());

  try {
    const result = await uploadBufferToR2(inputBuffer, session.id, 'veicoli');
    return NextResponse.json({
      url: result.url,
      originalSize: result.originalSize,
      webpSize: result.webpSize,
      compressed: result.compressed,
    });
  } catch (e) {
    console.error('upload error:', e);
    return NextResponse.json({ error: 'Errore durante il caricamento della foto' }, { status: 500 });
  }
}
