/*
  Warnings:

  - Added the required column `state` to the `TokensBling` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TokensBling" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_TokensBling" ("createdAt", "id", "token", "updatedAt", "userId") SELECT "createdAt", "id", "token", "updatedAt", "userId" FROM "TokensBling";
DROP TABLE "TokensBling";
ALTER TABLE "new_TokensBling" RENAME TO "TokensBling";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
