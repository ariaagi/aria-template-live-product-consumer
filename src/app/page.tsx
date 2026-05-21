import { AuthEntryPage } from "@/components/auth/auth-entry-page";

export const dynamic = "force-dynamic";

/**
 * Same entry as `/login`. A server `redirect("/login")` here returned 3xx with no HTML body, so link
 * previews for `/` missed OG tags; crawlers that followed still worked, but behavior differed from
 * sharing `/login` directly.
 */
export default async function HomePage(): Promise<React.ReactElement> {
  return <AuthEntryPage pathname="sign-in" />;
}
