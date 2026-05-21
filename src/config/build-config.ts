import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { z } from "zod";
import type { BuildConfig } from "@/types/build-config";

const ARIA_BUILD_FILE = "aria-build.config.json";

const pricingSchema = z.object({
  planName: z.string().min(2).optional(),
  amount: z.number().nonnegative(),
  currency: z.string().min(3).max(3).transform((value) => value.toUpperCase()),
  interval: z.enum(["month", "year"]).optional(),
});

const buildConfigSchema = z.object({
  appName: z.string().min(2),
  appTagline: z.string().min(6),
  ideaId: z.string().min(6),
  monetizationMode: z.enum(["product", "has_free_tier"]),
  supportEmail: z.string().email().optional(),
  pricing: pricingSchema,
  integrations: z.array(z.enum(["neon", "resend", "notion", "github", "vercel"])),
  branding: z.object({
    primaryColor: z.string().min(4),
    accentColor: z.string().min(4),
    logoUrl: z.string().trim().optional(),
  }),
});

const FALLBACK_CONFIG: BuildConfig = {
  appName: "Template App",
  appTagline: "Free consumer web baseline ready for idea-specific features.",
  ideaId: "template-idea",
  monetizationMode: "has_free_tier",
  pricing: {
    planName: "Free",
    amount: 0,
    currency: "USD",
    interval: "month",
  },
  integrations: ["neon", "github", "vercel"],
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
 * 1) `ARIA_BUILD_CONFIG_JSON` when set (ARIA MVP sets this on the Vercel project).
 * 2) `aria-build.config.json` in the repo root (local dev).
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
