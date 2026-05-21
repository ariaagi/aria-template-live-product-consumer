import { UserRound } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsProfileForm } from "@/features/settings/components/settings-profile-form";

/**
 * Default Profile tab. The page header + tab strip live in `(app)/settings/layout.tsx` via
 * `SettingsShell`, so this page only renders the Profile card content.
 */
export default function SettingsPage() {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <CardTitle className="flex items-center gap-2">
          <UserRound className="h-5 w-5" />
          Profile
        </CardTitle>
        <CardDescription>
          Manage your profile preferences and account details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SettingsProfileForm />
      </CardContent>
    </Card>
  );
}
