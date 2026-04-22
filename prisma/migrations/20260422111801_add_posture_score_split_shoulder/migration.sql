/*
  Warnings:

  - You are about to drop the column `shoulder_issue_count` on the `daily_stats` table. All the data in the column will be lost.
  - You are about to drop the column `shoulder_issue_sec` on the `daily_stats` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "daily_stats" DROP COLUMN "shoulder_issue_count",
DROP COLUMN "shoulder_issue_sec",
ADD COLUMN     "posture_score" INTEGER,
ADD COLUMN     "round_shoulder_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "round_shoulder_sec" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "shoulder_asymmetry_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "shoulder_asymmetry_sec" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "warning_count" INTEGER NOT NULL DEFAULT 0;
