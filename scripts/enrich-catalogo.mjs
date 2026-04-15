// ETL: arricchisce il catalogo ModelloAuto da NHTSA vPIC (gratis, no auth).
// NHTSA copre tutti i veicoli venduti in USA — include la maggior parte dei
// brand EU (VW, BMW, Mercedes, Fiat, Alfa, Peugeot, Renault…). Modelli EU-only
// (es. Dacia in alcune fasce, Opel che non vendeva in USA) saranno mancanti:
// per quelli resta il seed LLM in data/catalogo-seed.json.
//
// Output: data/catalogo-enriched.json nello stesso formato di catalogo-seed.json,
// ma con campo sources: ["nhtsa"]. Lo seed-catalogo.mjs si occupa del merge.

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_FILE = join(__dirname, '..', 'data', 'catalogo-enriched.json');

const YEAR_FROM = 1995;
const YEAR_TO = new Date().getFullYear() + 1;

// Whitelist marche rilevanti per il mercato IT/EU. Chiavi = nome NHTSA
// (upper-case come restituito dall'API), valori = nome canonico nel nostro DB
// (deve matchare catalogo-seed.json per il merge).
const MARCA_MAP = {
  'ABARTH': 'Abarth',
  'ALFA ROMEO': 'Alfa Romeo',
  'AUDI': 'Audi',
  'BMW': 'BMW',
  'CHEVROLET': 'Chevrolet',
  'CHRYSLER': 'Chrysler',
  'CITROEN': 'Citroen',
  'DACIA': 'Dacia',
  'DS': 'DS',
  'FIAT': 'Fiat',
  'FORD': 'Ford',
  'HONDA': 'Honda',
  'HYUNDAI': 'Hyundai',
  'INFINITI': 'Infiniti',
  'JAGUAR': 'Jaguar',
  'JEEP': 'Jeep',
  'KIA': 'Kia',
  'LANCIA': 'Lancia',
  'LAND ROVER': 'Land Rover',
  'LEXUS': 'Lexus',
  'MASERATI': 'Maserati',
  'MAZDA': 'Mazda',
  'MERCEDES-BENZ': 'Mercedes-Benz',
  'MINI': 'Mini',
  'MITSUBISHI': 'Mitsubishi',
  'NISSAN': 'Nissan',
  'OPEL': 'Opel',
  'PEUGEOT': 'Peugeot',
  'PORSCHE': 'Porsche',
  'RENAULT': 'Renault',
  'SEAT': 'Seat',
  'SKODA': 'Skoda',
  'SMART': 'Smart',
  'SUBARU': 'Subaru',
  'SUZUKI': 'Suzuki',
  'TESLA': 'Tesla',
  'TOYOTA': 'Toyota',
  'VOLKSWAGEN': 'Volkswagen',
  'VOLVO': 'Volvo',
};

async function fetchJson(url, { retries = 3, delayMs = 500 } = {}) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e) {
      if (attempt === retries - 1) throw e;
      await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
    }
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchModelsForMakeYear(nhtsaMake, year) {
  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(nhtsaMake)}/modelyear/${year}?format=json`;
  const data = await fetchJson(url);
  return (data.Results ?? [])
    .map((m) => (m.Model_Name ?? '').trim())
    .filter(Boolean);
}

async function main() {
  const result = {};
  const stats = { marcheProcessate: 0, modelliTotali: 0, callNhtsa: 0 };

  for (const [nhtsaMake, canonicalMake] of Object.entries(MARCA_MAP)) {
    const yearsByModel = new Map(); // modello -> Set<year>

    for (let year = YEAR_FROM; year <= YEAR_TO; year++) {
      try {
        const modelli = await fetchModelsForMakeYear(nhtsaMake, year);
        stats.callNhtsa++;
        for (const mod of modelli) {
          if (!yearsByModel.has(mod)) yearsByModel.set(mod, new Set());
          yearsByModel.get(mod).add(year);
        }
      } catch (e) {
        console.warn(`  [${canonicalMake}] ${year}: ${e.message}`);
      }
      await sleep(80);
    }

    const modelliOut = [];
    for (const [modello, yearSet] of yearsByModel) {
      const years = Array.from(yearSet).sort((a, b) => a - b);
      const annoInizio = years[0];
      const annoUltimo = years[years.length - 1];
      // Se il modello appare fino all'anno corrente/futuro, lo consideriamo
      // ancora in produzione (annoFine: null).
      const annoFine = annoUltimo >= YEAR_TO ? null : annoUltimo;
      modelliOut.push({
        modello,
        serie: null,
        annoInizio,
        annoFine,
        sources: ['nhtsa'],
      });
    }

    modelliOut.sort((a, b) => a.modello.localeCompare(b.modello) || a.annoInizio - b.annoInizio);

    if (modelliOut.length > 0) {
      result[canonicalMake] = modelliOut;
      stats.marcheProcessate++;
      stats.modelliTotali += modelliOut.length;
      console.log(`  ${canonicalMake}: ${modelliOut.length} modelli`);
    } else {
      console.log(`  ${canonicalMake}: nessun modello trovato (probabilmente non venduto in USA)`);
    }
  }

  result._meta = {
    note: 'Catalogo arricchito da NHTSA vPIC. Copertura buona per brand venduti anche in USA, scarsa o nulla per brand EU-only (es. Opel, Dacia).',
    source: 'https://vpic.nhtsa.dot.gov/api/',
    generatedAt: new Date().toISOString(),
    stats,
  };

  await writeFile(OUT_FILE, JSON.stringify(result, null, 2), 'utf8');
  console.log(`\n=== Enrichment completato ===`);
  console.log(`Marche: ${stats.marcheProcessate}`);
  console.log(`Modelli totali: ${stats.modelliTotali}`);
  console.log(`Chiamate NHTSA: ${stats.callNhtsa}`);
  console.log(`Output: ${OUT_FILE}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
