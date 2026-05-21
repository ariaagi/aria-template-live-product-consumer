import { Pool } from "pg";

let pool: Pool | null = null;

export function getDbPool(): Pool {
  const connectionString =
    process.env.DATABASE_URL?.trim() || process.env.NEON_DATABASE_URL?.trim() || "";
  if (!connectionString) {
    throw new Error("Set DATABASE_URL (or NEON_DATABASE_URL) for database access.");
  }
  if (!pool) {
    pool = new Pool({ connectionString });
  }
  return pool;
}
