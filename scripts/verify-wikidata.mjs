import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });
dotenv.config({ path: join(__dirname, '..', '.env.local'), override: true });
const REPORT_FILE = join(__dirname, '..', 'data', 'verifica-wikidata.json');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' });
const prisma = new PrismaClient({ adapter });

const WD_SPARQL = 'https://query.wikidata.org/sparql';
const WD_API = 'https://www.wikidata.org/w/api.php';
const UA = 'autigo-catalog-verifier/1.0 (https://autigo.it)';
const HEADERS_JSON = { 'User-Agent': UA, Accept: 'application/sparql-results+json' };
const HEADERS_API = { 'User-Agent': UA };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function normalize(s) {
  return String(s).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
}

async function findManufacturerQid(marca) {
  const url = `${WD_API}?action=wbsearchentities&search=${encodeURIComponent(marca)}&language=it&uselang=it&type=item&limit=10&format=json&origin=*`;
  const r = await fetch(url, { headers: HEADERS_API });
  if (!r.ok) return null;
  const data = await r.json();
  const hits = data.search ?? [];
  // 1) preferenza a hit con descrizione che include auto/car/vehicle/manufact
  for (const h of hits) {
    const desc = (h.description ?? '').toLowerCase();
    if (/auto|car manufact|automobile|autoveicol|casa automobil|veicol/.test(desc)) return h.id;
  }
  // 2) fallback primo hit
  return hits[0]?.id ?? null;
}

async function fetchModelsForManufacturer(qid) {
  const sparql = `
    SELECT ?model ?modelLabel ?inception ?discontinued WHERE {
      ?model wdt:P176 wd:${qid} .
      OPTIONAL { ?model wdt:P571 ?inception }
      OPTIONAL { ?model wdt:P730 ?discontinued }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "it,en". }
    }
    LIMIT 2000
  `;
  const url = `${WD_SPARQL}?query=${encodeURIComponent(sparql)}`;
  const r = await fetch(url, { headers: HEADERS_JSON });
  if (!r.ok) return [];
  const data = await r.json();
  return (data.results?.bindings ?? []).map((b) => ({
    qid: b.model.value.split('/').pop(),
    label: b.modelLabel?.value ?? '',
    annoInizio: b.inception ? Number(b.inception.value.substring(0, 4)) : null,
    annoFine: b.discontinued ? Number(b.discontinued.value.substring(0, 4)) : null,
  }));
}

function pickBestMatch(ours, wdList) {
  const ourN = normalize(ours.modello);
  if (!ourN) return null;
  const candidates = wdList.filter((w) => {
    const wn = normalize(w.label);
    if (!wn) return false;
    return wn === ourN || wn.endsWith(ourN) || wn.includes(ourN) || ourN.includes(wn);
  });
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  const exact = candidates.find((c) => normalize(c.label).endsWith(ourN));
  const pool = exact ? candidates.filter((c) => normalize(c.label).endsWith(ourN)) : candidates;

  if (ours.annoInizio) {
    let best = null;
    let bestDiff = Infinity;
    for (const c of pool) {
      if (c.annoInizio == null) continue;
      const d = Math.abs(c.annoInizio - ours.annoInizio);
      if (d < bestDiff) { best = c; bestDiff = d; }
    }
    if (best) return best;
  }
  return pool[0];
}

async function main() {
  const modelli = await prisma.modelloAuto.findMany({
    orderBy: [{ marca: 'asc' }, { modello: 'asc' }, { annoInizio: 'asc' }],
  });
  console.log(`Verifico ${modelli.length} modelli contro Wikidata...\n`);

  const perMarca = {};
  for (const m of modelli) {
    if (!perMarca[m.marca]) perMarca[m.marca] = [];
    perMarca[m.marca].push(m);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    stats: {},
    match: [],
    minorDiff: [],
    majorDiff: [],
    notFound: [],
    manufacturerNotFound: [],
  };

  const marche = Object.keys(perMarca).sort();
  for (const marca of marche) {
    const list = perMarca[marca];
    process.stdout.write(`${marca}…`);
    let qid;
    try { qid = await findManufacturerQid(marca); } catch { qid = null; }
    await sleep(300);
    if (!qid) {
      console.log(' ❌ produttore non trovato');
      for (const m of list) report.manufacturerNotFound.push({ id: m.id, marca: m.marca, modello: m.modello, serie: m.serie });
      continue;
    }
    let wd = [];
    try { wd = await fetchModelsForManufacturer(qid); } catch { wd = []; }
    await sleep(300);
    console.log(` ${qid} (${wd.length} modelli su Wikidata)`);

    for (const m of list) {
      const match = pickBestMatch(m, wd);
      if (!match) {
        report.notFound.push({ id: m.id, marca: m.marca, modello: m.modello, serie: m.serie, annoInizio: m.annoInizio, annoFine: m.annoFine });
        continue;
      }
      const diffInizio = match.annoInizio != null ? Math.abs(match.annoInizio - m.annoInizio) : null;
      const diffFine = (match.annoFine != null && m.annoFine != null) ? Math.abs(match.annoFine - m.annoFine) : null;
      const entry = {
        id: m.id,
        marca: m.marca,
        modello: m.modello,
        serie: m.serie,
        nostroInizio: m.annoInizio,
        nostroFine: m.annoFine,
        wdLabel: match.label,
        wdQid: match.qid,
        wdInizio: match.annoInizio,
        wdFine: match.annoFine,
        diffInizio,
        diffFine,
      };
      const maxDiff = Math.max(diffInizio ?? 0, diffFine ?? 0);
      if (diffInizio === 0 && (diffFine === 0 || diffFine === null)) report.match.push(entry);
      else if (maxDiff <= 1) report.minorDiff.push(entry);
      else report.majorDiff.push(entry);
    }
  }

  report.stats = {
    total: modelli.length,
    match: report.match.length,
    minorDiff: report.minorDiff.length,
    majorDiff: report.majorDiff.length,
    notFound: report.notFound.length,
    manufacturerNotFound: report.manufacturerNotFound.length,
  };

  await writeFile(REPORT_FILE, JSON.stringify(report, null, 2));

  console.log('\n=== Report Wikidata ===');
  console.log(`Totale verificati:     ${report.stats.total}`);
  console.log(`Match perfetti:        ${report.stats.match}`);
  console.log(`Differenze ≤1 anno:    ${report.stats.minorDiff}`);
  console.log(`Differenze >1 anno:    ${report.stats.majorDiff}`);
  console.log(`Non trovati su WD:     ${report.stats.notFound}`);
  console.log(`Produttore mancante:   ${report.stats.manufacturerNotFound}`);
  console.log(`\nReport completo: ${REPORT_FILE}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
