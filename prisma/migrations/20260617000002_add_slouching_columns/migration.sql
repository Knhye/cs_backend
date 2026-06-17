-- Add slouching_sec and slouching_count to daily_stats
ALTER TABLE "daily_stats" ADD COLUMN "slouching_sec" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "daily_stats" ADD COLUMN "slouching_count" INTEGER NOT NULL DEFAULT 0;

-- Add slouching_sec to daily_slot_stats
ALTER TABLE "daily_slot_stats" ADD COLUMN "slouching_sec" INTEGER NOT NULL DEFAULT 0;
