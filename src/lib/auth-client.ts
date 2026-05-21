"use client";

import { createAuthClient } from "better-auth/react";

/**
 * Do not pass a fixed `baseURL` from `NEXT_PUBLIC_APP_URL` — in dev the app may
 * run on another port (e.g. 3001), which causes `Failed to fetch` when the
 * client calls the wrong origin. With no `baseURL`, Better Auth uses
 * `window.location.origin` in the browser.
 *
 * @see better-auth getBaseURL (uses `window.location` when `url` is omitted)
 */
export const authClient = createAuthClient({});
