/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `TokensBling` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "TokensBling_userId_key" ON "TokensBling"("userId");
