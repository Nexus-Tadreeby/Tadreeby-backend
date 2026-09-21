-- CreateEnum
CREATE TYPE "TaskBadge" AS ENUM ('IN_REVIEW', 'GRADED', 'ACTIVE');

-- Normalize existing badge labels before changing the column type
UPDATE "Task"
SET "badge" = CASE "badge"
  WHEN 'IN REVIEW' THEN 'IN_REVIEW'
  ELSE "badge"
END
WHERE "badge" IS NOT NULL;

-- AlterTable
ALTER TABLE "Task"
ALTER COLUMN "badge" TYPE "TaskBadge"
USING "badge"::"TaskBadge";
