import { NextResponse } from "next/server";

import {
  exchangeAriaGoogleHandoffCode,
} from "@/lib/server/auth/aria-google-broker";
import {
  buildSessionCookieHeader,
  completeAriaGoogleHandoffSession,
} from "@/lib/server/auth/aria-google-handoff-session";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code")?.trim() ?? "";

  if (!code) {
    return NextResponse.redirect(new URL("/login?google=error", url.origin));
  }

  const exchange = await exchangeAriaGoogleHandoffCode(code);
  if (!exchange.ok) {
    return NextResponse.redirect(new URL("/login?google=error", url.origin));
  }

  try {
    const { sessionToken } = await completeAriaGoogleHandoffSession(exchange.profile);
    const res = NextResponse.redirect(new URL("/home", url.origin));
    res.headers.append("Set-Cookie", buildSessionCookieHeader(sessionToken));
    return res;
  } catch {
    return NextResponse.redirect(new URL("/login?google=error", url.origin));
  }
}
