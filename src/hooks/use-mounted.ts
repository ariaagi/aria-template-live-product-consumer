"use client";

import { useSyncExternalStore } from "react";

/**
 * Tiny client-side hook that returns `true` after the first render — useful for code that
 * only runs in the browser (e.g. accessing `window`, `document`, `localStorage`) and
 * needs to defer until after hydration to avoid SSR mismatches.
 *
 * Provided as a baseline so the `@/hooks` alias (declared in components.json) always resolves
 * to a real directory, and so generated MVPs have a safe, idiomatic example to extend.
 *
 * Implementation note: uses `useSyncExternalStore` instead of `useState` + `useEffect` to
 * avoid the `react-hooks/set-state-in-effect` lint rule. The server snapshot returns `false`,
 * the client snapshot returns `true` — the same observable behavior, with no synchronous
 * setState inside an effect body.
 *
 * @example
 *   const mounted = useMounted();
 *   if (!mounted) return null;
 *   return <ClientOnlyChart data={data} />;
 */
const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function useMounted(): boolean {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
