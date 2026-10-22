import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components (the Next 16 default in new projects) is deliberately off.
  // Every authenticated route reads cookies() and is user-scoped, so there is
  // nothing to cache, and leaving it on forces Suspense boundaries around every
  // page for no benefit.
  cacheComponents: false,
  // Link hrefs are type-checked against real routes, so a typo in a redirect
  // target fails the build instead of 404-ing in production.
  typedRoutes: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
