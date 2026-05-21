import type Stripe from "stripe";

import { getDbPool } from "@/lib/db";
import { getStripe, toDateFromUnix } from "@/lib/server/billing/stripe";

/**
 * Persist subscription state from webhook events.
 *
 * We treat the event payload as source-of-truth for mutable fields (especially
 * `cancel_at_period_end`) to avoid race windows where an immediate retrieve can
 * briefly return older state. A follow-up retrieve is only used as fallback to
 * resolve user/customer identity when webhook metadata is incomplete.
 */
export async function upsertSubscriptionFromStripeWebhookEvent(
  subscriptionFromEvent: Stripe.Subscription
): Promise<void> {
  const subscription = subscriptionFromEvent;

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;

  let userId = typeof subscription.metadata?.user_id === "string"
    ? subscription.metadata.user_id.trim()
    : "";
  if (!userId && customerId) {
    const pool = getDbPool();
    const { rows } = await pool.query<{ id: string }>(
      `SELECT id FROM "user" WHERE stripe_customer_id = $1 LIMIT 1`,
      [customerId]
    );
    userId = rows[0]?.id ?? "";
  }

  let fallbackCustomerId = customerId ?? "";
  if (!userId || !fallbackCustomerId) {
    const stripe = getStripe();
    try {
      const retrieved = await stripe.subscriptions.retrieve(subscriptionFromEvent.id);
      if (!fallbackCustomerId) {
        fallbackCustomerId =
          typeof retrieved.customer === "string"
            ? retrieved.customer
            : retrieved.customer?.id ?? "";
      }
      if (!userId) {
        const metadataUserId = retrieved.metadata?.user_id?.trim() ?? "";
        if (metadataUserId) {
          userId = metadataUserId;
        } else if (fallbackCustomerId) {
          const pool = getDbPool();
          const { rows } = await pool.query<{ id: string }>(
            `SELECT id FROM "user" WHERE stripe_customer_id = $1 LIMIT 1`,
            [fallbackCustomerId]
          );
          userId = rows[0]?.id ?? "";
        }
      }
    } catch {
      /* keep best-effort values from event */
    }
  }
  if (!userId || !fallbackCustomerId) return;

  await upsertSubscriptionFromStripe(userId, fallbackCustomerId, subscription);
}

function tierSlugFromSubscription(subscription: Stripe.Subscription): string | null {
  const item = subscription.items.data[0];
  const fromMetadata = subscription.metadata?.tier_slug?.trim();
  if (fromMetadata) return fromMetadata;
  const fromPrice = item?.price?.metadata?.tier_slug?.trim();
  if (fromPrice) return fromPrice;
  return null;
}

export async function upsertSubscriptionFromStripe(
  userId: string,
  customerId: string,
  subscription: Stripe.Subscription
): Promise<void> {
  const pool = getDbPool();
  const item = subscription.items.data[0];
  const stripePriceId = item?.price?.id ?? null;
  const tierSlug = tierSlugFromSubscription(subscription);
  const currentPeriodEnd = toDateFromUnix(item?.current_period_end ?? null);
  const cancelAt = toDateFromUnix(subscription.cancel_at ?? null);
  const canceledAt = toDateFromUnix(subscription.canceled_at ?? null);

  await pool.query(
    `UPDATE "user"
     SET stripe_customer_id = $2, "updatedAt" = now()
     WHERE id = $1`,
    [userId, customerId]
  );

  await pool.query(
    `INSERT INTO "subscriptions" (
      id,
      user_id,
      stripe_subscription_id,
      stripe_price_id,
      tier_slug,
      status,
      current_period_end,
      cancel_at_period_end,
      cancel_at,
      canceled_at,
      created_at,
      updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now(), now()
    )
    ON CONFLICT (stripe_subscription_id) DO UPDATE SET
      user_id = EXCLUDED.user_id,
      stripe_price_id = EXCLUDED.stripe_price_id,
      tier_slug = EXCLUDED.tier_slug,
      status = EXCLUDED.status,
      current_period_end = EXCLUDED.current_period_end,
      cancel_at_period_end = EXCLUDED.cancel_at_period_end,
      cancel_at = EXCLUDED.cancel_at,
      canceled_at = EXCLUDED.canceled_at,
      updated_at = now()`,
    [
      subscription.id,
      userId,
      subscription.id,
      stripePriceId,
      tierSlug,
      subscription.status,
      currentPeriodEnd,
      subscription.cancel_at_period_end,
      cancelAt,
      canceledAt,
    ]
  );
}

export async function markSubscriptionDeleted(
  subscriptionId: string,
  canceledAt: Date | null = new Date()
): Promise<void> {
  const pool = getDbPool();
  await pool.query(
    `UPDATE "subscriptions"
     SET status = 'canceled',
         cancel_at_period_end = false,
         canceled_at = COALESCE($2, canceled_at),
         updated_at = now()
     WHERE stripe_subscription_id = $1`,
    [subscriptionId, canceledAt]
  );
}

export async function getUserBillingSnapshot(userId: string): Promise<{
  stripeCustomerId: string | null;
  subscription: {
    status: string;
    tierSlug: string | null;
    stripePriceId: string | null;
    cancelAtPeriodEnd: boolean;
    cancelAt: string | null;
    canceledAt: string | null;
    isScheduledToCancel: boolean;
    willAutoRenew: boolean;
    currentPeriodEnd: string | null;
  } | null;
}> {
  const pool = getDbPool();
  const { rows: userRows } = await pool.query<{ stripe_customer_id: string | null }>(
    `SELECT stripe_customer_id FROM "user" WHERE id = $1 LIMIT 1`,
    [userId]
  );
  const { rows: subRows } = await pool.query<{
    status: string;
    tier_slug: string | null;
    stripe_price_id: string | null;
    cancel_at_period_end: boolean;
    cancel_at: Date | null;
    canceled_at: Date | null;
    current_period_end: Date | null;
  }>(
    `SELECT status, tier_slug, stripe_price_id, cancel_at_period_end, cancel_at, canceled_at, current_period_end
     FROM "subscriptions"
     WHERE user_id = $1
     ORDER BY updated_at DESC
     LIMIT 1`,
    [userId]
  );
  const sub = subRows[0];
  return {
    stripeCustomerId: userRows[0]?.stripe_customer_id ?? null,
    subscription: sub
      ? (() => {
          const status = sub.status?.trim().toLowerCase();
          const cancelAtIso = sub.cancel_at ? sub.cancel_at.toISOString() : null;
          const canceledAtIso = sub.canceled_at ? sub.canceled_at.toISOString() : null;
          const isScheduledToCancel = Boolean(sub.cancel_at_period_end) || Boolean(cancelAtIso);
          const willAutoRenew =
            (status === "active" || status === "trialing") && !isScheduledToCancel;
          return {
            status: sub.status,
            tierSlug: sub.tier_slug,
            stripePriceId: sub.stripe_price_id,
            cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
            cancelAt: cancelAtIso,
            canceledAt: canceledAtIso,
            isScheduledToCancel,
            willAutoRenew,
            currentPeriodEnd: sub.current_period_end
              ? sub.current_period_end.toISOString()
              : null,
          };
        })()
      : null,
  };
}
