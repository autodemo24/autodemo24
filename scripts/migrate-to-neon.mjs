#!/usr/bin/env node
// Migra i dati dal DB sorgente (Railway) al DB destinazione (Neon).
// Usa due client Prisma paralleli: uno per read, uno per write.
//
// Uso:
//   1. Crea il progetto Neon in Frankfurt, copia la connection string (pooled).
//   2. Su Neon, applica lo schema PRIMA di eseguire questo script:
//        DATABASE_URL="<neon-url>" npx prisma db push
//   3. Lancia la migrazione:
//        DATABASE_URL_OLD="<railway-url>" \
//        DATABASE_URL_NEW="<neon-url>" \
//        node scripts/migrate-to-neon.mjs

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

// Ordine tabelle: rispetta le foreign key
const STEPS = [
  { name: 'Demolitore', read: () => oldDb.demolitore.findMany(), write: (rows) => newDb.$transaction(rows.map((r) => newDb.demolitore.create({ data: r }))) },
  { name: 'ModelloAuto', read: () => oldDb.modelloAuto.findMany(), write: (rows) => newDb.$transaction(rows.map((r) => newDb.modelloAuto.create({ data: r }))) },
  { name: 'Veicolo', read: () => oldDb.veicolo.findMany(), write: (rows) => newDb.$transaction(rows.map((r) => newDb.veicolo.create({ data: r }))) },
  { name: 'Ricambio', read: () => oldDb.ricambio.findMany(), write: (rows) => newDb.$transaction(rows.map((r) => newDb.ricambio.create({ data: r }))) },
  { name: 'Foto', read: () => oldDb.foto.findMany(), write: (rows) => newDb.$transaction(rows.map((r) => newDb.foto.create({ data: r }))) },
  { name: 'EbayCompatibilita', read: () => oldDb.ebayCompatibilita.findMany(), write: (rows) => newDb.$transaction(rows.map((r) => newDb.ebayCompatibilita.create({ data: r }))) },
  { name: 'EbayConnection', read: () => oldDb.ebayConnection.findMany(), write: (rows) => newDb.$transaction(rows.map((r) => newDb.ebayConnection.create({ data: r }))) },
  { name: 'EbayListing', read: () => oldDb.ebayListing.findMany(), write: (rows) => newDb.$transaction(rows.map((r) => newDb.ebayListing.create({ data: r }))) },
  { name: 'SpediamoProConnection', read: () => oldDb.spediamoProConnection.findMany(), write: (rows) => newDb.$transaction(rows.map((r) => newDb.spediamoProConnection.create({ data: r }))) },
  { name: 'Ordine', read: () => oldDb.ordine.findMany(), write: (rows) => newDb.$transaction(rows.map((r) => newDb.ordine.create({ data: r }))) },
  { name: 'OrdineItem', read: () => oldDb.ordineItem.findMany(), write: (rows) => newDb.$transaction(rows.map((r) => newDb.ordineItem.create({ data: r }))) },
  { name: 'Spedizione', read: () => oldDb.spedizione.findMany(), write: (rows) => newDb.$transaction(rows.map((r) => newDb.spedizione.create({ data: r }))) },
  { name: 'TargaLookup', read: () => oldDb.targaLookup.findMany(), write: (rows) => newDb.$transaction(rows.map((r) => newDb.targaLookup.create({ data: r }))) },
];

async function resetAutoincrement(tableName) {
  // PostgreSQL: aggiorna la sequenza alla max(id)+1 dopo l'import
  try {
    const rows = await newDb.$queryRawUnsafe(`SELECT COALESCE(MAX(id), 0) + 1 AS next FROM "${tableName}"`);
    const next = rows[0]?.next ?? 1;
    const seqName = `${tableName}_id_seq`;
    await newDb.$executeRawUnsafe(`SELECT setval('"${seqName}"', ${next}, false)`);
  } catch (e) {
    console.warn(`  ⚠ seq ${tableName}:`, e.message);
  }
}

async function main() {
  console.log('🚀 Migrazione Railway → Neon\n');

  // Verifica destinazione vuota
  const existing = await newDb.demolitore.count();
  if (existing > 0) {
    console.error(`❌ Il DB destinazione ha già ${existing} demolitori. Esegui questo script solo su DB vuoto.`);
    console.error('   Per svuotarlo: npx prisma db push --force-reset');
    process.exit(1);
  }

  for (const step of STEPS) {
    process.stdout.write(`  ${step.name.padEnd(25)} `);
    const rows = await step.read();
    if (rows.length === 0) {
      console.log('(vuoto)');
      continue;
    }
    try {
      await step.write(rows);
      console.log(`✓ ${rows.length} righe`);
    } catch (e) {
      console.log(`✗ errore`);
      console.error('   ', e.message);
      throw e;
    }
  }

  console.log('\n🔧 Reset sequenze autoincrement…');
  for (const step of STEPS) {
    await resetAutoincrement(step.name);
  }

  console.log('\n✅ Migrazione completata');
  await oldDb.$disconnect();
  await newDb.$disconnect();
}

main().catch((e) => {
  console.error('❌ Errore migrazione:', e);
  process.exit(1);
});
