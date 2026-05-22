-- Drop old S3 key column
ALTER TABLE "SkillVersion" DROP COLUMN "s3Key";

-- Add SKILL.md content column
ALTER TABLE "SkillVersion" ADD COLUMN "skillMd" TEXT NOT NULL DEFAULT '';

-- Add JSONB files column (stores all other text files as { "path": "content" })
ALTER TABLE "SkillVersion" ADD COLUMN "files" JSONB NOT NULL DEFAULT '{}';

-- GIN index for fast JSONB key/value search
CREATE INDEX "SkillVersion_files_idx" ON "SkillVersion" USING GIN ("files");

-- tsvector column for full-text search on SKILL.md content
ALTER TABLE "SkillVersion" ADD COLUMN "skillMdTsv" TSVECTOR
  GENERATED ALWAYS AS (to_tsvector('english', "skillMd")) STORED;

CREATE INDEX "SkillVersion_skillMdTsv_idx" ON "SkillVersion" USING GIN ("skillMdTsv");
