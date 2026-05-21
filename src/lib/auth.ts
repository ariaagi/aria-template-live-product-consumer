import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { Pool } from "pg";

let pool: Pool | null = null;

function getDatabasePool(): Pool {
  /** Neon (or any Postgres): paste the connection string from the Neon dashboard. */
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

const googleClientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
const googleClientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();

/**
 * Better Auth against Neon Postgres only (no Neon Auth service).
 * @see https://www.better-auth.com/docs/installation
 */
export const auth = betterAuth({
  database: getDatabasePool(),
  plugins: [nextCookies()],
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
  /** Dev servers often use a non-default port; allow common local origins for OAuth CSRF. */
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    process.env.BETTER_AUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
  ].filter((u): u is string => Boolean(u?.trim())),
  socialProviders:
    googleClientId && googleClientSecret
      ? {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          },
        }
      : {},
});
