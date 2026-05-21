import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import siteMetadata from "@/config/site-metadata.json";
import { AppAuthProvider } from "@/components/providers/app-auth-provider";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** MVP pipeline always commits `public/brand/logo.png`; tab + OG image stay aligned with that file. */
const BRAND_LOGO_PATH = "/brand/logo.png";

/**
 * Canonical origin for metadata / OG / favicon resolution.
 * Prefer `NEXT_PUBLIC_APP_URL` (prod custom domain); on Vercel, `VERCEL_URL` is always set.
 */
function getMetadataBase(): URL | undefined {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) {
    try {
      return new URL(explicit);
    } catch {
      /* fall through */
    }
  }
  const vercel = process.env.VERCEL_URL?.trim().replace(/^https?:\/\//, "");
  if (vercel) {
    try {
      return new URL(`https://${vercel}`);
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function toAbsoluteAssetUrl(pathOrUrl: string, base: URL | undefined): string {
  const t = pathOrUrl.trim();
  if (!t) return t;
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  if (!base) return t;
  return new URL(t.startsWith("/") ? t : `/${t}`, base).href;
}

function mimeFromAssetPath(path: string): string | undefined {
  const lower = path.toLowerCase();
  if (lower.endsWith(".svg")) return "image/svg+xml";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".gif")) return "image/gif";
  return undefined;
}

export function generateMetadata(): Metadata {
  const metadataBase = getMetadataBase();
  const appName =
    typeof siteMetadata.title === "string" && siteMetadata.title.trim().length > 0
      ? siteMetadata.title.trim()
      : "Template App";
  const appTagline =
    typeof siteMetadata.description === "string" && siteMetadata.description.trim().length > 0
      ? siteMetadata.description.trim()
      : "Centralized baseline ready for idea-specific features.";

  const iconAbsolute = toAbsoluteAssetUrl(BRAND_LOGO_PATH, metadataBase);
  const mime = mimeFromAssetPath(BRAND_LOGO_PATH);
  const logoAbsolute = toAbsoluteAssetUrl(BRAND_LOGO_PATH, metadataBase);

  return {
    metadataBase,
    title: appName,
    description: appTagline,
    applicationName: appName,
    alternates: metadataBase ? { canonical: metadataBase.href } : undefined,
    openGraph: {
      type: "website",
      url: metadataBase?.href,
      title: appName,
      description: appTagline,
      siteName: appName,
      images: [{ url: logoAbsolute }],
    },
    twitter: {
      card: "summary_large_image",
      title: appName,
      description: appTagline,
      images: [logoAbsolute],
    },
    icons: {
      icon: mime ? [{ url: iconAbsolute, type: mime }] : iconAbsolute,
      apple: [{ url: iconAbsolute, sizes: "180x180" }],
      shortcut: iconAbsolute,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html
      lang="en"
      className={cn(inter.variable, geistMono.variable, "h-full antialiased")}
      suppressHydrationWarning
    >
      <body className={cn(inter.className, "flex min-h-full flex-col")}>
        <AppAuthProvider>
          {children}
          <Toaster />
        </AppAuthProvider>
      </body>
    </html>
  );
}
