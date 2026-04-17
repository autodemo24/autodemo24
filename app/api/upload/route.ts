import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { getSession } from '../../../lib/session';

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB input (poi ridotto a WebP)

// Dimensione massima lato lungo in px (preserva aspect ratio). Riduce peso drasticamente.
const MAX_DIMENSION = 2000;
const WEBP_QUALITY = 82;

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

  // Converti in WebP + resize se troppo grande
  let outputBuffer: Buffer;
  try {
    outputBuffer = await sharp(inputBuffer)
      .rotate() // auto-oriented da EXIF
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
  } catch (e) {
    console.error('Sharp conversion error:', e);
    return NextResponse.json({ error: 'Impossibile processare l\'immagine' }, { status: 400 });
  }

  const key = `veicoli/${session.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;

  try {
    await s3.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: outputBuffer,
      ContentType: 'image/webp',
      CacheControl: 'public, max-age=31536000, immutable',
    }));
    const url = `${process.env.R2_PUBLIC_URL}/${key}`;
    return NextResponse.json({
      url,
      originalSize: inputBuffer.length,
      webpSize: outputBuffer.length,
      compressed: Math.round((1 - outputBuffer.length / inputBuffer.length) * 100),
    });
  } catch (err) {
    console.error('R2 upload error:', err);
    return NextResponse.json({ error: 'Errore durante il caricamento della foto' }, { status: 500 });
  }
}
