-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "StatoRicambio" AS ENUM ('DISPONIBILE', 'RISERVATO', 'VENDUTO', 'RITIRATO');

-- CreateTable
CREATE TABLE "Demolitore" (
    "id" SERIAL NOT NULL,
    "ragioneSociale" TEXT NOT NULL,
    "piva" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "indirizzo" TEXT NOT NULL,
    "provincia" TEXT NOT NULL,
    "descrizione" TEXT NOT NULL,
    "piano" TEXT NOT NULL DEFAULT 'FREE',
    "attivo" BOOLEAN NOT NULL DEFAULT true,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Demolitore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Veicolo" (
    "id" SERIAL NOT NULL,
    "marca" TEXT NOT NULL,
    "modello" TEXT NOT NULL,
    "versione" TEXT,
    "anno" INTEGER NOT NULL,
    "targa" TEXT NOT NULL,
    "km" INTEGER NOT NULL,
    "cilindrata" TEXT,
    "siglaMotore" TEXT,
    "carburante" TEXT,
    "potenzaKw" INTEGER,
    "pubblicato" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "demolitoreid" INTEGER NOT NULL,

    CONSTRAINT "Veicolo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FotoVeicolo" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "copertina" BOOLEAN NOT NULL DEFAULT false,
    "veicoloid" INTEGER NOT NULL,

    CONSTRAINT "FotoVeicolo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ricambio" (
    "id" SERIAL NOT NULL,
    "codice" TEXT NOT NULL,
    "qrPayload" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "modello" TEXT NOT NULL,
    "anno" INTEGER,
    "descrizione" TEXT,
    "prezzo" DECIMAL(10,2) NOT NULL,
    "ubicazione" TEXT NOT NULL,
    "stato" "StatoRicambio" NOT NULL DEFAULT 'DISPONIBILE',
    "venditoIl" TIMESTAMP(3),
    "pubblicato" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "demolitoreid" INTEGER NOT NULL,
    "veicoloid" INTEGER,
    "modelloAutoId" INTEGER,

    CONSTRAINT "Ricambio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelloAuto" (
    "id" SERIAL NOT NULL,
    "marca" TEXT NOT NULL,
    "modello" TEXT NOT NULL,
    "serie" TEXT,
    "annoInizio" INTEGER NOT NULL,
    "annoFine" INTEGER,
    "sources" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "verified" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModelloAuto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FotoRicambio" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "copertina" BOOLEAN NOT NULL DEFAULT false,
    "ricambioid" INTEGER NOT NULL,

    CONSTRAINT "FotoRicambio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TargaLookup" (
    "id" SERIAL NOT NULL,
    "demolitoreid" INTEGER NOT NULL,
    "targa" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TargaLookup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiAnnotation" (
    "id" SERIAL NOT NULL,
    "fotoUrl" TEXT NOT NULL,
    "classe" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "w" DOUBLE PRECISION NOT NULL,
    "h" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiAnnotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiFeedback" (
    "id" SERIAL NOT NULL,
    "fotoUrl" TEXT NOT NULL,
    "veicoloId" INTEGER,
    "confirmed" TEXT[],
    "rejected" TEXT[],
    "addedManually" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TargaCache" (
    "id" SERIAL NOT NULL,
    "targa" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "modello" TEXT NOT NULL,
    "versione" TEXT NOT NULL,
    "anno" INTEGER NOT NULL,
    "cilindrata" TEXT NOT NULL,
    "siglaMotore" TEXT NOT NULL,
    "carburante" TEXT NOT NULL,
    "potenzaKw" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TargaCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Demolitore_piva_key" ON "Demolitore"("piva");

-- CreateIndex
CREATE UNIQUE INDEX "Demolitore_email_key" ON "Demolitore"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Veicolo_targa_key" ON "Veicolo"("targa");

-- CreateIndex
CREATE UNIQUE INDEX "Ricambio_codice_key" ON "Ricambio"("codice");

-- CreateIndex
CREATE UNIQUE INDEX "Ricambio_qrPayload_key" ON "Ricambio"("qrPayload");

-- CreateIndex
CREATE INDEX "Ricambio_demolitoreid_stato_idx" ON "Ricambio"("demolitoreid", "stato");

-- CreateIndex
CREATE INDEX "Ricambio_marca_modello_anno_idx" ON "Ricambio"("marca", "modello", "anno");

-- CreateIndex
CREATE INDEX "Ricambio_categoria_idx" ON "Ricambio"("categoria");

-- CreateIndex
CREATE INDEX "Ricambio_ubicazione_idx" ON "Ricambio"("ubicazione");

-- CreateIndex
CREATE INDEX "Ricambio_modelloAutoId_idx" ON "Ricambio"("modelloAutoId");

-- CreateIndex
CREATE INDEX "ModelloAuto_marca_idx" ON "ModelloAuto"("marca");

-- CreateIndex
CREATE INDEX "ModelloAuto_marca_modello_idx" ON "ModelloAuto"("marca", "modello");

-- CreateIndex
CREATE INDEX "ModelloAuto_verified_idx" ON "ModelloAuto"("verified");

-- CreateIndex
CREATE UNIQUE INDEX "ModelloAuto_marca_modello_serie_annoInizio_key" ON "ModelloAuto"("marca", "modello", "serie", "annoInizio");

-- CreateIndex
CREATE INDEX "FotoRicambio_ricambioid_idx" ON "FotoRicambio"("ricambioid");

-- CreateIndex
CREATE UNIQUE INDEX "TargaCache_targa_key" ON "TargaCache"("targa");

-- AddForeignKey
ALTER TABLE "Veicolo" ADD CONSTRAINT "Veicolo_demolitoreid_fkey" FOREIGN KEY ("demolitoreid") REFERENCES "Demolitore"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FotoVeicolo" ADD CONSTRAINT "FotoVeicolo_veicoloid_fkey" FOREIGN KEY ("veicoloid") REFERENCES "Veicolo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ricambio" ADD CONSTRAINT "Ricambio_demolitoreid_fkey" FOREIGN KEY ("demolitoreid") REFERENCES "Demolitore"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ricambio" ADD CONSTRAINT "Ricambio_veicoloid_fkey" FOREIGN KEY ("veicoloid") REFERENCES "Veicolo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ricambio" ADD CONSTRAINT "Ricambio_modelloAutoId_fkey" FOREIGN KEY ("modelloAutoId") REFERENCES "ModelloAuto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FotoRicambio" ADD CONSTRAINT "FotoRicambio_ricambioid_fkey" FOREIGN KEY ("ricambioid") REFERENCES "Ricambio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TargaLookup" ADD CONSTRAINT "TargaLookup_demolitoreid_fkey" FOREIGN KEY ("demolitoreid") REFERENCES "Demolitore"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

