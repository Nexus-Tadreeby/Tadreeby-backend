/*
  Warnings:

  - The `approvalStatus` column on the `StudentProfile` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `fullName` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[shortCode]` on the table `Company` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[shortCode]` on the table `University` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `shortCode` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Made the column `universityId` on table `StudentProfile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `verificationDocument` on table `StudentProfile` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `shortCode` to the `University` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstName` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StudentApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "shortCode" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "StudentProfile" ALTER COLUMN "universityId" SET NOT NULL,
ALTER COLUMN "verificationDocument" SET NOT NULL,
DROP COLUMN "approvalStatus",
ADD COLUMN     "approvalStatus" "StudentApprovalStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "University" ADD COLUMN     "shortCode" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "fullName",
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "lastName" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Company_shortCode_key" ON "Company"("shortCode");

-- CreateIndex
CREATE UNIQUE INDEX "University_shortCode_key" ON "University"("shortCode");
