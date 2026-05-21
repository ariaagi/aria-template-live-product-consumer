"use client";

import { useEffect, useMemo, useState } from "react";
import { CreditCard, ExternalLink, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BuildConfig, BuildPlanConfig } from "@/types/build-config";

type BillingStatus = {
  status: string;
  tierSlug: string | null;
  stripePriceId: string | null;
  cancelAtPeriodEnd: boolean;
  cancelAt: string | null;
  canceledAt: string | null;
  isScheduledToCancel: boolean;
  willAutoRenew: boolean;
  currentPeriodEnd: string | null;
} | null;

const STRIPE_SUBSCRIPTION_ACTIVE = new Set(["active", "trialing"]);

function isSubscriptionBillingActive(sub: NonNullable<BillingStatus>): boolean {
  const s = sub.status?.trim().toLowerCase() ?? "";
  return STRIPE_SUBSCRIPTION_ACTIVE.has(s);
}

type ApiJson = {
  ok?: boolean;
  data?: {
    url?: string;
    subscription?: BillingStatus;
    stripeCustomerId?: string | null;
  };
  error?: string;
  detail?: string;
};

function portalErrorMessage(data: ApiJson): string {
  const code = data.error;
  if (code === "no_customer") {
    return "Subscribe once with “Change plan” first. After checkout, Manage billing can open the Stripe portal.";
  }
  if (code === "unauthorized") {
    return "Sign in again, then retry.";
  }
  if (code === "portal_not_configured") {
    return (
      data.detail?.trim() ||
      "Stripe Customer Portal is not configured for this account (Dashboard → Billing → Customer portal)."
    );
  }
  if (code === "portal_failed") {
    return "Could not open billing portal. Check Stripe keys and try again.";
  }
  return code ?? "portal_failed";
}

async function postJson(url: string, body?: unknown): Promise<ApiJson> {
  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : "{}",
  });
  return (await response.json()) as ApiJson;
}

