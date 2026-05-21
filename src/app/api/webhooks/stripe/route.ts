import type Stripe from "stripe";

import { requireStripeWebhookSecret } from "@/lib/env";
import { errJson, okJson } from "@/lib/server/api/json-response";
import { getStripe } from "@/lib/server/billing/stripe";
import {
  markSubscriptionDeleted,
  upsertSubscriptionFromStripe,
  upsertSubscriptionFromStripeWebhookEvent,
} from "@/lib/server/billing/subscriptions-store";

export const runtime = "nodejs";

function userIdFromMetadata(
  metadata: Stripe.Metadata | null | undefined
): string | null {
  const v = metadata?.user_id;
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t || null;
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return errJson("missing_signature", 400);
  }

  const payload = await request.text();
  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      requireStripeWebhookSecret()
    );
  } catch {
    return errJson("invalid_signature", 400);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = userIdFromMetadata(session.metadata);
        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id;
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;
        if (userId && customerId && subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await upsertSubscriptionFromStripe(userId, customerId, subscription);
        }
        break;
      }
      case "customer.subscription.created": {
        const createdFromEvent = event.data.object as Stripe.Subscription;
        let subscription = createdFromEvent;
        try {
          // Created/update events can arrive out-of-order; read latest Stripe state.
          subscription = await stripe.subscriptions.retrieve(createdFromEvent.id);
        } catch {
          /* fall back to event payload */
        }
        await upsertSubscriptionFromStripeWebhookEvent(subscription);
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await upsertSubscriptionFromStripeWebhookEvent(subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const canceledAt = subscription.canceled_at
          ? new Date(subscription.canceled_at * 1000)
          : new Date();
        await markSubscriptionDeleted(subscription.id, canceledAt);
        break;
      }
      case "invoice.paid":
      case "invoice.payment_failed":
      default:
        break;
    }
  } catch {
    return errJson("webhook_process_failed", 500);
  }

  return okJson({ received: true });
}
