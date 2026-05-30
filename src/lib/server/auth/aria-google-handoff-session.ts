import { createHash, randomBytes } from "node:crypto";

import { Pool } from "pg";
import { generateId } from "@better-auth/core/utils/id";

import type { AriaGoogleExchangeProfile } from "@/lib/server/auth/aria-google-broker";

let pool: Pool | null = null;

function getDatabasePool(): Pool {
  const connectionString =
    process.env.DATABASE_URL?.trim() ||
    process.env.NEON_DATABASE_URL?.trim() ||
    "";
  if (!connectionString) {
    throw new Error("DATABASE_URL is required for Google handoff sign-in.");
  }
  if (!pool) {
    pool = new Pool({ connectionString });
  }
  return pool;
}

function sessionCookieName(): string {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.BETTER_AUTH_URL?.trim() ||
    "";
  const secure =
    process.env.NODE_ENV === "production" ||
    appUrl.startsWith("https://");
  return `${secure ? "__Secure-" : ""}better-auth.session_token`;
}

const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

export async function completeAriaGoogleHandoffSession(
  profile: AriaGoogleExchangeProfile
): Promise<{ sessionToken: string }> {
  const db = getDatabasePool();
  const email = profile.email?.trim().toLowerCase() ?? null;
  const displayName =
    profile.name?.trim() ||
    (email ? email.split("@")[0] : "User");

  const accountRows = (await db.query<{
    userId: string;
  }>(
    `SELECT "userId" AS "userId"
     FROM account
     WHERE "providerId" = 'google' AND "accountId" = $1
     LIMIT 1`,
    [profile.googleSub]
  )).rows;

  let userId = accountRows[0]?.userId;

  if (!userId && email) {
    const emailRows = (await db.query<{ id: string }>(
      `SELECT id FROM "user" WHERE lower(email) = $1 LIMIT 1`,
      [email]
    )).rows;
    userId = emailRows[0]?.id;
  }

  if (!userId) {
    userId = generateId();
    await db.query(
      `INSERT INTO "user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, now(), now())`,
      [userId, displayName, email, profile.emailVerified, profile.image ?? null]
    );
    await db.query(
      `INSERT INTO account (
         id, "accountId", "providerId", "userId", "createdAt", "updatedAt"
       ) VALUES ($1, $2, 'google', $3, now(), now())`,
      [generateId(), profile.googleSub, userId]
    );
  } else {
    await db.query(
      `UPDATE "user"
       SET
         name = COALESCE(NULLIF($2, ''), name),
         email = COALESCE($3, email),
         "emailVerified" = CASE WHEN $4 THEN true ELSE "emailVerified" END,
         image = COALESCE($5, image),
         "updatedAt" = now()
       WHERE id = $1`,
      [userId, displayName, email, profile.emailVerified, profile.image ?? null]
    );

    const linked = (await db.query<{ id: string }>(
      `SELECT id FROM account
       WHERE "userId" = $1 AND "providerId" = 'google' AND "accountId" = $2
       LIMIT 1`,
      [userId, profile.googleSub]
    )).rows[0];

    if (!linked) {
      await db.query(
        `INSERT INTO account (
           id, "accountId", "providerId", "userId", "createdAt", "updatedAt"
         ) VALUES ($1, $2, 'google', $3, now(), now())`,
        [generateId(), profile.googleSub, userId]
      );
    }
  }

  const sessionToken = randomBytes(32).toString("hex");
  const sessionId = generateId();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SEC * 1000);

  await db.query(
    `INSERT INTO session (
       id, "expiresAt", token, "createdAt", "updatedAt", "userId"
     ) VALUES ($1, $2, $3, now(), now(), $4)`,
    [sessionId, expiresAt.toISOString(), sessionToken, userId]
  );

  return { sessionToken };
}

export function buildSessionCookieHeader(sessionToken: string): string {
  const name = sessionCookieName();
  const parts = [
    `${name}=${sessionToken}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${SESSION_MAX_AGE_SEC}`,
  ];
  if (name.startsWith("__Secure-")) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}
