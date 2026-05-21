import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure `aria-build.config.json` and brand assets are available if code uses `readFileSync`
  // (see `getBuildConfig`); Vercel serverless tracing can omit unimported root files without this.
  outputFileTracingIncludes: {
    "/*": ["./aria-build.config.json"],
  },
  /**
   * Legacy `/dashboard` route removed — shell is `/home`. Keep redirects so bookmarks and
   * external links never 404.
   */
  async redirects() {
    return [
      { source: "/dashboard", destination: "/home", permanent: true },
      { source: "/dashboard/:path*", destination: "/home", permanent: true },
    ];
  },
};

export default nextConfig;
