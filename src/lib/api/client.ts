import { getEnv } from "@/lib/env";

interface CreateBillingLinkPayload {
  type: "setup" | "checkout" | "portal";
  returnPath?: string;
}

interface BillingLinkResponse {
  url: string;
}

export async function createBillingLink(payload: CreateBillingLinkPayload): Promise<string> {
  const { ariaApiBaseUrl } = getEnv();
  const response = await fetch(`${ariaApiBaseUrl}/api/v1/billing/link`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to create billing link.");
  }

  const data = (await response.json()) as BillingLinkResponse;
  return data.url;
}
