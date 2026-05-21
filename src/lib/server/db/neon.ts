import { neon } from "@neondatabase/serverless";

/** Neon HTTP SQL client (template tag). */
export type NeonSql = ReturnType<typeof neon>;

let cached: NeonSql | null = null;

function resolveDatabaseUrl(): string {
  const url =
    process.env.DATABASE_URL?.trim() ?? process.env.NEON_DATABASE_URL?.trim() ?? "";
  if (!url) {
    throw new Error("DATABASE_URL or NEON_DATABASE_URL is not set");
  }
  return url;
}

/**
 * Neon SQL client (HTTP). Use from Node Route Handlers / Server Components
 * that run on the server only.
 */
export function getNeonSql(): NeonSql {
  if (cached) {
    return cached;
  }
  cached = neon(resolveDatabaseUrl());
  return cached;
}
