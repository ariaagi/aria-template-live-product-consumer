import { getBuildConfig } from "@/config/build-config";
import { getUserBillingSnapshot } from "@/lib/server/billing/subscriptions-store";

/**
 * Subscription statuses that count as "active enough to use paid features".
 *
 * Phase 3.3 of the global paywall fix:
 *   `past_due` and `unpaid` were previously included so a Stripe payment hiccup
 *   wouldn't lock a customer out mid-month. In practice that meant a user could
 *   chargeback, never pay, and keep using paid features indefinitely. Stripe's
 *   own retry windows (smart retries, 3D Secure, etc.) already give a generous
 *   grace period before transitioning out of `active`/`trialing`, so we hold
 *   the line at those two states. Customers who actually want to keep using
 *   the app fix payment via the customer portal and bounce back to `active`.
 */
const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

function readGatedRoutes(): string[] {
  const config = getBuildConfig();
  const list = config.gating?.gatedRoutes ?? [];
  return Array.isArray(list) ? list.map((r) => r.trim()).filter(Boolean) : [];
}

function readGlobalRequiresSubscription(): boolean {
  const config = getBuildConfig();
  return (
    config.gating?.requireActiveSubscriptionForProtectedActions === true ||
    config.monetizationMode === "paid_only"
  );
}

/**
 * Decide whether the build config gates `routePath` (when given) or *any*
 * protected action (when `routePath` is omitted).
 *
 * Decision tree (matches `requireActiveSubscription`):
 *
 *   1. `routePath` provided AND `gatedRoutes` non-empty
 *        → gate iff `routePath` is in `gatedRoutes`. The legacy global flag
 *          is ignored — a mixed app (free tier + 1 paid plan) gates ONLY the
 *          paid surface listed in the spec.
 *   2. `routePath` provided BUT `gatedRoutes` is empty (legacy ARIA build, or
 *     a paid-only template that never authored a spec)
 *        → fall back to the global flag.
 *   3. `routePath` NOT provided
 *        → fall back to the global flag (this is the pre-Phase-3 behavior; it
 *          keeps generated MVPs that haven't migrated to the route-aware
 *          contract working as before).
 *
 * @internal Exported for unit tests; production code uses `canUserRunProtectedAction`.
 */
export function isRouteGatedByConfig(routePath?: string): boolean {
  const route = typeof routePath === "string" ? routePath.trim() : "";
  if (route.length === 0) {
    return readGlobalRequiresSubscription();
  }
  const gatedRoutes = readGatedRoutes();
  if (gatedRoutes.length === 0) {
    return readGlobalRequiresSubscription();
  }
  return gatedRoutes.includes(route);
}

/**
 * Returns `true` iff the user is allowed to run a protected action.
 *
 * Generated MVPs MUST pass `routePath` (the literal pathname of the route or
 * server action that's about to run) so route-aware gating kicks in:
 *
 * ```ts
 * if (!(await canUserRunProtectedAction(user.id, "/home/boards/new"))) {
 *   return errJson("subscription_required_for_action", 402);
 * }
 * ```
 *
 * Calls without `routePath` keep working under the legacy global semantics
 * (gated when `monetizationMode === "paid_only"`); the static audit
 * (`audit-paywall`) flags those calls inside spec-listed gated routes so the
 * ARIA build fails before the MVP ships.
 */
export async function canUserRunProtectedAction(
  userId: string,
  routePath?: string
): Promise<boolean> {
  if (!isRouteGatedByConfig(routePath)) {
    return true;
  }
  const snapshot = await getUserBillingSnapshot(userId);
  const status = snapshot.subscription?.status?.trim().toLowerCase();
  return Boolean(status && ACTIVE_SUBSCRIPTION_STATUSES.has(status));
}
