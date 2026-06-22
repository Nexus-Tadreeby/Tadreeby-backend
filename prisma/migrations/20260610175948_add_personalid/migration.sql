/*
  Warnings:

  - A unique constraint covering the columns `[personalID]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `studentNumber` on the `StudentProfile` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `personalID` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "StudentProfile" DROP COLUMN "studentNumber",
ADD COLUMN     "studentNumber" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "personalID" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "StudentProfile_studentNumber_idx" ON "StudentProfile"("studentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_studentNumber_universityId_key" ON "StudentProfile"("studentNumber", "universityId");

-- CreateIndex
CREATE UNIQUE INDEX "User_personalID_key" ON "User"("personalID");
