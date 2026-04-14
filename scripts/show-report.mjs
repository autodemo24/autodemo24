import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FILE = join(__dirname, '..', 'data', 'verifica-wikidata.json');

const r = JSON.parse(await readFile(FILE, 'utf8'));

console.log(`\n=== MAJOR DIFF (>1 anno) — ${r.majorDiff.length} voci ===\n`);
for (const e of r.majorDiff) {
  const serie = e.serie ? ' · ' + e.serie : '';
  const nostro = `${e.nostroInizio}-${e.nostroFine ?? 'oggi'}`;
  const wd = `${e.wdInizio ?? '?'}-${e.wdFine ?? 'oggi'}`;
  console.log(`#${e.id} ${e.marca} ${e.modello}${serie}`);
  console.log(`    nostro: ${nostro}   |   wikidata: ${wd} (${e.wdLabel})`);
}

console.log(`\n\n=== NOT FOUND su Wikidata — ${r.notFound.length} voci ===\n`);
for (const e of r.notFound) {
  const serie = e.serie ? ' · ' + e.serie : '';
  console.log(`${e.marca} ${e.modello}${serie} (${e.annoInizio}-${e.annoFine ?? 'oggi'})`);
}
