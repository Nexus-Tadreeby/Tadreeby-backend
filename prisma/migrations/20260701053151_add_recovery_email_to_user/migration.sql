/*
  Warnings:

  - A unique constraint covering the columns `[recoveryEmail]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `recoveryEmail` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "StudentProfile" ALTER COLUMN "studentNumber" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "recoveryEmail" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_recoveryEmail_key" ON "User"("recoveryEmail");
