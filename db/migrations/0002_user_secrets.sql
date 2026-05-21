-- Encrypted per-user secret store for BYOK API keys, OAuth refresh tokens, etc.
-- Used by `src/lib/server/secrets/user-secret-store.ts`. Ciphertext is AES-256-GCM
-- via `src/lib/server/secrets/encrypted-secret.ts`, so DB compromise alone does
-- NOT leak plaintext keys (the encryption key lives in env: SECRETS_ENCRYPTION_KEY).

CREATE TABLE IF NOT EXISTS "user_secrets" (
  "id" text NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  "user_id" text NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  "provider_key" text NOT NULL,
  "ciphertext" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "user_secrets_user_provider_uniq" UNIQUE ("user_id", "provider_key")
);

CREATE INDEX IF NOT EXISTS "user_secrets_user_id_idx"
  ON "user_secrets" ("user_id");
