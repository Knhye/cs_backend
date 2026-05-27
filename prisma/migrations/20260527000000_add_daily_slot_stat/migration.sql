CREATE TABLE "daily_slot_stats" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "slot_index" INTEGER NOT NULL,
    "good_posture_count" INTEGER NOT NULL DEFAULT 0,
    "turtle_neck_count" INTEGER NOT NULL DEFAULT 0,
    "round_shoulder_count" INTEGER NOT NULL DEFAULT 0,
    "shoulder_asymmetry_count" INTEGER NOT NULL DEFAULT 0,
    "dark_env_count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_slot_stats_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "daily_slot_stats_user_id_date_slot_index_key" ON "daily_slot_stats"("user_id", "date", "slot_index");
CREATE INDEX "daily_slot_stats_user_id_date_idx" ON "daily_slot_stats"("user_id", "date");

ALTER TABLE "daily_slot_stats" ADD CONSTRAINT "daily_slot_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
