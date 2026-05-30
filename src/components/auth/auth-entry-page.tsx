import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AuthViewCard } from "@/components/auth/auth-view-card";
import { getBuildConfig } from "@/config/build-config";
import { auth } from "@/lib/auth";
import {
  buildAriaGoogleStartHref,
  isAriaGoogleBrokerConfigured,
} from "@/lib/server/auth/aria-google-broker";

type AuthEntryPageProps = {
  pathname: "sign-in" | "sign-up";
};

export async function AuthEntryPage({
  pathname,
}: AuthEntryPageProps): Promise<React.ReactElement> {
  if (process.env.E2E_BYPASS_AUTH === "true") {
    redirect("/home");
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (session) {
    redirect("/home");
  }

  const googleStartHref = isAriaGoogleBrokerConfigured()
    ? buildAriaGoogleStartHref()
    : null;
  const buildConfig = getBuildConfig();
  const logoSrc = buildConfig.branding.logoUrl?.trim() || undefined;

  return (
    <main className="flex min-h-svh items-start justify-center bg-muted/40 px-4 py-6 sm:items-center sm:p-6">
      <AuthViewCard
        pathname={pathname}
        googleStartHref={googleStartHref}
        appName={buildConfig.appName}
        logoSrc={logoSrc}
      />
    </main>
  );
}
