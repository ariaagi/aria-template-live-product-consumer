"use client";

import type { ReactElement, ReactNode } from "react";

/**
 * Better Auth does not require a global provider for `authClient.useSession()`.
 * Wrapper kept for layout parity and future session UI.
 */
export function AppAuthProvider({ children }: { children: ReactNode }): ReactElement {
  return <>{children}</>;
}
