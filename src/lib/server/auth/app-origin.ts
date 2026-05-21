/**
 * Origin of the URL this handler was invoked with (scheme + host [+ port]).
 * Use for OAuth `redirect_uri` — avoids using Referer after Google redirects.
 */
export function getRequestOrigin(request: Request): string {
  try {
    return new URL(request.url).origin;
  } catch {
    return getAppOriginFromRequest(request);
  }
}

export function getAppOriginFromRequest(request: Request): string {
  const originHeader = request.headers.get("origin")?.trim().replace(/\/$/, "");
  if (
    originHeader &&
    (originHeader.startsWith("http://") || originHeader.startsWith("https://"))
  ) {
    return originHeader;
  }

  const referer = request.headers.get("referer")?.trim();
  if (referer) {
    try {
      const u = new URL(referer);
      return `${u.protocol}//${u.host}`.replace(/\/$/, "");
    } catch {
      // ignore malformed referer
    }
  }

  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (explicit) {
    return explicit;
  }
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    "localhost:3000";
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}
