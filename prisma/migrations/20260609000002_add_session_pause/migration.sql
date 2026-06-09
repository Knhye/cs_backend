-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ENDED');

-- Add pause-related columns to detection_sessions
ALTER TABLE "detection_sessions"
  ADD COLUMN "status"           "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "paused_at"        TIMESTAMP(3),
  ADD COLUMN "total_paused_sec" INTEGER NOT NULL DEFAULT 0;

-- CreateTable session_pauses
CREATE TABLE "session_pauses" (
    "id"           TEXT NOT NULL,
    "session_id"   TEXT NOT NULL,
    "paused_at"    TIMESTAMP(3) NOT NULL,
    "resumed_at"   TIMESTAMP(3),
    "duration_sec" INTEGER,
    "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_pauses_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "session_pauses_session_id_idx" ON "session_pauses"("session_id");

ALTER TABLE "session_pauses"
  ADD CONSTRAINT "session_pauses_session_id_fkey"
  FOREIGN KEY ("session_id") REFERENCES "detection_sessions"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
