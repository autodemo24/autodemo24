import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });
dotenv.config({ path: join(__dirname, '..', '.env.local'), override: true });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' });
const prisma = new PrismaClient({ adapter });

const CANONICAL = 'Citroën';
const VARIANTS = ['Citroen', 'CITROEN', 'citroën', 'citroen'];

async function main() {
  let merged = 0;
  let renamed = 0;

  // 1) Aggiorna Ricambio.marca per tutte le varianti -> canonical
  const updRicambi = await prisma.ricambio.updateMany({
    where: { marca: { in: VARIANTS } },
    data: { marca: CANONICAL },
  });
  console.log(`Ricambio.marca aggiornati: ${updRicambi.count}`);

  // 2) Aggiorna Veicolo.marca
  const updVeicoli = await prisma.veicolo.updateMany({
    where: { marca: { in: VARIANTS } },
    data: { marca: CANONICAL },
  });
  console.log(`Veicolo.marca aggiornati: ${updVeicoli.count}`);

  // 3) Per ogni ModelloAuto con marca variante, decide se merge o rename
  const variantRows = await prisma.modelloAuto.findMany({
    where: { marca: { in: VARIANTS } },
  });
  console.log(`\nModelloAuto con marca variante: ${variantRows.length}`);

  for (const v of variantRows) {
    const twin = await prisma.modelloAuto.findFirst({
      where: {
        marca: CANONICAL,
        modello: v.modello,
        serie: v.serie,
        annoInizio: v.annoInizio,
      },
    });

    if (twin) {
      // merge: sposta FK ricambi al canonical, elimina variante
      const upd = await prisma.ricambio.updateMany({
        where: { modelloAutoId: v.id },
        data: { modelloAutoId: twin.id },
      });
      await prisma.modelloAuto.delete({ where: { id: v.id } });
      console.log(`  [MERGE] "${v.marca} ${v.modello} ${v.serie ?? ''}" #${v.id} → #${twin.id}  (${upd.count} ricambi spostati)`);
      merged++;
    } else {
      await prisma.modelloAuto.update({
        where: { id: v.id },
        data: { marca: CANONICAL },
      });
      console.log(`  [RENAME] "${v.marca} ${v.modello} ${v.serie ?? ''}" #${v.id} → marca "${CANONICAL}"`);
      renamed++;
    }
  }

  console.log(`\nRiassunto: merged=${merged}, renamed=${renamed}`);

  // 4) Verifica finale
  const remaining = await prisma.modelloAuto.count({ where: { marca: { in: VARIANTS } } });
  console.log(`Righe ModelloAuto con marca variante dopo pulizia: ${remaining} (atteso 0)`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
