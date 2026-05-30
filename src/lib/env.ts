const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ariaApiBaseUrl: process.env.NEXT_PUBLIC_ARIA_API_BASE_URL ?? "http://localhost:4000",
  databaseUrl: process.env.DATABASE_URL ?? process.env.NEON_DATABASE_URL,
  ariaMvpAppId: process.env.ARIA_MVP_APP_ID,
  ariaGoogleHandoffSecret: process.env.ARIA_GOOGLE_HANDOFF_SECRET,
};

export function getEnv() {
  return env;
}

export function assertRequiredEnv() {
  const required = ["NEXT_PUBLIC_APP_URL"] as const;
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}
