/*
  Warnings:

  - You are about to drop the column `supervisorId` on the `Internship` table. All the data in the column will be lost.
  - You are about to drop the column `universityId` on the `Internship` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Internship" DROP CONSTRAINT "Internship_supervisorId_fkey";

-- DropForeignKey
ALTER TABLE "Internship" DROP CONSTRAINT "Internship_universityId_fkey";

-- DropIndex
DROP INDEX "Internship_universityId_idx";

-- DropIndex
DROP INDEX "Internship_universityId_status_idx";

-- AlterTable
ALTER TABLE "Internship" DROP COLUMN "supervisorId",
DROP COLUMN "universityId";
