import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });
dotenv.config({ path: join(__dirname, '..', '.env.local'), override: true });
const REPORT_FILE = join(__dirname, '..', 'data', 'verifica-wikipedia.json');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' });
const prisma = new PrismaClient({ adapter });

const UA = 'autodemo24-catalog-verifier/1.0 (https://autodemo24.it)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
const ORD_NAMES = ['prima', 'seconda', 'terza', 'quarta', 'quinta', 'sesta', 'settima', 'ottava', 'nona', 'decima'];

function slugify(s) {
  return s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s\-\(\)]/g, '')
    .trim()
    .replace(/\s+/g, '_');
}

function extractSerieNumber(serieText) {
  if (!serieText) return null;
  const m = serieText.match(/(\d+)[ªa°]?\s*[Ss]erie/);
  if (m) return Number(m[1]);
  const romMatch = serieText.match(/\b(I{1,3}|IV|V|VI{0,3}|IX|X)\b/);
  if (romMatch) return ROMAN.indexOf(romMatch[1]) + 1;
  return null;
}

function buildUrlCandidates(marca, modello, serie) {
  const base = `https://it.wikipedia.org/wiki/`;
  const marcaSlug = slugify(marca);
  const modelloSlug = slugify(modello);
  const joined = `${marcaSlug}_${modelloSlug}`;

  const urls = [];
  const n = extractSerieNumber(serie);
  if (n && ORD_NAMES[n - 1]) {
    urls.push(`${base}${joined}_(${ORD_NAMES[n - 1]}_serie)`);
  }
  if (n && ROMAN[n - 1]) {
    urls.push(`${base}${joined}_${ROMAN[n - 1]}`);
  }
  if (serie) {
    urls.push(`${base}${joined}_(${slugify(serie)})`);
  }
  urls.push(`${base}${joined}`);
  return [...new Set(urls)];
}

const PRODUZIONE_RE = /<t[hd][^>]*>\s*(?:Produzione|Anni\s+di\s+produzione|Periodo\s+di\s+produzione)\s*<\/t[hd]>\s*<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/i;

function parseProduzione(html) {
  const m = html.match(PRODUZIONE_RE);
  if (!m) return null;
  const td = m[1];
  const text = td.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  const years = [...text.matchAll(/\b(1[89]\d{2}|20\d{2})\b/g)].map((x) => Number(x[1]));
  if (years.length === 0) return null;
  const annoInizio = Math.min(...years);
  const tuttora = /\b(ad oggi|tuttora|in produzione|in corso|→|—\s*$|—)/i.test(text) && years.length === 1;
  const annoFine = tuttora ? null : (years.length > 1 ? Math.max(...years) : null);
  return { annoInizio, annoFine, rawText: text.slice(0, 150) };
}

async function fetchWiki(url) {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    if (r.status === 404) return { status: 404 };
    if (!r.ok) return { status: r.status };
    const html = await r.text();
    // Controllo se è pagina di disambigua
    if (/class="disambigua"|disambiguazione/i.test(html.slice(0, 3000))) return { status: 'disambigua' };
    return { status: 200, html };
  } catch {
    return { status: 'err' };
  }
}

async function verifyModel(m) {
  const urls = buildUrlCandidates(m.marca, m.modello, m.serie);
  for (const url of urls) {
    const res = await fetchWiki(url);
    await sleep(1200);
    if (res.status === 200) {
      const prod = parseProduzione(res.html);
      if (prod) return { url, ...prod };
    }
  }
  return null;
}

async function main() {
  const modelli = await prisma.modelloAuto.findMany({
    orderBy: [{ marca: 'asc' }, { modello: 'asc' }, { annoInizio: 'asc' }],
  });
  console.log(`Verifico ${modelli.length} modelli contro Wikipedia IT (rate 1.2s)...\n`);

  const report = {
    generatedAt: new Date().toISOString(),
    stats: {},
    match: [],
    minorDiff: [],
    majorDiff: [],
    notFound: [],
  };

  let i = 0;
  for (const m of modelli) {
    i++;
    if (i % 25 === 0) process.stdout.write(`[${i}/${modelli.length}] `);
    const res = await verifyModel(m);
    if (!res) {
      report.notFound.push({
        id: m.id, marca: m.marca, modello: m.modello, serie: m.serie,
        annoInizio: m.annoInizio, annoFine: m.annoFine,
      });
      continue;
    }
    const diffInizio = Math.abs(res.annoInizio - m.annoInizio);
    const diffFine = (res.annoFine != null && m.annoFine != null) ? Math.abs(res.annoFine - m.annoFine) : null;
    const entry = {
      id: m.id,
      marca: m.marca,
      modello: m.modello,
      serie: m.serie,
      nostroInizio: m.annoInizio,
      nostroFine: m.annoFine,
      wpUrl: res.url,
      wpInizio: res.annoInizio,
      wpFine: res.annoFine,
      wpRaw: res.rawText,
      diffInizio,
      diffFine,
    };
    const maxDiff = Math.max(diffInizio ?? 0, diffFine ?? 0);
    if (diffInizio === 0 && (diffFine === 0 || diffFine === null)) report.match.push(entry);
    else if (maxDiff <= 1) report.minorDiff.push(entry);
    else report.majorDiff.push(entry);
  }

  report.stats = {
    total: modelli.length,
    match: report.match.length,
    minorDiff: report.minorDiff.length,
    majorDiff: report.majorDiff.length,
    notFound: report.notFound.length,
  };

  await writeFile(REPORT_FILE, JSON.stringify(report, null, 2));

  console.log('\n\n=== Report Wikipedia IT ===');
  console.log(`Totale verificati:    ${report.stats.total}`);
  console.log(`Match perfetti:       ${report.stats.match}`);
  console.log(`Differenze ≤1 anno:   ${report.stats.minorDiff}`);
  console.log(`Differenze >1 anno:   ${report.stats.majorDiff}`);
  console.log(`Non trovati su WP IT: ${report.stats.notFound}`);
  console.log(`\nReport completo: ${REPORT_FILE}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
