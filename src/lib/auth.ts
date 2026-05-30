import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { Pool } from "pg";

import { ariaGoogleHandoffPlugin } from "@/lib/server/auth/aria-google-handoff-plugin";

let pool: Pool | null = null;

function getDatabasePool(): Pool {
  const connectionString =
    process.env.DATABASE_URL?.trim() ||
    process.env.NEON_DATABASE_URL?.trim() ||
    "";
  if (!connectionString) {
    throw new Error(
      "Set DATABASE_URL (or NEON_DATABASE_URL) to your Neon Postgres connection string — no local DB fallback."
    );
  }
  if (!pool) {
    pool = new Pool({ connectionString });
  }
  return pool;
}

/**
 * Better Auth against Neon Postgres only (no Neon Auth service).
 * Google sign-in uses the ARIA OAuth broker — not native Better Auth Google.
 * @see https://www.better-auth.com/docs/installation
 */
export const auth = betterAuth({
  database: getDatabasePool(),
  plugins: [nextCookies(), ariaGoogleHandoffPlugin()],
  secret:
    process.env.BETTER_AUTH_SECRET?.trim() ??
    "dev-only-secret-min-32-chars-please-change",
  baseURL:
    process.env.BETTER_AUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "http://localhost:3000",
  emailAndPassword: {
    enabled: true,
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
    },
  },
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    process.env.BETTER_AUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
  ].filter((u): u is string => Boolean(u?.trim())),
  socialProviders: {},
});
