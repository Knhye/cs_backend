-- AlterTable: time 컬럼을 VarChar(8)로 확장하고 event_id 컬럼 추가
ALTER TABLE "timeline_entries"
  ALTER COLUMN "time" TYPE VARCHAR(8),
  ADD COLUMN "event_id" TEXT;

-- CreateIndex: (userId, eventId) 복합 유니크 (NULL 제외 자동 적용)
CREATE UNIQUE INDEX "timeline_entries_user_id_event_id_key"
  ON "timeline_entries"("user_id", "event_id")
  WHERE "event_id" IS NOT NULL;
