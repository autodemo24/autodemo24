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
    "abbonamentoAttivo" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Demolitore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Veicolo" (
    "id" SERIAL NOT NULL,
    "marca" TEXT NOT NULL,
    "modello" TEXT NOT NULL,
    "anno" INTEGER NOT NULL,
    "targa" TEXT NOT NULL,
    "km" INTEGER NOT NULL,
    "demolitoreid" INTEGER NOT NULL,

    CONSTRAINT "Veicolo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FotoVeicolo" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "veicoloid" INTEGER NOT NULL,

    CONSTRAINT "FotoVeicolo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ricambio" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "disponibile" BOOLEAN NOT NULL DEFAULT true,
    "veicoloid" INTEGER NOT NULL,

    CONSTRAINT "Ricambio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Demolitore_piva_key" ON "Demolitore"("piva");

-- CreateIndex
CREATE UNIQUE INDEX "Demolitore_email_key" ON "Demolitore"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Veicolo_targa_key" ON "Veicolo"("targa");

-- AddForeignKey
ALTER TABLE "Veicolo" ADD CONSTRAINT "Veicolo_demolitoreid_fkey" FOREIGN KEY ("demolitoreid") REFERENCES "Demolitore"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FotoVeicolo" ADD CONSTRAINT "FotoVeicolo_veicoloid_fkey" FOREIGN KEY ("veicoloid") REFERENCES "Veicolo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ricambio" ADD CONSTRAINT "Ricambio_veicoloid_fkey" FOREIGN KEY ("veicoloid") REFERENCES "Veicolo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
