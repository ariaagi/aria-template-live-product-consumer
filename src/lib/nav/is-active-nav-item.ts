/**
 * Active-nav-item rules for the template's navigation shells.
 *
 * Why this helper exists: the naive `pathname.startsWith(item.href)` lights up a
 * parent nav item AND its child simultaneously (e.g. at `/home/kits`, both `/home`
 * and `/home/kits` match), which is exactly the bug that shipped to OnboardDeck.
 * The two rules below cover every flat / nested nav layout the template needs:
 *
 *   1. Path-boundary match: `pathname` must equal `href` OR start with `href + "/"`.
 *      That way `/home` does NOT match `/home-archive`, and `/settings/api`
 *      does NOT light up the `/settings/api-keys` tab.
 *   2. Longest-href wins: when multiple flat items match (e.g. sidebar has both
 *      `/home` and `/home/kits` and the user is at `/home/kits/123`), only the
 *      most specific (`/home/kits`) is highlighted. This is what users expect:
 *      a flat sidebar should mark exactly one item active.
 *
 * Use {@link pickActiveNavHref} for any nav surface that lists peers (sidebar,
 * tab strip, breadcrumb-as-pills). Use {@link isActiveNavItem} only for nav
 * surfaces with a single item where you already know there's no parent/child
 * collision (rare).
 */

/**
 * Returns true when `pathname` belongs to the route segment owned by `href`.
 * Boundary-aware: trailing slash is implicit, so `/home` does not match
 * `/home-archive`. Use {@link pickActiveNavHref} to resolve "longest wins"
 * across a list of peers — this primitive only answers about a single item.
 */
export function isActiveNavItem(pathname: string, href: string): boolean {
  if (!pathname || !href) return false
  if (pathname === href) return true
  const sep = href.endsWith("/") ? href : `${href}/`
  return pathname.startsWith(sep)
}

/**
 * Picks the single nav item that should render as active, applying the
 * "longest match wins" rule across `hrefs`. Returns `null` when nothing
 * matches (e.g. the user is on a route the nav doesn't list).
 *
 * Example — sidebar with `["/home", "/home/kits", "/settings"]`:
 *   - at `/home`           → "/home"
 *   - at `/home/kits`      → "/home/kits" (NOT "/home")
 *   - at `/home/kits/abc`  → "/home/kits"
 *   - at `/settings`       → "/settings"
 *   - at `/settings/x`     → "/settings"
 *   - at `/dashboard`      → null
 */
export function pickActiveNavHref(
  pathname: string,
  hrefs: readonly string[]
): string | null {
  let best: string | null = null
  for (const href of hrefs) {
    if (!href) continue
    if (!isActiveNavItem(pathname, href)) continue
    if (best === null || href.length > best.length) {
      best = href
    }
  }
  return best
}
