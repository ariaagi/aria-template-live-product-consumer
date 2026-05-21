/**
 * Tests for the route-aware paywall gating helper (`canUserRunProtectedAction`)
 * and its underlying `isRouteGatedByConfig` decision tree.
 *
 * This is Phase 3 of the global paywall fix. The bug we're closing:
 *   - Spec gates `/home/boards/new` behind a paid plan.
 *   - Operator picks 1 free + 1 paid plan in the ARIA build modal.
 *   - aria-build.config.json now ships with `gating.gatedRoutes: ["/home/boards/new"]`
 *     and `gating.requireActiveSubscriptionForProtectedActions: false`
 *     (because monetizationMode is "has_free_tier", not "paid_only").
 *   - Pre-Phase-3 helper read only the global flag → free users could create
 *     boards because the global flag was `false`. Tests below pin the new
 *     route-aware semantics so this regression cannot return.
 *
 * Run from the template repo root:
 *   npx tsx testscripts/test-route-aware-gating.ts
 */
import { isRouteGatedByConfig } from "../src/lib/server/billing/gating";
import type { BuildConfig } from "../src/types/build-config";

let failures = 0;
function assert(cond: boolean, msg: string): void {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    failures += 1;
  }
}

/**
 * `getBuildConfig` reads from `process.env.ARIA_BUILD_CONFIG_JSON` first,
 * which makes overriding the in-process config trivial: write the JSON,
 * import the helper fresh, run the assertion. We restore env after each case
 * so test order doesn't matter.
 */
function withConfig(config: BuildConfig, run: () => void): void {
  const previous = process.env.ARIA_BUILD_CONFIG_JSON;
  process.env.ARIA_BUILD_CONFIG_JSON = JSON.stringify(config);
  try {
    run();
  } finally {
    if (previous === undefined) {
      delete process.env.ARIA_BUILD_CONFIG_JSON;
    } else {
      process.env.ARIA_BUILD_CONFIG_JSON = previous;
    }
  }
}

const baseConfig = {
  appName: "Probe",
  appTagline: "Tagline for the route-aware gating probe app",
  ideaId: "probe-idea-12345",
  pricing: { planName: "Starter", amount: 19, currency: "USD", interval: "month" as const },
  integrations: ["neon", "stripe", "github", "vercel"] as const,
  branding: { primaryColor: "#111111", accentColor: "#525252" },
};

/* ── case A — pure free app (no paywall, no paid plan) ───────────────── */
function testPureFreeApp(): void {
  console.log("→ case A: pure free app — no route is gated");
  withConfig(
    {
      ...baseConfig,
      monetizationMode: "has_free_tier",
      gating: { gatedRoutes: [], hasPaidPlan: false },
      integrations: [...baseConfig.integrations],
    },
    () => {
      assert(isRouteGatedByConfig() === false, "no routePath → not gated");
      assert(isRouteGatedByConfig("/home") === false, "/home → not gated");
      assert(isRouteGatedByConfig("/home/anything") === false, "any route → not gated");
    }
  );
}

/* ── case B — paid_only app: every protected action is gated ─────────── */
function testPaidOnlyApp(): void {
  console.log("→ case B: paid_only app — global flag drives gating");
  withConfig(
    {
      ...baseConfig,
      monetizationMode: "paid_only",
      gating: {
        requireActiveSubscriptionForProtectedActions: true,
        gatedRoutes: ["/home/items/new"],
        hasPaidPlan: true,
      },
      integrations: [...baseConfig.integrations],
    },
    () => {
      assert(
        isRouteGatedByConfig("/home/items/new") === true,
        "spec-listed gated route → gated"
      );
      assert(
        isRouteGatedByConfig() === true,
        "paid_only without routePath → still gated (legacy callers)"
      );
      assert(
        isRouteGatedByConfig("/home/items") === false,
        "non-spec-listed route is NOT gated even in paid_only when routePath is provided"
      );
    }
  );
}

/* ── case C — mixed (NicheJobBoard regression) ───────────────────────── */
function testMixedApp_NicheJobBoardRegression(): void {
  console.log("→ case C: mixed app (the NicheJobBoard regression)");
  withConfig(
    {
      ...baseConfig,
      monetizationMode: "has_free_tier",
      gating: {
        requireActiveSubscriptionForProtectedActions: false,
        gatedRoutes: ["/home/boards/new", "/api/boards"],
        hasPaidPlan: true,
      },
      integrations: [...baseConfig.integrations],
    },
    () => {
      assert(
        isRouteGatedByConfig("/home/boards/new") === true,
        "REGRESSION GUARD: gated route in mixed app must still be gated"
      );
      assert(
        isRouteGatedByConfig("/api/boards") === true,
        "REGRESSION GUARD: API route in gatedRoutes must be gated"
      );
      assert(
        isRouteGatedByConfig("/home") === false,
        "non-gated route in mixed app stays free"
      );
      assert(
        isRouteGatedByConfig("/home/boards") === false,
        "list route is free even when its /new sibling is gated"
      );
      assert(
        isRouteGatedByConfig() === false,
        "legacy call (no routePath) in a mixed app falls back to global flag = false"
      );
    }
  );
}

/* ── case D — legacy aria-build.config.json without gatedRoutes ──────── */
function testLegacyConfigWithoutGatedRoutes(): void {
  console.log("→ case D: legacy config — falls back to global flag");
  withConfig(
    {
      ...baseConfig,
      monetizationMode: "paid_only",
      gating: { requireActiveSubscriptionForProtectedActions: true },
      integrations: [...baseConfig.integrations],
    },
    () => {
      assert(
        isRouteGatedByConfig("/anything") === true,
        "legacy paid_only config gates everything regardless of routePath"
      );
      assert(
        isRouteGatedByConfig() === true,
        "legacy paid_only config gates legacy callers too"
      );
    }
  );
}

/* ── case E — trimming behaviour ─────────────────────────────────────── */
function testTrimmingBehavior(): void {
  console.log("→ case E: route trimming");
  withConfig(
    {
      ...baseConfig,
      monetizationMode: "has_free_tier",
      gating: {
        gatedRoutes: ["  /home/boards/new  "],
        hasPaidPlan: true,
      },
      integrations: [...baseConfig.integrations],
    },
    () => {
      assert(
        isRouteGatedByConfig("/home/boards/new") === true,
        "trimmed gatedRoutes entries match the canonical route"
      );
      assert(
        isRouteGatedByConfig("   ") === false,
        "whitespace-only routePath is treated as no routePath (falls back to global flag)"
      );
    }
  );
}

testPureFreeApp();
testPaidOnlyApp();
testMixedApp_NicheJobBoardRegression();
testLegacyConfigWithoutGatedRoutes();
testTrimmingBehavior();

if (failures > 0) {
  console.error(`\n${String(failures)} assertion(s) failed`);
  process.exit(1);
}
console.log("\nok: all route-aware gating assertions passed");
