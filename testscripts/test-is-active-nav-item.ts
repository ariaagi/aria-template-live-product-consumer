/**
 * Tests for the active-nav-item helper used by app-shell, home-shell, and
 * settings-shell. Covers the bug class that shipped to OnboardDeck (sidebar lit
 * up both Home and Kits at /home/kits) and adjacent edge cases:
 *   - parent / child collision (`/home` vs `/home/kits`)
 *   - prefix-without-boundary (`/home` should not match `/home-archive`)
 *   - sibling collision with shared prefix (`/settings/api` vs `/settings/api-keys`)
 *   - longest-match wins
 *
 * Run from the template repo root:
 *   npx tsx testscripts/test-is-active-nav-item.ts
 */
import {
  isActiveNavItem,
  pickActiveNavHref,
} from "../src/lib/nav/is-active-nav-item";

let failures = 0;
function assert(cond: boolean, msg: string): void {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    failures += 1;
  }
}

function main(): void {
  assert(isActiveNavItem("/home", "/home"), "exact match on /home");
  assert(isActiveNavItem("/home/kits", "/home/kits"), "exact match on /home/kits");
  assert(isActiveNavItem("/home/kits/abc", "/home/kits"), "child of /home/kits");
  assert(isActiveNavItem("/home/kits", "/home"), "child path matches parent (boundary)");

  assert(
    !isActiveNavItem("/home-archive", "/home"),
    "boundary: /home-archive must not match /home"
  );
  assert(
    !isActiveNavItem("/settings/api", "/settings/api-keys"),
    "boundary: /settings/api must not match /settings/api-keys"
  );
  assert(
    !isActiveNavItem("/settings/api-keys-archive", "/settings/api-keys"),
    "boundary: /settings/api-keys-archive must not match /settings/api-keys"
  );

  assert(!isActiveNavItem("", "/home"), "empty pathname → not active");
  assert(!isActiveNavItem("/home", ""), "empty href → not active");

  const sidebar = ["/home", "/home/kits", "/home/templates", "/settings"];

  assert(
    pickActiveNavHref("/home/kits", sidebar) === "/home/kits",
    "longest-wins: /home/kits beats /home at /home/kits"
  );
  assert(
    pickActiveNavHref("/home/kits/abc", sidebar) === "/home/kits",
    "longest-wins: /home/kits beats /home at /home/kits/abc"
  );
  assert(
    pickActiveNavHref("/home", sidebar) === "/home",
    "longest-wins: /home active at /home itself"
  );
  assert(
    pickActiveNavHref("/home/templates", sidebar) === "/home/templates",
    "longest-wins: /home/templates beats /home"
  );
  assert(
    pickActiveNavHref("/settings/api-keys", sidebar) === "/settings",
    "longest-wins: /settings is longest match for /settings/api-keys"
  );
  assert(
    pickActiveNavHref("/home-archive", sidebar) === null,
    "no match: /home-archive does not match /home (boundary)"
  );
  assert(
    pickActiveNavHref("/dashboard", sidebar) === null,
    "no match: route the nav doesn't list returns null"
  );

  const settingsTabs = ["/settings", "/settings/api-keys"];
  assert(
    pickActiveNavHref("/settings", settingsTabs) === "/settings",
    "settings tabs: /settings → Profile"
  );
  assert(
    pickActiveNavHref("/settings/api-keys", settingsTabs) === "/settings/api-keys",
    "settings tabs: /settings/api-keys → API Keys (NOT Profile)"
  );
  assert(
    pickActiveNavHref("/settings/api-keys/edit", settingsTabs) === "/settings/api-keys",
    "settings tabs: /settings/api-keys/edit still lights API Keys"
  );

  if (failures > 0) {
    console.error(`\n${String(failures)} assertion(s) failed.`);
    process.exit(1);
  }
  console.log("is-active-nav-item OK");
}

main();
