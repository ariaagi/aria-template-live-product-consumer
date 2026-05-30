import { getEnv } from "@/lib/env";

const MVP_HANDOFF_PATH = "/api/auth/aria-google/handoff";
const MVP_GOOGLE_START_PATH = "/api/v1/mvp-auth/google/start";

export function isAriaGoogleBrokerConfigured(): boolean {
  const mvpAppId = process.env.ARIA_MVP_APP_ID?.trim() ?? "";
  const handoffSecret = process.env.ARIA_GOOGLE_HANDOFF_SECRET?.trim() ?? "";
  const { ariaApiBaseUrl } = getEnv();
  return Boolean(mvpAppId && handoffSecret && ariaApiBaseUrl.trim());
}

export function buildAriaGoogleStartHref(): string | null {
  if (!isAriaGoogleBrokerConfigured()) {
    return null;
  }
  const mvpAppId = process.env.ARIA_MVP_APP_ID!.trim();
  const { ariaApiBaseUrl, appUrl } = getEnv();
  const returnTo = `${appUrl.replace(/\/$/, "")}${MVP_HANDOFF_PATH}`;
  const start = new URL(MVP_GOOGLE_START_PATH, ariaApiBaseUrl.replace(/\/$/, ""));
  start.searchParams.set("mvpAppId", mvpAppId);
  start.searchParams.set("returnTo", returnTo);
  return start.toString();
}

export type AriaGoogleExchangeProfile = {
  googleSub: string;
  email: string | null;
  emailVerified: boolean;
  name: string | null;
  image: string | null;
};

export async function exchangeAriaGoogleHandoffCode(
  code: string
): Promise<
  | { ok: true; profile: AriaGoogleExchangeProfile }
  | { ok: false; error: string }
> {
  const mvpAppId = process.env.ARIA_MVP_APP_ID?.trim() ?? "";
  const handoffSecret = process.env.ARIA_GOOGLE_HANDOFF_SECRET?.trim() ?? "";
  const { ariaApiBaseUrl } = getEnv();
  if (!mvpAppId || !handoffSecret || !ariaApiBaseUrl.trim()) {
    return { ok: false, error: "broker_not_configured" };
  }

  const exchangeUrl = new URL(
    "/api/v1/mvp-auth/google/exchange",
    ariaApiBaseUrl.replace(/\/$/, "")
  );
  const res = await fetch(exchangeUrl.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${handoffSecret}`,
    },
    body: JSON.stringify({ mvpAppId, code }),
    cache: "no-store",
  });

  const json = (await res.json().catch(() => null)) as
    | { ok?: boolean; profile?: AriaGoogleExchangeProfile; error?: string }
    | null;

  if (!res.ok || !json?.ok || !json.profile?.googleSub) {
    return { ok: false, error: json?.error ?? "exchange_failed" };
  }

  return { ok: true, profile: json.profile };
}
