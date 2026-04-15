import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FILE = join(__dirname, '..', 'data', 'verifica-wikipedia.json');
const r = JSON.parse(await readFile(FILE, 'utf8'));

console.log('\nStats:');
console.table(r.stats);

// Errori plausibili: righe SENZA serie (meno rumore dal matcher multi-generazione)
const realisticErrors = r.majorDiff.filter((e) => !e.serie);
console.log(`\n=== ERRORI PROBABILI (righe singole senza serie) — ${realisticErrors.length} voci ===\n`);
for (const e of realisticErrors.slice(0, 50)) {
  const nostro = `${e.nostroInizio}-${e.nostroFine ?? 'oggi'}`;
  const wp = `${e.wpInizio}-${e.wpFine ?? 'oggi'}`;
  console.log(`#${e.id} ${e.marca} ${e.modello}`);
  console.log(`   nostro: ${nostro}   |   WP IT: ${wp}`);
  console.log(`   raw: "${e.wpRaw}"`);
  console.log('');
}

// Match perfetti: prime 15 per conferma qualità parser
console.log(`\n=== MATCH PERFETTI (primi 15 su ${r.match.length}) ===\n`);
for (const e of r.match.slice(0, 15)) {
  const serie = e.serie ? ` · ${e.serie}` : '';
  console.log(`✅ ${e.marca} ${e.modello}${serie}: ${e.nostroInizio}-${e.nostroFine ?? 'oggi'}  ← WP: ${e.wpInizio}-${e.wpFine ?? 'oggi'}`);
}
