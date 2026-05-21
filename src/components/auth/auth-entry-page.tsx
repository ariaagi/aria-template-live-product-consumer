import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AuthViewCard } from "@/components/auth/auth-view-card";
import { getBuildConfig } from "@/config/build-config";
import { auth } from "@/lib/auth";

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

  const hasGoogleOAuth = Boolean(
    process.env.GOOGLE_OAUTH_CLIENT_ID?.trim() &&
      process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim()
  );
  const buildConfig = getBuildConfig();
  const logoSrc = buildConfig.branding.logoUrl?.trim() || undefined;

  return (
    <main className="flex min-h-svh items-start justify-center bg-muted/40 px-4 py-6 sm:items-center sm:p-6">
      <AuthViewCard
        pathname={pathname}
        hasGoogleOAuth={hasGoogleOAuth}
        appName={buildConfig.appName}
        logoSrc={logoSrc}
      />
    </main>
  );
}
