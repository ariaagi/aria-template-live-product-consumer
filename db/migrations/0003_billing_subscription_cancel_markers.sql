-- Track scheduled and finalized cancellation timestamps from Stripe.

ALTER TABLE "subscriptions"
  ADD COLUMN IF NOT EXISTS "cancel_at" timestamptz NULL;

ALTER TABLE "subscriptions"
  ADD COLUMN IF NOT EXISTS "canceled_at" timestamptz NULL;

CREATE INDEX IF NOT EXISTS "subscriptions_cancel_at_idx"
  ON "subscriptions" ("cancel_at");
