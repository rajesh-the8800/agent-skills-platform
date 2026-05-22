-- CreateEnum
CREATE TYPE "SkillStatus" AS ENUM ('PENDING', 'PUBLISHED', 'REJECTED');

-- AlterTable
ALTER TABLE "Skill" ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "securityScanned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" "SkillStatus" NOT NULL DEFAULT 'PENDING';
