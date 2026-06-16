/*
  Warnings:

  - You are about to drop the `refresh_tokens` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_userId_fkey";

-- DropTable
DROP TABLE "refresh_tokens";

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "deviceInfo" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_userId_revokedAt_idx" ON "sessions"("userId", "revokedAt");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
