-- RefreshToken.token 컬럼을 token_hash로 변경
-- 기존 토큰은 무효화되며, 사용자는 재로그인이 필요합니다.
ALTER TABLE "refresh_tokens" RENAME COLUMN "token" TO "token_hash";
