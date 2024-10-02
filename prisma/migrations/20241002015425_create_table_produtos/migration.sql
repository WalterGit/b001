/*
  Warnings:

  - A unique constraint covering the columns `[id_bling]` on the table `Produtos` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Produtos_id_bling_key" ON "Produtos"("id_bling");
