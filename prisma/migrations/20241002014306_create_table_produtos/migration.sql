-- CreateTable
CREATE TABLE "Produtos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_bling" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
