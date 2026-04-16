/*
  Warnings:

  - You are about to drop the column `avatar_skin` on the `user_settings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "user_settings" DROP COLUMN "avatar_skin",
ADD COLUMN     "avatar_hood_color" TEXT NOT NULL DEFAULT 'default';
