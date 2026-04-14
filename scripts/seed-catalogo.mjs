import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SEED_FILE = join(__dirname, '..', 'data', 'catalogo-seed.json');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' });
const prisma = new PrismaClient({ adapter });

async function main() {
  const raw = await readFile(SEED_FILE, 'utf8');
  const data = JSON.parse(raw);

  let inserted = 0;
  let skipped = 0;
  let updated = 0;
  const perMarca = {};

  for (const [marca, modelli] of Object.entries(data)) {
    if (marca.startsWith('_')) continue;
    perMarca[marca] = 0;
    for (const m of modelli) {
      const existing = await prisma.modelloAuto.findFirst({
        where: {
          marca,
          modello: m.modello,
          serie: m.serie,
          annoInizio: m.annoInizio,
        },
      });
      if (existing) {
        skipped++;
      } else {
        await prisma.modelloAuto.create({
          data: {
            marca,
            modello: m.modello,
            serie: m.serie,
            annoInizio: m.annoInizio,
            annoFine: m.annoFine,
          },
        });
        inserted++;
        perMarca[marca]++;
      }
    }
  }

  console.log('\n=== Seed completato ===');
  console.log(`Inseriti: ${inserted}`);
  console.log(`Saltati (già presenti): ${skipped}`);
  console.log(`Aggiornati: ${updated}`);
  console.log('\nPer marca:');
  for (const [marca, count] of Object.entries(perMarca).sort(([a], [b]) => a.localeCompare(b))) {
    if (count > 0) console.log(`  ${marca}: ${count}`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
