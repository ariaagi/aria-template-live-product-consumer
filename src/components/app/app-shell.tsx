"use client";

import Image from "next/image";
import Link from "next/link";
import { PropsWithChildren, type ComponentType } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart,
  Bell,
  Book,
  Bookmark,
  Briefcase,
  Calendar,
  CreditCard,
  Dumbbell,
  FileText,
  Folder,
  Globe,
  GraduationCap,
  Heart,
  Image as ImageIcon,
  LayoutGrid,
  List,
  Map,
  Menu,
  MessageSquare,
  Music,
  Package,
  Settings,
  ShoppingBag,
  Star,
  TrendingUp,
  Trophy,
  Users,
  Video,
  Wallet,
} from "lucide-react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { extraSidebarNavItems, type SidebarIconName } from "@/config/sidebar-nav.config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { pickActiveNavHref } from "@/lib/nav/is-active-nav-item";
import { cn } from "@/lib/utils";

type IconCmp = ComponentType<{ className?: string }>;

/**
 * Stable map of `SidebarIconName` (string slug from sidebar-nav.config.ts) → lucide React component.
 * Using a string slug in the config (instead of importing icons there) keeps the config a pure
 * data file Claude can write safely without learning lucide's tree-shaken import paths.
 */
const ICON_MAP: Record<SidebarIconName, IconCmp> = {
  "layout-grid": LayoutGrid,
  list: List,
  folder: Folder,
  calendar: Calendar,
  users: Users,
  "shopping-bag": ShoppingBag,
  package: Package,
  "file-text": FileText,
  image: ImageIcon,
  music: Music,
  video: Video,
  "message-square": MessageSquare,
  bell: Bell,
  star: Star,
  heart: Heart,
  bookmark: Bookmark,
  trophy: Trophy,
  dumbbell: Dumbbell,
  book: Book,
  "graduation-cap": GraduationCap,
  briefcase: Briefcase,
  wallet: Wallet,
  "trending-up": TrendingUp,
  "bar-chart": BarChart,
  globe: Globe,
  map: Map,
};

type ResolvedNavItem = { href: string; label: string; icon: IconCmp };

const HOME_ITEM: ResolvedNavItem = { href: "/home", label: "Home", icon: LayoutGrid };
const BILLING_ITEM: ResolvedNavItem = { href: "/billing", label: "Billing", icon: CreditCard };
const SETTINGS_ITEM: ResolvedNavItem = { href: "/settings", label: "Settings", icon: Settings };

/** True iff `href` contains no Next.js dynamic-segment placeholders. */
function isStaticHref(href: string): boolean {
  return !/\[[^/\]]+\]/.test(href);
}

/**
 * Merges template baseline (Home / Billing / Settings) with extras from
 * sidebar-nav.config.ts. Extras render between Home and Billing so the IA reads
 * Home → user features → Billing → Settings. Duplicate hrefs are dropped silently
 * (template owns Home/Billing/Settings hrefs).
 *
 * **Defense in depth**: hrefs containing `[bracket]` segments (e.g. `/home/boards/[id]`)
 * are silently dropped. The sidebar renders on every page and has no dynamic id in
 * scope, so a literal `[id]` href would 404 at runtime. The ARIA spec schema +
 * audit-sidebar-nav-config catch this pre-deploy; this filter is the runtime safety net
 * for already-shipped MVPs and future regressions.
 */
function buildNavItems(): ResolvedNavItem[] {
  const baseHrefs = new Set([HOME_ITEM.href, BILLING_ITEM.href, SETTINGS_ITEM.href]);
  const seen = new Set<string>(baseHrefs);
  const extras: ResolvedNavItem[] = [];
  for (const item of extraSidebarNavItems) {
    const href = item.href.trim();
    if (!href.startsWith("/") || seen.has(href)) continue;
    if (!isStaticHref(href)) {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.warn(
          `[app-shell] dropping sidebar item with dynamic href: "${href}". ` +
            `The sidebar has no dynamic id in scope — link to it from the parent detail page using a template literal instead.`,
        );
      }
      continue;
    }
    seen.add(href);
    const icon = item.iconName ? (ICON_MAP[item.iconName] ?? Folder) : Folder;
    extras.push({ href, label: item.label, icon });
  }
  return [HOME_ITEM, ...extras, BILLING_ITEM, SETTINGS_ITEM];
}

const NAV_ITEMS = buildNavItems();

type AppShellProps = PropsWithChildren;
type AppShellBrandingProps = {
  appName: string;
  appTagline: string;
  logoSrc?: string;
};

export function AppShell({
  children,
  appName,
  appTagline,
  logoSrc,
}: AppShellProps & AppShellBrandingProps) {
  const currentPath = usePathname() ?? "/";
  const router = useRouter();
  // Resolve the single active sidebar item up-front so the desktop sidebar
  // and the mobile dropdown agree, and so children's hrefs (e.g. `/home/kits`)
  // beat their parent (`/home`) — see is-active-nav-item.ts for the rule.
  const activeHref = pickActiveNavHref(
    currentPath,
    NAV_ITEMS.map((item) => item.href)
  );

  return (
    <div className="min-h-svh bg-background">
      <div className="mx-auto grid min-h-svh max-w-7xl grid-cols-1 md:grid-cols-[220px_1fr]">
        <aside className="hidden border-r bg-muted/30 p-4 md:block">
          <div className="mb-6 flex items-center gap-2 px-1 py-1 text-sm font-medium">
            {logoSrc ? (
              <Image
                src={logoSrc}
                alt=""
                aria-hidden
                width={18}
                height={18}
                className="size-[18px] shrink-0 rounded-sm object-cover"
              />
            ) : null}
            <span>{appName}</span>
          </div>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = item.href === activeHref;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                    isActive && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="flex min-w-0 flex-col">
          <header className="flex min-w-0 items-center justify-between gap-3 border-b px-4 py-3 sm:px-6 sm:py-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 md:hidden">
                {logoSrc ? (
                  <Image
                    src={logoSrc}
                    alt=""
                    aria-hidden
                    width={22}
                    height={22}
                    className="size-[22px] shrink-0 rounded-sm object-cover"
                  />
                ) : null}
                <span className="truncate text-sm font-medium text-foreground">
                  {appName}
                </span>
              </div>
              <p className="hidden text-sm text-muted-foreground md:block">{appTagline}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="md:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button type="button" variant="outline" size="icon-sm" aria-label="Open menu" />
                    }
                  >
                    <Menu className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    {NAV_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const isActive = item.href === activeHref;
                      return (
                        <DropdownMenuItem
                          key={item.href}
                          aria-current={isActive ? "page" : undefined}
                          className={cn("cursor-pointer", isActive && "bg-muted")}
                          onClick={() => router.push(item.href)}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </DropdownMenuItem>
                      );
                    })}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="p-0 focus:bg-transparent">
                      <SignOutButton />
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="hidden md:block">
                <SignOutButton />
              </div>
            </div>
          </header>
          <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
