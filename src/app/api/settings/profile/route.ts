import { z } from "zod";

import { auth } from "@/lib/auth";
import { getDbPool } from "@/lib/db";
import { errJson, okJson } from "@/lib/server/api/json-response";
import { parseJsonBody } from "@/lib/server/api/parse-body";
import { canUserRunProtectedAction } from "@/lib/server/billing/gating";

export const runtime = "nodejs";

const profileSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().max(254).optional(),
  productUpdates: z.boolean().optional(),
});

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) {
    return errJson("unauthorized", 401);
  }

  const pool = getDbPool();
  const { rows } = await pool.query<{ name: string | null; email: string | null }>(
    `SELECT name, email FROM "user" WHERE id = $1 LIMIT 1`,
    [session.user.id]
  );
  const row = rows[0];
  return okJson({
    name: row?.name ?? "",
    email: row?.email ?? "",
    productUpdates: true,
  });
}

export async function PATCH(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) {
    return errJson("unauthorized", 401);
  }
  if (!(await canUserRunProtectedAction(session.user.id))) {
    return errJson("subscription_required_for_action", 402);
  }

  const body = await parseJsonBody(request, profileSchema);

  const pool = getDbPool();
  try {
    const { rows } = await pool.query<{ name: string; email: string | null }>(
      `UPDATE "user"
       SET name = $2, "updatedAt" = now()
       WHERE id = $1
       RETURNING name, email`,
      [session.user.id, body.name]
    );
    const row = rows[0];
    return okJson({
      name: row?.name ?? body.name,
      email: row?.email ?? body.email ?? "",
      productUpdates: true,
    });
  } catch {
    return errJson("internal_error", 500);
  }
}
