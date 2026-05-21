import { auth } from "@/lib/auth";
import { errJson, okJson } from "@/lib/server/api/json-response";
import { getUserBillingSnapshot } from "@/lib/server/billing/subscriptions-store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) {
    return errJson("unauthorized", 401);
  }

  const snapshot = await getUserBillingSnapshot(session.user.id);
  return okJson(snapshot);
}
