export type MonetizationMode = "product" | "has_free_tier";

export type IntegrationProvider =
  | "neon"
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

export interface BuildConfig {
  appName: string;
  appTagline: string;
  ideaId: string;
  monetizationMode: MonetizationMode;
  supportEmail?: string;
  pricing: PricingConfig;
  integrations: IntegrationProvider[];
  branding: {
    primaryColor: string;
    accentColor: string;
    logoUrl?: string;
  };
}
