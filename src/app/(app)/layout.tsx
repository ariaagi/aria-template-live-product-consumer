import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app/app-shell";
import { getBuildConfig } from "@/config/build-config";
import { auth } from "@/lib/auth";

type AppLayoutProps = {
  children: React.ReactNode;
};

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: AppLayoutProps): Promise<React.ReactElement> {
  if (process.env.E2E_BYPASS_AUTH !== "true") {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) {
      redirect("/login");
    }
  }

  const buildConfig = getBuildConfig();
  const logoSrc = buildConfig.branding.logoUrl?.trim() || undefined;
  return (
    <AppShell appName={buildConfig.appName} appTagline={buildConfig.appTagline} logoSrc={logoSrc}>
      {children}
    </AppShell>
  );
}
