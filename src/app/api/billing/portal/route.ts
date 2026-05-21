import { auth } from "@/lib/auth";
import { errJson, okJson } from "@/lib/server/api/json-response";
import { getRequestOrigin } from "@/lib/server/auth/app-origin";
import { getStripe } from "@/lib/server/billing/stripe";
import { getUserBillingSnapshot } from "@/lib/server/billing/subscriptions-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) {
    return errJson("unauthorized", 401);
  }

  const snapshot = await getUserBillingSnapshot(session.user.id);
  if (!snapshot.stripeCustomerId) {
    return errJson(
      "no_customer",
      409,
      "Subscribe with Change plan first; the Stripe portal opens after checkout."
    );
  }

  try {
    const stripe = getStripe();
    const origin = getRequestOrigin(request);
    const portal = await stripe.billingPortal.sessions.create({
      customer: snapshot.stripeCustomerId,
      return_url: `${origin}/billing`,
    });
    return okJson({ url: portal.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "portal_failed";
    if (/billing portal|configuration|No configuration provided/i.test(message)) {
      return errJson(
        "portal_not_configured",
        409,
        "Stripe Billing Portal is not configured yet for this account."
      );
    }
    return errJson("portal_failed", 502);
  }
}
