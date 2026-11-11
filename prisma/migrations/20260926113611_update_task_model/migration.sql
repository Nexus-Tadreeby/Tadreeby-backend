/*
  Warnings:

  - You are about to drop the column `shortPitch` on the `TrainingOpportunity` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "TaskDifficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "SubmissionType" AS ENUM ('CODE_REPOSITORY', 'FILE_UPLOAD', 'LIVE_URL');

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "acceptedSubmissionTypes" "SubmissionType"[] DEFAULT ARRAY[]::"SubmissionType"[],
ADD COLUMN     "allowLateSubmission" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "deliverables" TEXT[],
ADD COLUMN     "difficulty" "TaskDifficulty" NOT NULL DEFAULT 'INTERMEDIATE',
ADD COLUMN     "instructions" TEXT,
ADD COLUMN     "skills" TEXT[],
ADD COLUMN     "startDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "TrainingOpportunity" DROP COLUMN "shortPitch";

-- CreateTable
CREATE TABLE "EvaluationCriterion" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,

    CONSTRAINT "EvaluationCriterion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EvaluationCriterion_taskId_idx" ON "EvaluationCriterion"("taskId");

-- AddForeignKey
ALTER TABLE "EvaluationCriterion" ADD CONSTRAINT "EvaluationCriterion_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
