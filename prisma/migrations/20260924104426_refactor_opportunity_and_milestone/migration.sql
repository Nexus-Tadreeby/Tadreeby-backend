/*
  Warnings:

  - You are about to drop the column `academicAllocations` on the `Internship` table. All the data in the column will be lost.
  - You are about to drop the column `attendanceMinPercent` on the `Internship` table. All the data in the column will be lost.
  - You are about to drop the column `checkInEnd` on the `Internship` table. All the data in the column will be lost.
  - You are about to drop the column `checkInStart` on the `Internship` table. All the data in the column will be lost.
  - You are about to drop the column `competencies` on the `Internship` table. All the data in the column will be lost.
  - You are about to drop the column `coverImage` on the `Internship` table. All the data in the column will be lost.
  - You are about to drop the column `currentSprint` on the `Internship` table. All the data in the column will be lost.
  - You are about to drop the column `dailyHours` on the `Internship` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Internship` table. All the data in the column will be lost.
  - You are about to drop the column `hoursPerWeek` on the `Internship` table. All the data in the column will be lost.
  - You are about to drop the column `hoursTotal` on the `Internship` table. All the data in the column will be lost.
  - You are about to drop the column `latitude` on the `Internship` table. All the data in the column will be lost.
  - You are about to drop the column `learningObjectives` on the `Internship` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `Internship` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `Internship` table. All the data in the column will be lost.
  - You are about to drop the column `maxStudents` on the `Internship` table. All the data in the column will be lost.
  - You are about to drop the column `remoteTools` on the `Internship` table. All the data in the column will be lost.
  - You are about to drop the column `subtitle` on the `Internship` table. All the data in the column will be lost.
  - You are about to drop the column `techStack` on the `Internship` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Internship` table. All the data in the column will be lost.
  - You are about to drop the column `totalSprints` on the `Internship` table. All the data in the column will be lost.
  - You are about to drop the column `trainingType` on the `Internship` table. All the data in the column will be lost.
  - You are about to drop the column `venueAddress` on the `Internship` table. All the data in the column will be lost.
  - You are about to drop the column `venueEquipment` on the `Internship` table. All the data in the column will be lost.
  - You are about to drop the column `venueName` on the `Internship` table. All the data in the column will be lost.
  - You are about to drop the column `workEndTime` on the `Internship` table. All the data in the column will be lost.
  - You are about to drop the column `workStartTime` on the `Internship` table. All the data in the column will be lost.
  - You are about to drop the column `workingDays` on the `Internship` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "avgStudentRating" DOUBLE PRECISION,
ADD COLUMN     "completionRate" DOUBLE PRECISION,
ADD COLUMN     "internsTrained" INTEGER,
ADD COLUMN     "universityPartners" INTEGER,
ADD COLUMN     "verifiedByTadreeby" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "CompanyTrainerProfile" ADD COLUMN     "achievements" JSONB,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "yearsExperience" INTEGER;

-- AlterTable
ALTER TABLE "Internship" DROP COLUMN "academicAllocations",
DROP COLUMN "attendanceMinPercent",
DROP COLUMN "checkInEnd",
DROP COLUMN "checkInStart",
DROP COLUMN "competencies",
DROP COLUMN "coverImage",
DROP COLUMN "currentSprint",
DROP COLUMN "dailyHours",
DROP COLUMN "description",
DROP COLUMN "hoursPerWeek",
DROP COLUMN "hoursTotal",
DROP COLUMN "latitude",
DROP COLUMN "learningObjectives",
DROP COLUMN "location",
DROP COLUMN "longitude",
DROP COLUMN "maxStudents",
DROP COLUMN "remoteTools",
DROP COLUMN "subtitle",
DROP COLUMN "techStack",
DROP COLUMN "title",
DROP COLUMN "totalSprints",
DROP COLUMN "trainingType",
DROP COLUMN "venueAddress",
DROP COLUMN "venueEquipment",
DROP COLUMN "venueName",
DROP COLUMN "workEndTime",
DROP COLUMN "workStartTime",
DROP COLUMN "workingDays",
ADD COLUMN     "currentMilestone" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalMilestones" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "TrainingOpportunity" ADD COLUMN     "Field" TEXT,
ADD COLUMN     "applicationDeadline" TIMESTAMP(3),
ADD COLUMN     "attendanceMinPercent" DOUBLE PRECISION DEFAULT 90,
ADD COLUMN     "benefits" JSONB,
ADD COLUMN     "certificateInfo" JSONB,
ADD COLUMN     "checkInEnd" TEXT,
ADD COLUMN     "checkInStart" TEXT,
ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "cohort" TEXT,
ADD COLUMN     "competencies" JSONB,
ADD COLUMN     "coverImage" TEXT,
ADD COLUMN     "curriculum" JSONB,
ADD COLUMN     "dailyHours" INTEGER,
ADD COLUMN     "daysPerWeek" INTEGER,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "hoursPerWeek" INTEGER,
ADD COLUMN     "hoursTotal" INTEGER,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "learningObjectives" JSONB,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "qualifications" JSONB,
ADD COLUMN     "remoteTools" TEXT,
ADD COLUMN     "responsibilities" JSONB,
ADD COLUMN     "shortPitch" TEXT,
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "status" "OpportunityStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "stipend" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "techStack" JSONB,
ADD COLUMN     "trainerId" INTEGER,
ADD COLUMN     "userId" INTEGER,
ADD COLUMN     "venueAddress" TEXT,
ADD COLUMN     "venueEquipment" TEXT,
ADD COLUMN     "venueName" TEXT,
ADD COLUMN     "workDays" TEXT,
ADD COLUMN     "workEndTime" TEXT,
ADD COLUMN     "workHours" TEXT,
ADD COLUMN     "workStartTime" TEXT;

-- CreateIndex
CREATE INDEX "Internship_opportunityId_idx" ON "Internship"("opportunityId");

-- CreateIndex
CREATE INDEX "TrainingOpportunity_companyId_idx" ON "TrainingOpportunity"("companyId");

-- CreateIndex
CREATE INDEX "TrainingOpportunity_isActive_idx" ON "TrainingOpportunity"("isActive");

-- AddForeignKey
ALTER TABLE "TrainingOpportunity" ADD CONSTRAINT "TrainingOpportunity_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingOpportunity" ADD CONSTRAINT "TrainingOpportunity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
