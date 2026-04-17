#!/usr/bin/env node
// Migra i dati dal DB sorgente (Railway) al DB destinazione (Neon).
// Usa createMany con chunking per evitare timeout su tabelle grandi.

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const URL_OLD = process.env.DATABASE_URL_OLD;
const URL_NEW = process.env.DATABASE_URL_NEW;

if (!URL_OLD || !URL_NEW) {
  console.error('❌ Mancano DATABASE_URL_OLD o DATABASE_URL_NEW');
  process.exit(1);
}

const oldDb = new PrismaClient({ adapter: new PrismaPg({ connectionString: URL_OLD }) });
const newDb = new PrismaClient({ adapter: new PrismaPg({ connectionString: URL_NEW }) });

const CHUNK = 200;

async function copyTable(name, readFn, model) {
  process.stdout.write(`  ${name.padEnd(25)} `);
  const rows = await readFn();
  if (rows.length === 0) {
    console.log('(vuoto)');
    return;
  }
  let done = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const batch = rows.slice(i, i + CHUNK);
    await model.createMany({ data: batch, skipDuplicates: true });
    done += batch.length;
    process.stdout.write(`${done}/${rows.length}\r  ${name.padEnd(25)} `);
  }
  console.log(`✓ ${rows.length} righe`);
}

async function resetAutoincrement(tableName) {
  try {
    const rows = await newDb.$queryRawUnsafe(`SELECT COALESCE(MAX(id), 0) + 1 AS next FROM "${tableName}"`);
    const next = Number(rows[0]?.next ?? 1);
    const seqName = `${tableName}_id_seq`;
    await newDb.$executeRawUnsafe(`SELECT setval('"${seqName}"', ${next}, false)`);
  } catch (e) {
    console.warn(`  ⚠ seq ${tableName}:`, e.message);
  }
}

async function main() {
  console.log('🚀 Migrazione Railway → Neon\n');

  const existing = await newDb.demolitore.count();
  const existingModelli = await newDb.modelloAuto.count();
  if (existing > 0 || existingModelli > 0) {
    console.error(`❌ Il DB destinazione ha già dati (${existing} demolitori, ${existingModelli} modelli). Esegui 'npx prisma db push --force-reset' con DATABASE_URL=<neon-direct> per svuotarlo.`);
    process.exit(1);
  }

  const steps = [
    ['Demolitore', () => oldDb.demolitore.findMany(), newDb.demolitore],
    ['ModelloAuto', () => oldDb.modelloAuto.findMany(), newDb.modelloAuto],
    ['Veicolo', () => oldDb.veicolo.findMany(), newDb.veicolo],
    ['FotoVeicolo', () => oldDb.fotoVeicolo.findMany(), newDb.fotoVeicolo],
    ['Ricambio', () => oldDb.ricambio.findMany(), newDb.ricambio],
    ['FotoRicambio', () => oldDb.fotoRicambio.findMany(), newDb.fotoRicambio],
    ['EbayCompatibilita', () => oldDb.ebayCompatibilita.findMany(), newDb.ebayCompatibilita],
    ['EbayConnection', () => oldDb.ebayConnection.findMany(), newDb.ebayConnection],
    ['EbayListing', () => oldDb.ebayListing.findMany(), newDb.ebayListing],
    ['SpediamoProConnection', () => oldDb.spediamoProConnection.findMany(), newDb.spediamoProConnection],
    ['Ordine', () => oldDb.ordine.findMany(), newDb.ordine],
    ['OrdineItem', () => oldDb.ordineItem.findMany(), newDb.ordineItem],
    ['Spedizione', () => oldDb.spedizione.findMany(), newDb.spedizione],
    ['TargaLookup', () => oldDb.targaLookup.findMany(), newDb.targaLookup],
    ['AiAnnotation', () => oldDb.aiAnnotation.findMany(), newDb.aiAnnotation],
    ['AiFeedback', () => oldDb.aiFeedback.findMany(), newDb.aiFeedback],
    ['TargaCache', () => oldDb.targaCache.findMany(), newDb.targaCache],
  ];

  for (const [name, read, model] of steps) {
    await copyTable(name, read, model);
  }

  console.log('\n🔧 Reset sequenze autoincrement…');
  for (const [name] of steps) {
    await resetAutoincrement(name);
  }

  console.log('\n✅ Migrazione completata');
  await oldDb.$disconnect();
  await newDb.$disconnect();
}

main().catch(async (e) => {
  console.error('❌ Errore migrazione:', e);
  await oldDb.$disconnect().catch(() => {});
  await newDb.$disconnect().catch(() => {});
  process.exit(1);
});
