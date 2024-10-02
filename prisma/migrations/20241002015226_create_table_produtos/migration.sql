/*
  Warnings:

  - You are about to alter the column `id_bling` on the `Produtos` table. The data in that column could be lost. The data in that column will be cast from `String` to `BigInt`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Produtos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_bling" BIGINT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Produtos" ("createdAt", "id", "id_bling", "updatedAt") SELECT "createdAt", "id", "id_bling", "updatedAt" FROM "Produtos";
DROP TABLE "Produtos";
ALTER TABLE "new_Produtos" RENAME TO "Produtos";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
