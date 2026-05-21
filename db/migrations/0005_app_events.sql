-- Lightweight in-app event log for analytics + Phase 5 build outcome telemetry.
-- Generated MVPs SHOULD insert into this table for "thing created" / "thing exported" /
-- "subscription started" events. Cheap, append-only, no foreign keys to user data so
-- old rows can stay even after user deletion (audit trail).

CREATE TABLE IF NOT EXISTS "app_events" (
  "id" text NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  "user_id" text NULL,
  "event_type" text NOT NULL,
  "payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "app_events_user_id_idx"
  ON "app_events" ("user_id");

CREATE INDEX IF NOT EXISTS "app_events_event_type_created_at_idx"
  ON "app_events" ("event_type", "created_at" DESC);
