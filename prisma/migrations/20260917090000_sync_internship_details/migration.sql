-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN "checkIn" TIMESTAMP(3),
ADD COLUMN "location" TEXT,
ADD COLUMN "notes" TEXT;

-- AlterTable
ALTER TABLE "Internship" ADD COLUMN "academicAllocations" JSONB,
ADD COLUMN "attendanceMinPercent" DOUBLE PRECISION DEFAULT 90,
ADD COLUMN "checkInEnd" TEXT,
ADD COLUMN "checkInStart" TEXT,
ADD COLUMN "cohort" TEXT,
ADD COLUMN "competencies" JSONB,
ADD COLUMN "coverImage" TEXT,
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "currentSprint" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "dailyHours" INTEGER,
ADD COLUMN "description" TEXT,
ADD COLUMN "endDate" TIMESTAMP(3),
ADD COLUMN "enrolledCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "hoursPerWeek" INTEGER,
ADD COLUMN "hoursTotal" INTEGER,
ADD COLUMN "learningObjectives" JSONB,
ADD COLUMN "location" TEXT,
ADD COLUMN "maxStudents" INTEGER,
ADD COLUMN "progressPercent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "remoteTools" TEXT,
ADD COLUMN "startDate" TIMESTAMP(3),
ADD COLUMN "subtitle" TEXT,
ADD COLUMN "techStack" JSONB,
ADD COLUMN "title" TEXT,
ADD COLUMN "totalSprints" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "trainingType" "TrainingType" NOT NULL DEFAULT 'ONSITE',
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "venueAddress" TEXT,
ADD COLUMN "venueEquipment" TEXT,
ADD COLUMN "venueName" TEXT,
ADD COLUMN "weeksCompleted" INTEGER,
ADD COLUMN "weeksTotal" INTEGER,
ADD COLUMN "workEndTime" TEXT,
ADD COLUMN "workStartTime" TEXT,
ADD COLUMN "workingDays" TEXT;

UPDATE "Internship" AS internship
SET "title" = opportunity."title"
FROM "TrainingOpportunity" AS opportunity
WHERE internship."opportunityId" = opportunity."id";

ALTER TABLE "Internship" ALTER COLUMN "title" SET NOT NULL;

-- AlterTable
ALTER TABLE "InternshipStudent" ADD COLUMN "attendanceRate" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN "status" TEXT DEFAULT 'Optimal';

-- AlterTable
ALTER TABLE "Task" ADD COLUMN "badge" TEXT,
ADD COLUMN "needsReviewCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "rubricUrl" TEXT,
ADD COLUMN "submissionCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "InternshipSupervisor" (
    "id" SERIAL NOT NULL,
    "internshipId" INTEGER NOT NULL,
    "supervisorId" INTEGER NOT NULL,
    "universityId" INTEGER NOT NULL,
    "role" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternshipSupervisor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InternshipSupervisor_internshipId_idx" ON "InternshipSupervisor"("internshipId");

-- CreateIndex
CREATE INDEX "InternshipSupervisor_supervisorId_idx" ON "InternshipSupervisor"("supervisorId");

-- CreateIndex
CREATE INDEX "InternshipSupervisor_universityId_idx" ON "InternshipSupervisor"("universityId");

-- CreateIndex
CREATE UNIQUE INDEX "InternshipSupervisor_internshipId_supervisorId_key" ON "InternshipSupervisor"("internshipId", "supervisorId");

-- AddForeignKey
ALTER TABLE "InternshipSupervisor" ADD CONSTRAINT "InternshipSupervisor_internshipId_fkey" FOREIGN KEY ("internshipId") REFERENCES "Internship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternshipSupervisor" ADD CONSTRAINT "InternshipSupervisor_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternshipSupervisor" ADD CONSTRAINT "InternshipSupervisor_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;