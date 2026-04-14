import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });
dotenv.config({ path: join(__dirname, '..', '.env.local'), override: true });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' });
const prisma = new PrismaClient({ adapter });

const rows = await prisma.modelloAuto.findMany({
  orderBy: [{ marca: 'asc' }, { modello: 'asc' }],
});

// Raggruppa per marca normalizzata
const byNormMarca = new Map();
for (const r of rows) {
  const key = r.marca.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').trim();
  if (!byNormMarca.has(key)) byNormMarca.set(key, []);
  byNormMarca.get(key).push(r);
}

console.log('\n=== Marche con varianti di grafia ===\n');
for (const [norm, list] of byNormMarca) {
  const marchi = new Set(list.map((r) => r.marca));
  if (marchi.size > 1) {
    console.log(`[${norm}]  varianti: ${Array.from(marchi).join(' | ')}  → ${list.length} righe`);
  }
}

await prisma.$disconnect();
