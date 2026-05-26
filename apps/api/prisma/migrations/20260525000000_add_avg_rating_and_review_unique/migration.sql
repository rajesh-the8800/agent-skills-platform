-- Prevent duplicate reviews from the same user on the same skill
ALTER TABLE "Review" ADD CONSTRAINT "Review_skillId_userId_key" UNIQUE ("skillId", "userId");
