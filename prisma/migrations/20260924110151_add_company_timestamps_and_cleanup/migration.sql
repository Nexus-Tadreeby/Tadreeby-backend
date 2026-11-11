/*
  Warnings:

  - You are about to drop the column `Field` on the `TrainingOpportunity` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `TrainingOpportunity` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `TrainingOpportunity` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "TrainingOpportunity" DROP CONSTRAINT "TrainingOpportunity_userId_fkey";

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "TrainingOpportunity" DROP COLUMN "Field",
DROP COLUMN "userId",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "trainingField" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "University" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "TrainingOpportunity_status_idx" ON "TrainingOpportunity"("status");

-- CreateIndex
CREATE INDEX "TrainingOpportunity_trainerId_idx" ON "TrainingOpportunity"("trainerId");
