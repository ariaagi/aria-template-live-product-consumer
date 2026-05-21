import { AuthEntryPage } from "@/components/auth/auth-entry-page";

export const dynamic = "force-dynamic";

export default async function SignUpPage(): Promise<React.ReactElement> {
  return <AuthEntryPage pathname="sign-up" />;
}
