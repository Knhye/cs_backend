-- Add UNCLASSIFIED to DetectionType enum
ALTER TYPE "DetectionType" ADD VALUE 'UNCLASSIFIED';

-- Add unclassified_sec to daily_stats
ALTER TABLE "daily_stats" ADD COLUMN "unclassified_sec" INTEGER NOT NULL DEFAULT 0;

-- Add *_sec fields to daily_slot_stats
ALTER TABLE "daily_slot_stats" ADD COLUMN "total_detection_sec" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "daily_slot_stats" ADD COLUMN "good_posture_sec" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "daily_slot_stats" ADD COLUMN "turtle_neck_sec" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "daily_slot_stats" ADD COLUMN "round_shoulder_sec" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "daily_slot_stats" ADD COLUMN "shoulder_asymmetry_sec" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "daily_slot_stats" ADD COLUMN "dark_env_sec" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "daily_slot_stats" ADD COLUMN "unclassified_sec" INTEGER NOT NULL DEFAULT 0;

-- CreateTable detection_segments
CREATE TABLE "detection_segments" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "state" "DetectionType" NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3) NOT NULL,
    "duration_sec" INTEGER NOT NULL,
    "client_event_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "detection_segments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "detection_segments_client_event_id_key" ON "detection_segments"("client_event_id");
CREATE INDEX "detection_segments_session_id_started_at_idx" ON "detection_segments"("session_id", "started_at");
CREATE INDEX "detection_segments_user_id_started_at_idx" ON "detection_segments"("user_id", "started_at");

ALTER TABLE "detection_segments" ADD CONSTRAINT "detection_segments_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "detection_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "detection_segments" ADD CONSTRAINT "detection_segments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
