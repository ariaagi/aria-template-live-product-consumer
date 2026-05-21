export type MonetizationMode =
  | "product"
  | "subscription"
  | "has_free_tier"
  | "paid_only";

export type IntegrationProvider =
  | "neon"
  | "stripe"
  | "resend"
  | "notion"
  | "github"
  | "vercel";

export interface PricingConfig {
  planName?: string;
  amount: number;
  currency: string;
  interval?: "month" | "year";
}

export interface BuildPlanConfig {
  tierSlug: string;
  displayName: string;
  amount: number;
  currency: string;
  interval: "month";
  isFree: boolean;
  stripePriceId?: string;
}

/**
 * Route-aware gating contract.
 *
 * `aria-build.config.json` is the single runtime source of truth for whether a
 * given route requires an active subscription. The ARIA build pipeline writes
 * this block (`Phase 2 / global paywall fix`) directly from the merged MVP
 * spec's `capabilities.paywallGating.gatedRoutes` plus the operator's pricing
 * selections.
 *
 * Fields:
 *   - `requireActiveSubscriptionForProtectedActions` — legacy global flag
 *     (still honored when callers don't pass a route path; set to `true` for
 *     `monetizationMode: "paid_only"` apps so older generated routes that
 *     don't pass a route argument still gate).
 *   - `gatedRoutes` — exhaustive list of routes that require a subscription.
 *     Empty array for free apps. Mixed apps (free tier + 1 paid plan) list
 *     ONLY the paid surface here so non-paid routes stay free.
 *   - `hasPaidPlan` — convenience flag for paywall card / "Upgrade" UI.
 *
 * All three are optional for backward compat with builds produced before this
 * change; absent fields fall back to the legacy global behavior.
 */
export interface BuildConfigGating {
  requireActiveSubscriptionForProtectedActions?: boolean;
  gatedRoutes?: string[];
  hasPaidPlan?: boolean;
}

export interface BuildConfig {
  appName: string;
  appTagline: string;
  ideaId: string;
  monetizationMode: MonetizationMode;
  supportEmail?: string;
  plans?: BuildPlanConfig[];
  pricing: PricingConfig;
  gating?: BuildConfigGating;
  integrations: IntegrationProvider[];
  branding: {
    primaryColor: string;
    accentColor: string;
    logoUrl?: string;
  };
}
