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
CREATE UNIQUE INDEX "TargaCache_targa_key" ON "TargaCache"("targa");
