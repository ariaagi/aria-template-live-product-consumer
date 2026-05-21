import { AuthEntryPage } from "@/components/auth/auth-entry-page";

export const dynamic = "force-dynamic";

export default async function LoginPage(): Promise<React.ReactElement> {
  return <AuthEntryPage pathname="sign-in" />;
}
