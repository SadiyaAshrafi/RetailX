import type { NextConfig } from "next";

function getApiOrigin() {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!configuredUrl || configuredUrl === "/api") {
    if (process.env.VERCEL) {
      throw new Error("Set NEXT_PUBLIC_API_URL to the Render API origin before building on Vercel.");
    }
    return `http://127.0.0.1:${process.env.API_PORT || "4000"}`;
  }

  const url = new URL(configuredUrl);
  if ((url.protocol !== "http:" && url.protocol !== "https:") || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("NEXT_PUBLIC_API_URL must be an HTTP(S) origin without a path.");
  }
  return url.origin;
}

const nextConfig: NextConfig = {
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  async rewrites() {
    const apiOrigin = getApiOrigin();
    return [{ source: "/api/:path*", destination: `${apiOrigin}/api/:path*` }];
  },
};

export default nextConfig;