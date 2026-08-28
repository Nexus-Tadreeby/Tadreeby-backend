-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "checkOut" TIMESTAMP(3),
ADD COLUMN     "duration" TEXT;

-- CreateTable
CREATE TABLE "SupervisorStudent" (
    "id" SERIAL NOT NULL,
    "supervisorId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "SupervisorStudent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" SERIAL NOT NULL,
    "opportunityId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SupervisorStudent_supervisorId_idx" ON "SupervisorStudent"("supervisorId");

-- CreateIndex
CREATE INDEX "SupervisorStudent_studentId_idx" ON "SupervisorStudent"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "SupervisorStudent_supervisorId_studentId_key" ON "SupervisorStudent"("supervisorId", "studentId");

-- CreateIndex
CREATE INDEX "Application_opportunityId_idx" ON "Application"("opportunityId");

-- CreateIndex
CREATE INDEX "Application_studentId_idx" ON "Application"("studentId");

-- CreateIndex
CREATE INDEX "Application_status_idx" ON "Application"("status");

-- CreateIndex
CREATE INDEX "Application_opportunityId_status_idx" ON "Application"("opportunityId", "status");

-- AddForeignKey
ALTER TABLE "SupervisorStudent" ADD CONSTRAINT "SupervisorStudent_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "UniversitySupervisorProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupervisorStudent" ADD CONSTRAINT "SupervisorStudent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "TrainingOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
