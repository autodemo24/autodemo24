import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SEED_FILE = join(__dirname, '..', 'data', 'catalogo-seed.json');
const ENRICHED_FILE = join(__dirname, '..', 'data', 'catalogo-enriched.json');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' });
const prisma = new PrismaClient({ adapter });

async function loadJson(path) {
  if (!existsSync(path)) return null;
  const raw = await readFile(path, 'utf8');
  return JSON.parse(raw);
}

// Merge: seed (LLM, serie precise) è autoritativo per ogni (marca, modello).
// Enriched (NHTSA, flat) entra solo se il seed non ha quel modello per quella marca.
function mergeCatalogs(seed, enriched) {
  const merged = {};

  for (const [marca, modelli] of Object.entries(seed)) {
    if (marca.startsWith('_')) continue;
    merged[marca] = modelli.map((m) => ({
      ...m,
      sources: Array.isArray(m.sources) ? m.sources : ['seed-llm'],
    }));
  }

  if (!enriched) return merged;

  for (const [marca, modelli] of Object.entries(enriched)) {
    if (marca.startsWith('_')) continue;
    const seedList = merged[marca] ?? [];
    const modelliSeed = new Set(seedList.map((m) => m.modello.toLowerCase()));

    if (!merged[marca]) merged[marca] = [];

    for (const m of modelli) {
      if (modelliSeed.has(m.modello.toLowerCase())) continue;
      merged[marca].push({
        modello: m.modello,
        serie: m.serie,
        annoInizio: m.annoInizio,
        annoFine: m.annoFine,
        sources: Array.isArray(m.sources) ? m.sources : ['nhtsa'],
      });
    }
  }

  return merged;
}

async function main() {
  const seed = await loadJson(SEED_FILE);
  const enriched = await loadJson(ENRICHED_FILE);

  if (!seed) {
    console.error(`Seed file mancante: ${SEED_FILE}`);
    process.exit(1);
  }
  if (!enriched) {
    console.log(`Nota: ${ENRICHED_FILE} non presente — esegui prima "node scripts/enrich-catalogo.mjs" per arricchire da NHTSA.`);
  }

  const merged = mergeCatalogs(seed, enriched);

  let inserted = 0;
  let skipped = 0;
  const perMarca = {};

  for (const [marca, modelli] of Object.entries(merged)) {
    perMarca[marca] = 0;
    for (const m of modelli) {
      const existing = await prisma.modelloAuto.findFirst({
        where: { marca, modello: m.modello, serie: m.serie, annoInizio: m.annoInizio },
        select: { id: true, sources: true },
      });

      if (existing) {
        const nuove = (m.sources ?? []).filter((s) => !existing.sources.includes(s));
        if (nuove.length > 0) {
          await prisma.modelloAuto.update({
            where: { id: existing.id },
            data: { sources: { set: [...existing.sources, ...nuove] } },
          });
        }
        skipped++;
      } else {
        await prisma.modelloAuto.create({
          data: {
            marca,
            modello: m.modello,
            serie: m.serie,
            annoInizio: m.annoInizio,
            annoFine: m.annoFine ?? null,
            sources: m.sources ?? [],
            verified: true,
          },
        });
        inserted++;
        perMarca[marca]++;
      }
    }
  }

  console.log('\n=== Seed completato ===');
  console.log(`Inseriti: ${inserted}`);
  console.log(`Saltati (già presenti, sources aggiornate se necessario): ${skipped}`);
  console.log('\nNuovi per marca:');
  for (const [marca, count] of Object.entries(perMarca).sort(([a], [b]) => a.localeCompare(b))) {
    if (count > 0) console.log(`  ${marca}: ${count}`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
