import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from '../../../../../lib/prisma';
import { getSession } from '../../../../../lib/session';
import { getShipmentLabel } from '../../../../../lib/spediamopro/shipments';

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

// Scarica etichetta ex-post per una spedizione già creata.
// Utile se il download durante accept ha fallito.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const { id } = await params;
  const idNum = Number(id);
  if (isNaN(idNum)) return NextResponse.json({ error: 'ID non valido' }, { status: 400 });

  const ordine = await prisma.ordine.findUnique({
    where: { id: idNum },
    include: { spedizione: true },
  });
  if (!ordine || ordine.demolitoreid !== session.id) {
    return NextResponse.json({ error: 'Ordine non trovato' }, { status: 404 });
  }
  if (!ordine.spedizione?.spShipmentId) {
    return NextResponse.json({ error: 'Nessuna spedizione associata a questo ordine' }, { status: 400 });
  }

  try {
    const label = await getShipmentLabel(session.id, ordine.spedizione.spShipmentId);
    const key = `spedizioni/${ordine.demolitoreid}/${ordine.spedizione.spShipmentId}_${crypto.randomBytes(4).toString('hex')}.pdf`;
    await s3.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: label.buffer,
      ContentType: label.contentType || 'application/pdf',
    }));
    const labelUrl = `${process.env.R2_PUBLIC_URL!.replace(/\/$/, '')}/${key}`;
    await prisma.spedizione.update({
      where: { id: ordine.spedizione.id },
      data: { labelUrl },
    });
    return NextResponse.json({ ok: true, labelUrl });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
