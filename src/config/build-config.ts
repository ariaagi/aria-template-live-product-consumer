import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { z } from "zod";
import type { BuildConfig, BuildPlanConfig } from "@/types/build-config";

const ARIA_BUILD_FILE = "aria-build.config.json";

const legacyPricingSchema = z.object({
  planName: z.string().min(2).optional(),
  amount: z.number().nonnegative(),
  currency: z.string().min(3).max(3).transform((value) => value.toUpperCase()),
  interval: z.enum(["month", "year"]).optional(),
});

const buildPlanSchema = z.object({
  tierSlug: z.string().min(1),
  displayName: z.string().min(1),
  amount: z.number().nonnegative(),
  currency: z.string().min(3).max(3).transform((value) => value.toUpperCase()),
  interval: z.literal("month"),
  isFree: z.boolean(),
  stripePriceId: z.string().min(1).optional(),
});

/**
 * Route-aware gating block (Phase 3 of the global paywall fix).
 *
 * `passthrough()` keeps unknown keys (forward-compat with future ARIA builds)
 * while still typing the three fields the runtime helper actually consumes.
 */
const gatingSchema = z
  .object({
    requireActiveSubscriptionForProtectedActions: z.boolean().optional(),
    gatedRoutes: z.array(z.string().min(1)).optional(),
    hasPaidPlan: z.boolean().optional(),
  })
  .passthrough();

const buildConfigSchema = z.object({
  appName: z.string().min(2),
  appTagline: z.string().min(6),
  ideaId: z.string().min(6),
  monetizationMode: z.enum(["product", "subscription", "has_free_tier", "paid_only"]),
  supportEmail: z.string().email().optional(),
  plans: z.array(buildPlanSchema).max(5).optional(),
  pricing: legacyPricingSchema,
  gating: gatingSchema.optional(),
  integrations: z.array(z.enum(["neon", "stripe", "resend", "notion", "github", "vercel"])),
  branding: z.object({
    primaryColor: z.string().min(4),
    accentColor: z.string().min(4),
    logoUrl: z.string().trim().optional(),
  }),
});

const FALLBACK_CONFIG: BuildConfig = {
  appName: "Template App",
  appTagline: "Centralized baseline ready for idea-specific features.",
  ideaId: "template-idea",
  monetizationMode: "subscription",
  pricing: {
    planName: "Starter",
    amount: 19,
    currency: "USD",
    interval: "month",
  },
  integrations: ["neon", "stripe", "github", "vercel"],
  branding: {
    primaryColor: "#111111",
    accentColor: "#525252",
    logoUrl: "",
  },
};

function parseBuildConfig(input: {
  raw: string;
  sourceLabel: "ARIA_BUILD_CONFIG_JSON" | "aria-build.config.json";
  onFailure: "fallback" | "try-file";
}): BuildConfig | null {
  try {
    const parsed = JSON.parse(input.raw) as unknown;
    const result = buildConfigSchema.safeParse(parsed);
    if (result.success) {
      return result.data;
    }
    console.error(
      `[getBuildConfig] Invalid ${input.sourceLabel} (${input.onFailure}):`,
      result.error.flatten()
    );
  } catch (e) {
    console.error(`[getBuildConfig] Failed to parse ${input.sourceLabel}:`, e);
  }
  return null;
}

function readBuildConfigFile(): BuildConfig | null {
  const path = join(process.cwd(), ARIA_BUILD_FILE);
  if (!existsSync(path)) {
    return null;
  }
  try {
    const raw = readFileSync(path, "utf8");
    return parseBuildConfig({
      raw,
      sourceLabel: "aria-build.config.json",
      onFailure: "fallback",
    });
  } catch (e) {
    console.error("[getBuildConfig] Failed to read aria-build.config.json:", e);
    return null;
  }
}

/**
 * App metadata and branding.
 *
 * 1) `ARIA_BUILD_CONFIG_JSON` when set (ARIA MVP sets this on the Vercel project so the app
 *    does not depend on `readFileSync` of `aria-build.config.json` being present in the
 *    serverless trace — a common cause of always seeing fallback "Template App" on Vercel).
 * 2) `aria-build.config.json` in the repo root (local dev and file-based deploys).
 * 3) Template defaults.
 */
export function getBuildConfig(): BuildConfig {
  const rawEnv = process.env.ARIA_BUILD_CONFIG_JSON?.trim();
  if (rawEnv) {
    const parsedEnv = parseBuildConfig({
      raw: rawEnv,
      sourceLabel: "ARIA_BUILD_CONFIG_JSON",
      onFailure: "try-file",
    });
    if (parsedEnv) {
      return parsedEnv;
    }
  }

  const fromFile = readBuildConfigFile();
  if (fromFile) {
    return fromFile;
  }

  return FALLBACK_CONFIG;
}

/**
 * Unified plan reader for legacy + v2 build contracts.
 */
export function getBillingPlans(config: BuildConfig): BuildPlanConfig[] {
  if (config.plans && config.plans.length > 0) {
    return config.plans;
  }
  const legacyLabel = config.pricing.planName?.trim() || "Starter";
  return [
    {
      tierSlug: "starter",
      displayName: legacyLabel,
      amount: config.pricing.amount,
      currency: config.pricing.currency,
      interval: "month",
      isFree: config.pricing.amount <= 0,
      stripePriceId: undefined,
    },
  ];
}