export function BillingPanel({ buildConfig }: { buildConfig: BuildConfig }) {
  const [pendingCheckout, setPendingCheckout] = useState(false);
  const [pendingPortal, setPendingPortal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  /** `undefined` = billing API not loaded yet; `null` = loaded, no subscription row */
  const [subscription, setSubscription] = useState<BillingStatus | undefined>(undefined);
  const plans = useMemo(() => {
    if (buildConfig.plans && buildConfig.plans.length > 0) {
      return buildConfig.plans;
    }
    const legacyLabel = buildConfig.pricing.planName?.trim() || "Starter";
    const fallbackPlan: BuildPlanConfig = {
      tierSlug: "starter",
      displayName: legacyLabel,
      amount: buildConfig.pricing.amount,
      currency: buildConfig.pricing.currency,
      interval: "month",
      isFree: buildConfig.pricing.amount <= 0,
      stripePriceId: undefined,
    };
    return [fallbackPlan];
  }, [buildConfig]);
  const paidPlans = plans.filter((plan) => !plan.isFree && plan.amount > 0);
  const [selectedTierSlug, setSelectedTierSlug] = useState<string>("");
  const matchedPlan = useMemo(() => {
    if (!subscription?.stripePriceId) return undefined;
    return plans.find((plan) => plan.stripePriceId === subscription.stripePriceId);
  }, [plans, subscription]);

  const intervalSuffix =
    matchedPlan?.interval && subscription ? `/${matchedPlan.interval}` : "";
  const planLabel =
    subscription === undefined
      ? "Loading…"
      : subscription === null
        ? "No plan applied"
        : matchedPlan?.displayName?.trim() ||
          subscription.tierSlug?.trim() ||
          "Current subscription";
  const amount =
    matchedPlan && subscription
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: matchedPlan.currency ?? buildConfig.pricing.currency,
          maximumFractionDigits: Number.isInteger(matchedPlan.amount) ? 0 : 2,
        }).format(matchedPlan.amount)
      : null;
  const statusBadgeLabel =
    subscription === undefined
      ? "…"
      : subscription === null
        ? "Not Active"
        : isSubscriptionBillingActive(subscription)
          ? "Active"
          : "Not Active";
  const renewalHint = useMemo(() => {
    if (!subscription || subscription === undefined) return null;
    if (subscription.willAutoRenew) {
      return "Auto-renew is on";
    }
    if (subscription.isScheduledToCancel) {
      return "Scheduled to end at period end";
    }
    return null;
  }, [subscription]);
  const supportEmail = buildConfig.supportEmail?.trim() || null;
  const selectedTierSlugForCheckout =
    selectedTierSlug && paidPlans.some((plan) => plan.tierSlug === selectedTierSlug)
      ? selectedTierSlug
      : paidPlans[0]?.tierSlug ?? "";

  const selectedPlanForCheckout = useMemo(() => {
    const slug = selectedTierSlugForCheckout;
    return paidPlans.find((plan) => plan.tierSlug === slug) ?? paidPlans[0];
  }, [paidPlans, selectedTierSlugForCheckout]);

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/billing/status", {
        credentials: "include",
      });
      const data = (await response.json()) as {
        ok?: boolean;
        data?: { subscription?: BillingStatus };
      };
      if (response.ok && data?.ok) {
        setSubscription(data.data?.subscription ?? null);
      } else {
        setSubscription(null);
      }
    })();
  }, []);

  return (
    <section className="min-w-0 max-w-full space-y-6">
      <header className="space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <h1 className="min-w-0 text-xl font-semibold tracking-tight sm:text-2xl">
            Billing
          </h1>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="-mr-2 ml-auto shrink-0 sm:-mr-0"
            onClick={async () => {
              const response = await fetch("/api/billing/status", {
                credentials: "include",
              });
              const data = (await response.json()) as {
                ok?: boolean;
                data?: { subscription?: BillingStatus };
              };
              if (response.ok && data?.ok) {
                setSubscription(data.data?.subscription ?? null);
              } else {
                setSubscription(null);
              }
            }}
          >
            Refresh billing status
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage your plan, payments, and subscription details.
        </p>
      </header>

      <Card className="min-w-0">
        <CardHeader className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex shrink-0 items-center gap-2 text-balance">
            <CreditCard className="size-5 shrink-0" />
            <span>Current plan</span>
          </CardTitle>
          <div className="flex min-w-0 w-full flex-wrap items-center gap-x-3 gap-y-2 sm:w-auto sm:justify-end">
            <p className="font-medium">{planLabel}</p>
            {amount !== null && subscription ? (
              <p className="text-sm whitespace-nowrap text-muted-foreground">
                {`${amount}${intervalSuffix}`}
              </p>
            ) : null}
            <Badge
              variant={statusBadgeLabel === "Active" ? "default" : "secondary"}
              className="shrink-0"
            >
              {statusBadgeLabel}
            </Badge>
            {renewalHint ? (
              <p className="w-full text-xs text-muted-foreground sm:w-auto">{renewalHint}</p>
            ) : null}
          </div>
        </CardHeader>
      </Card>

      <div className="flex min-w-0 w-full flex-col gap-3 lg:flex-row lg:items-center lg:gap-3">
        <div className="flex min-h-10 min-w-0 w-full shrink-0 items-center gap-2 lg:flex-1">
          <span className="pt-px text-xs leading-none whitespace-nowrap text-muted-foreground">
            Choose plan
          </span>
          <Select
            value={selectedTierSlugForCheckout}
            onValueChange={(value) => setSelectedTierSlug(value ?? "")}
            disabled={pendingCheckout || paidPlans.length <= 1}
          >
            <SelectTrigger
              size="lg"
              className="min-w-0 w-full flex-1 justify-between rounded-lg pr-3 text-sm [&_[data-slot=select-value]]:truncate"
              aria-label="Choose plan"
            >
              <SelectValue>
                {selectedPlanForCheckout
                  ? `${selectedPlanForCheckout.displayName} - ${selectedPlanForCheckout.amount} ${selectedPlanForCheckout.currency.toUpperCase()}/month`
                  : "Choose plan"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent
              side="bottom"
              align="start"
              alignItemWithTrigger={false}
              collisionAvoidance={{ align: "shift", side: "none" }}
              className="w-[min(var(--anchor-width),calc(100vw-2rem))]"
            >
              {paidPlans.map((plan) => (
                <SelectItem key={plan.tierSlug} value={plan.tierSlug}>
                  {plan.displayName} - {plan.amount} {plan.currency.toUpperCase()}/month
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          className="h-10 w-full shrink-0 justify-between lg:w-auto lg:min-w-[10.5rem]"
          type="button"
          disabled={pendingCheckout || paidPlans.length < 1}
          onClick={async () => {
            setPendingCheckout(true);
            setErrorMessage(null);
            try {
              const targetTierSlug = selectedTierSlugForCheckout || paidPlans[0]?.tierSlug;
              const data = await postJson("/api/billing/checkout-session", {
                tierSlug: targetTierSlug,
              });
              const checkoutUrl = data?.data?.url;
              if (!data?.ok || !checkoutUrl) {
                setErrorMessage(data?.error ?? "checkout_failed");
                return;
              }
              window.location.href = checkoutUrl;
            } catch {
              setErrorMessage("checkout_failed");
            } finally {
              setPendingCheckout(false);
            }
          }}
        >
          {pendingCheckout ? "Redirecting..." : "Change plan"}
          <Sparkles className="h-4 w-4" />
        </Button>
        <Button
          className="h-10 w-full shrink-0 justify-between lg:w-auto lg:min-w-[10.5rem]"
          type="button"
          variant="outline"
          disabled={pendingPortal}
          onClick={async () => {
            setPendingPortal(true);
            setErrorMessage(null);
            try {
              const data = await postJson("/api/billing/portal");
              const portalUrl = data?.data?.url;
              if (data?.ok && portalUrl) {
                window.location.href = portalUrl;
                return;
              }
              setErrorMessage(portalErrorMessage(data));
            } catch {
              setErrorMessage("portal_failed");
            } finally {
              setPendingPortal(false);
            }
          }}
        >
          Manage billing
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-2">
        {errorMessage ? (
          <p className="text-sm text-rose-500">{errorMessage}</p>
        ) : null}
        {supportEmail ? (
          <p className="text-xs text-muted-foreground">
            Need help? Contact <a className="underline" href={`mailto:${supportEmail}`}>{supportEmail}</a>
          </p>
        ) : null}
      </div>
    </section>
  );
}
