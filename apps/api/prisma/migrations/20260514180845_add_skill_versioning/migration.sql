/*
  Warnings:

  - You are about to drop the column `skillMdTsv` on the `SkillVersion` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "SkillVersion_files_idx";

-- DropIndex
DROP INDEX "SkillVersion_skillMdTsv_idx";

-- AlterTable
ALTER TABLE "SkillVersion" DROP COLUMN "skillMdTsv",
ALTER COLUMN "skillMd" DROP DEFAULT,
ALTER COLUMN "files" DROP DEFAULT;
