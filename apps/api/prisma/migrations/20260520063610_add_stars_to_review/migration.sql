-- AlterTable: add stars with a default of 5 for existing rows, then drop the default
ALTER TABLE "Review" ADD COLUMN "stars" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "Review" ALTER COLUMN "stars" DROP DEFAULT;
