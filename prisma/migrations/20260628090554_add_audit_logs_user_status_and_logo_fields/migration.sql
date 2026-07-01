/*
  Warnings:

  - The values [PRESENT,ABSENT,LATE] on the enum `AttendanceStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `deviceInfo` on the `sessions` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('IOS', 'ANDROID', 'WEB');

-- CreateEnum
CREATE TYPE "StatusType" AS ENUM ('ONLINE', 'OFFLINE', 'AWAY', 'BUSY');

-- CreateEnum
CREATE TYPE "UniversityAction" AS ENUM ('CREATED', 'UPDATED', 'STATUS_CHANGED', 'DEACTIVATED', 'ACTIVATED');

-- CreateEnum
CREATE TYPE "CompanyAction" AS ENUM ('CREATED', 'UPDATED', 'STATUS_CHANGED', 'DEACTIVATED', 'ACTIVATED');

-- CreateEnum
CREATE TYPE "UserAction" AS ENUM ('LOGIN', 'LOGOUT', 'ONLINE', 'OFFLINE', 'AWAY', 'BUSY', 'PROFILE_UPDATED');

-- AlterEnum
BEGIN;
CREATE TYPE "AttendanceStatus_new" AS ENUM ('CHECKED_IN', 'CHECKED_OUT', 'MARKED_PRESENT', 'MARKED_ABSENT');
ALTER TABLE "Attendance" ALTER COLUMN "status" TYPE "AttendanceStatus_new" USING ("status"::text::"AttendanceStatus_new");
ALTER TYPE "AttendanceStatus" RENAME TO "AttendanceStatus_old";
ALTER TYPE "AttendanceStatus_new" RENAME TO "AttendanceStatus";
DROP TYPE "public"."AttendanceStatus_old";
COMMIT;

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "logo" TEXT;

-- AlterTable
ALTER TABLE "University" ADD COLUMN     "logo" TEXT;

-- AlterTable
ALTER TABLE "sessions" DROP COLUMN "deviceInfo",
ADD COLUMN     "deviceType" "DeviceType";

-- CreateTable
CREATE TABLE "UserActivityLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "action" "UserAction" NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserStatus" (
    "userId" INTEGER NOT NULL,
    "status" "StatusType" NOT NULL DEFAULT 'OFFLINE',
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserStatus_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "UniversityAuditLog" (
    "id" SERIAL NOT NULL,
    "universityId" INTEGER NOT NULL,
    "action" "UniversityAction" NOT NULL,
    "performedBy" INTEGER NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UniversityAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyAuditLog" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "action" "CompanyAction" NOT NULL,
    "performedBy" INTEGER NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyAuditLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserActivityLog" ADD CONSTRAINT "UserActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStatus" ADD CONSTRAINT "UserStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UniversityAuditLog" ADD CONSTRAINT "UniversityAuditLog_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyAuditLog" ADD CONSTRAINT "CompanyAuditLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
