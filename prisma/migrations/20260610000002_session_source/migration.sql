-- CreateEnum
CREATE TYPE "SessionSource" AS ENUM ('WEB', 'EXTENSION');

-- AlterTable: detection_sessions에 source 컬럼 추가 (기존 데이터 WEB 기본값)
ALTER TABLE "detection_sessions"
  ADD COLUMN "source" "SessionSource" NOT NULL DEFAULT 'WEB';
