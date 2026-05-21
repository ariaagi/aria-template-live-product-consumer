/**
 * Home-nav extension point — written by ARIA codegen during MVP build.
 *
 * The template's `home-shell.tsx` reads this file to render two persistent surfaces on `/home`:
 *   1. Header actions  → "+ New X" buttons, ALWAYS visible (empty AND populated states).
 *   2. Sub-nav tabs    → secondary nav rail under the header for child list pages.
 *
 * Why this file exists: the in-template `app-shell.tsx` ships a fixed 3-item sidebar
 * (`/home`, `/billing`, `/settings`) and is mandatory-no-modify. Without this extension point,
 * Claude has no stable way to surface child routes (e.g. `/home/checklists/new`) — so once a
 * user creates an entity, the create CTA disappears from `/home` and the only re-entry is
 * typing the URL. This file fixes that by giving Claude an additive hook into nav.
 *
 * Contract for ARIA codegen:
 *   - Add ONE entry in `homeHeaderActions` per STATIC `create`-class route in the spec's
 *     `navigation` block (label like "+ New Trust Page"). These persist regardless of data
 *     state.
 *   - Add ONE entry in `homeSubNav` per STATIC `list`-class route under `/home/...` so users
 *     can move between child list pages from the home shell.
 *   - Routes referenced here MUST exist in `primaryAppRoutes`.
 *   - Empty arrays are valid (template default).
 *
 *   **HREDS MUST BE STATIC**: hrefs containing `[bracket]` segments (e.g. `[id]`, `[slug]`)
 *   are FORBIDDEN. The /home shell has no dynamic id in scope, so `<Link href="/home/boards/[id]/listings">`
 *   navigates to that literal path and 404s at runtime (`useParams().id === "[id]"`). Link to
 *   child-of-dynamic routes from the parent detail page using a template literal:
 *   `<Link href={\`/home/boards/${board.id}/listings\`}>...</Link>`. The template's
 *   `home-shell.tsx` will silently drop any dynamic-href entry as a runtime safety net.
 */

export type HomeHeaderAction = {
  /** Short, action-oriented label rendered as a button on /home, e.g. "+ New Monitor". */
  label: string;
  /** Internal Next.js route this action navigates to (must be a `create`-class route). */
  href: string;
};

export type HomeSubNavItem = {
  /** Short label rendered in the sub-nav rail, e.g. "Monitors", "Leads". */
  label: string;
  /** Internal Next.js route this tab links to. */
  href: string;
};

export type HomeNavConfig = {
  homeHeaderActions: HomeHeaderAction[];
  homeSubNav: HomeSubNavItem[];
};

/**
 * Default empty config for the bare template. ARIA codegen replaces these arrays with the
 * actions/sub-nav derived from the MVP spec's `navigation` block.
 */
export const homeNavConfig: HomeNavConfig = {
  homeHeaderActions: [],
  homeSubNav: [],
};
