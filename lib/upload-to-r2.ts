import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const MAX_DIMENSION = 2000;
const WEBP_QUALITY = 82;

export type UploadFolder = 'veicoli' | 'ricambi';

export type UploadResult = {
  url: string;
  key: string;
  originalSize: number;
  webpSize: number;
  compressed: number;
};

export async function uploadBufferToR2(
  inputBuffer: Buffer,
  demolitoreid: number,
  folder: UploadFolder = 'ricambi',
): Promise<UploadResult> {
  const outputBuffer = await sharp(inputBuffer)
    .rotate()
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

  const key = `${folder}/${demolitoreid}/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;

  await s3.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    Body: outputBuffer,
    ContentType: 'image/webp',
    CacheControl: 'public, max-age=31536000, immutable',
  }));

  return {
    url: `${process.env.R2_PUBLIC_URL}/${key}`,
    key,
    originalSize: inputBuffer.length,
    webpSize: outputBuffer.length,
    compressed: Math.round((1 - outputBuffer.length / inputBuffer.length) * 100),
  };
}
