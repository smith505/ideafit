-- Add AI generation fields to Report table
ALTER TABLE "Report" ADD COLUMN "aiIdeas" JSONB;
ALTER TABLE "Report" ADD COLUMN "aiCost" DOUBLE PRECISION;
