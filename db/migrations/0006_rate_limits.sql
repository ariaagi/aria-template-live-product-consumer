-- Persisted rate-limit buckets for cross-instance API limiting (in-memory map in
-- middleware.ts is per-instance only; this table is the durable backstop generated
-- MVPs can use for "max N actions per user per hour" enforcement on expensive ops
-- (LLM calls, exports, share creations, etc.).
--
-- Generated MVPs are NOT required to use this; it's available when needed. The
-- cleanup of old rows is left to the caller — typical pattern is a small CTE that
-- deletes rows where window_end < now() before each insert.

CREATE TABLE IF NOT EXISTS "rate_limits" (
  "id" text NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  "bucket_key" text NOT NULL,
  "user_id" text NULL,
  "hits" integer NOT NULL DEFAULT 0,
  "window_start" timestamptz NOT NULL DEFAULT now(),
  "window_end" timestamptz NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "rate_limits_bucket_window_idx"
  ON "rate_limits" ("bucket_key", "window_end" DESC);

CREATE INDEX IF NOT EXISTS "rate_limits_user_id_idx"
  ON "rate_limits" ("user_id");
