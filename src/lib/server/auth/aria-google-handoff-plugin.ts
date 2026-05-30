import { createAuthEndpoint } from "@better-auth/core/api";
import { setSessionCookie } from "better-auth/cookies";
import { handleOAuthUserInfo } from "better-auth/oauth2";
import * as z from "zod";

import { exchangeAriaGoogleHandoffCode } from "@/lib/server/auth/aria-google-broker";

const ariaGoogleHandoffQuerySchema = z.object({
  code: z.string().min(1),
});

/**
 * Completes ARIA broker Google sign-in using Better Auth session cookies
 * (signed via nextCookies) — do not set session cookies manually in route handlers.
 */
export function ariaGoogleHandoffPlugin() {
  return {
    id: "aria-google-handoff",
    endpoints: {
      ariaGoogleHandoff: createAuthEndpoint(
        "/aria-google/handoff",
        {
          method: "GET",
          query: ariaGoogleHandoffQuerySchema,
        },
        async (ctx) => {
          const code = ctx.query.code.trim();
          const exchange = await exchangeAriaGoogleHandoffCode(code);
          if (!exchange.ok) {
            throw ctx.redirect("/login?google=error");
          }

          const profile = exchange.profile;
          const email = profile.email?.trim().toLowerCase() ?? "";
          if (!email) {
            throw ctx.redirect("/login?google=error");
          }

          const result = await handleOAuthUserInfo(ctx, {
            userInfo: {
              id: profile.googleSub,
              email,
              name: profile.name?.trim() || email.split("@")[0] || "User",
              emailVerified: profile.emailVerified,
              image: profile.image ?? undefined,
            },
            account: {
              providerId: "google",
              accountId: profile.googleSub,
            },
            callbackURL: "/home",
          });

          if (result.error || !result.data) {
            throw ctx.redirect("/login?google=error");
          }

          await setSessionCookie(ctx, result.data);
          throw ctx.redirect("/home");
        }
      ),
    },
  };
}
