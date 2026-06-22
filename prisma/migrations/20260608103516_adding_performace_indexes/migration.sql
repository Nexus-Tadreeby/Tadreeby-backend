/*
  Warnings:

  - A unique constraint covering the columns `[studentNumber,universityId]` on the table `StudentProfile` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `studentNumber` to the `StudentProfile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN     "studentNumber" VARCHAR(50) NOT NULL;

-- CreateIndex
CREATE INDEX "Attendance_internshipId_idx" ON "Attendance"("internshipId");

-- CreateIndex
CREATE INDEX "Attendance_studentId_idx" ON "Attendance"("studentId");

-- CreateIndex
CREATE INDEX "Attendance_internshipId_date_idx" ON "Attendance"("internshipId", "date");

-- CreateIndex
CREATE INDEX "Evaluation_studentId_idx" ON "Evaluation"("studentId");

-- CreateIndex
CREATE INDEX "Evaluation_internshipId_idx" ON "Evaluation"("internshipId");

-- CreateIndex
CREATE INDEX "Evaluation_evaluatorId_idx" ON "Evaluation"("evaluatorId");

-- CreateIndex
CREATE INDEX "Internship_companyId_idx" ON "Internship"("companyId");

-- CreateIndex
CREATE INDEX "Internship_universityId_idx" ON "Internship"("universityId");

-- CreateIndex
CREATE INDEX "Internship_status_idx" ON "Internship"("status");

-- CreateIndex
CREATE INDEX "Internship_universityId_status_idx" ON "Internship"("universityId", "status");

-- CreateIndex
CREATE INDEX "InternshipStudent_studentId_idx" ON "InternshipStudent"("studentId");

-- CreateIndex
CREATE INDEX "InternshipStudent_internshipId_idx" ON "InternshipStudent"("internshipId");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

-- CreateIndex
CREATE INDEX "Message_receiverId_idx" ON "Message"("receiverId");

-- CreateIndex
CREATE INDEX "Message_senderId_receiverId_idx" ON "Message"("senderId", "receiverId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "StudentProfile_studentNumber_idx" ON "StudentProfile"("studentNumber");

-- CreateIndex
CREATE INDEX "StudentProfile_approvalStatus_idx" ON "StudentProfile"("approvalStatus");

-- CreateIndex
CREATE INDEX "StudentProfile_universityId_idx" ON "StudentProfile"("universityId");

-- CreateIndex
CREATE INDEX "StudentProfile_universityId_approvalStatus_idx" ON "StudentProfile"("universityId", "approvalStatus");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_studentNumber_universityId_key" ON "StudentProfile"("studentNumber", "universityId");

-- CreateIndex
CREATE INDEX "Task_internshipId_idx" ON "Task"("internshipId");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "TaskSubmission_taskId_idx" ON "TaskSubmission"("taskId");

-- CreateIndex
CREATE INDEX "TaskSubmission_studentId_idx" ON "TaskSubmission"("studentId");

-- CreateIndex
CREATE INDEX "TaskSubmission_taskId_studentId_idx" ON "TaskSubmission"("taskId", "studentId");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_role_isActive_idx" ON "User"("role", "isActive");
