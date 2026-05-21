-- Billing runtime tables for ARIA-generated MVP apps.

ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS stripe_customer_id text NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "user_stripe_customer_id_uidx"
  ON "user" ("stripe_customer_id")
  WHERE "stripe_customer_id" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" text NOT NULL PRIMARY KEY,
  "user_id" text NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  "stripe_subscription_id" text NOT NULL,
  "stripe_price_id" text NULL,
  "tier_slug" text NULL,
  "status" text NOT NULL,
  "current_period_end" timestamptz NULL,
  "cancel_at_period_end" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_stripe_subscription_uidx"
  ON "subscriptions" ("stripe_subscription_id");

CREATE INDEX IF NOT EXISTS "subscriptions_user_id_idx"
  ON "subscriptions" ("user_id");

CREATE INDEX IF NOT EXISTS "subscriptions_status_idx"
  ON "subscriptions" ("status");
