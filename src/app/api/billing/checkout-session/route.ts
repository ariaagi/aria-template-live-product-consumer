import { getBuildConfig, getBillingPlans } from "@/config/build-config";
import { auth } from "@/lib/auth";
import { errJson, okJson } from "@/lib/server/api/json-response";
import { getRequestOrigin } from "@/lib/server/auth/app-origin";
import { getStripe } from "@/lib/server/billing/stripe";

export const runtime = "nodejs";

type CheckoutBody = {
  tierSlug?: unknown;
};

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id || !session.user.email) {
    return errJson("unauthorized", 401);
  }

  const body = (await request.json().catch(() => null)) as CheckoutBody | null;
  const wantedTierSlug = normalizeText(body?.tierSlug);
  const config = getBuildConfig();
  const plans = getBillingPlans(config).filter((plan) => !plan.isFree && plan.amount > 0);
  if (!plans.length) {
    return errJson("no_paid_plans", 400);
  }

  const selectedPlan =
    plans.find((plan) => plan.tierSlug === wantedTierSlug) ??
    plans[0];
  if (!selectedPlan?.stripePriceId) {
    return errJson("missing_stripe_price_id", 409);
  }

  const origin = getRequestOrigin(request);
  const stripe = getStripe();
  const stripeSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: selectedPlan.stripePriceId, quantity: 1 }],
    success_url: `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/billing/cancel`,
    customer_email: session.user.email,
    client_reference_id: session.user.id,
    metadata: {
      idea_id: config.ideaId,
      user_id: session.user.id,
      tier_slug: selectedPlan.tierSlug,
    },
    subscription_data: {
      metadata: {
        idea_id: config.ideaId,
        user_id: session.user.id,
        tier_slug: selectedPlan.tierSlug,
      },
    },
  });

  if (!stripeSession.url) {
    return errJson("checkout_url_missing", 502);
  }
  return okJson({ url: stripeSession.url });
}
