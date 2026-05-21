import Stripe from "stripe";

import { requireStripeSecretKey } from "@/lib/env";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(requireStripeSecretKey());
  }
  return stripeClient;
}

export function toDateFromUnix(value: number | null | undefined): Date | null {
  if (!value || !Number.isFinite(value)) return null;
  return new Date(value * 1000);
}
