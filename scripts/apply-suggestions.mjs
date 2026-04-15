import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import readline from 'node:readline';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });
dotenv.config({ path: join(__dirname, '..', '.env.local'), override: true });
const REPORT_FILE = join(__dirname, '..', 'data', 'verifica-wikipedia.json');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' });
const prisma = new PrismaClient({ adapter });

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((r) => rl.question(q, r));

function fmt(inizio, fine) { return `${inizio}-${fine ?? 'oggi'}`; }

async function main() {
  const report = JSON.parse(await readFile(REPORT_FILE, 'utf8'));
  // Solo righe senza serie (matching con WP più affidabile)
  const candidates = report.majorDiff.filter((e) => !e.serie);

  console.log(`\nHo trovato ${candidates.length} differenze >1 anno senza serie.`);
  console.log('Per ciascuna ti chiedo se applicare la correzione Wikipedia.\n');
  console.log('  [y] applica la correzione WP (UPDATE annoInizio/annoFine)');
  console.log('  [n] salta (tieni il dato attuale)');
  console.log('  [q] esci e salva quanto fatto\n');

  let applied = 0;
  let skipped = 0;

  for (let i = 0; i < candidates.length; i++) {
    const e = candidates[i];
    console.log(`\n(${i + 1}/${candidates.length}) #${e.id} ${e.marca} ${e.modello}`);
    console.log(`    nostro:     ${fmt(e.nostroInizio, e.nostroFine)}`);
    console.log(`    wikipedia:  ${fmt(e.wpInizio, e.wpFine)}`);
    console.log(`    raw WP:     "${e.wpRaw}"`);
    console.log(`    url:        ${e.wpUrl}`);

    const ans = (await ask('    applicare? [y/n/q] ')).trim().toLowerCase();

    if (ans === 'q') break;
    if (ans === 'y') {
      await prisma.modelloAuto.update({
        where: { id: e.id },
        data: { annoInizio: e.wpInizio, annoFine: e.wpFine },
      });
      applied++;
      console.log('    ✅ applicato');
    } else {
      skipped++;
      console.log('    ⏭️  saltato');
    }
  }

  console.log(`\n=== Fine ===`);
  console.log(`Applicate: ${applied}`);
  console.log(`Saltate:   ${skipped}`);
  rl.close();
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
